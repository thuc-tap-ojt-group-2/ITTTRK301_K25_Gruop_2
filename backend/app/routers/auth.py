from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app import auth_service, schemas
from app.dependencies import get_current_user, oauth2_scheme
from app.log_service import create_system_log
from app.models import RevokedToken, User

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    user_data: schemas.UserRegister,
    db: Session = Depends(get_db),
):
    username = user_data.username.strip()
    email = user_data.email.strip().lower()
    existing_user = (
        db.query(User)
        .filter(
            or_(
                User.username == username,
                func.lower(User.email) == email,
            )
        )
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên đăng nhập hoặc email đã tồn tại",
        )

    new_user = User(
        username=username,
        email=email,
        password_hash=auth_service.hash_password(user_data.password),
        full_name=user_data.full_name,
        role="READER",
        is_locked=False,
    )
    db.add(new_user)
    try:
        db.flush()
        create_system_log(
            db,
            action="REGISTER",
            resource="USER",
            user_id=new_user.id,
            details="Đăng ký tài khoản độc giả",
        )
        db.commit()
        db.refresh(new_user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên đăng nhập hoặc email đã tồn tại",
        ) from exc

    return {
        "message": "Đăng ký tài khoản thành công",
        "user_id": new_user.id,
    }


@router.post("/login", response_model=schemas.TokenResponse)
def login(
    login_data: schemas.UserLogin,
    db: Session = Depends(get_db),
):
    identifier = login_data.username.strip()
    user = (
        db.query(User)
        .filter(
            or_(
                User.username == identifier,
                func.lower(User.email) == identifier.lower(),
            )
        )
        .first()
    )
    if (
        user is None
        or user.is_locked
        or not auth_service.verify_password(login_data.password, user.password_hash)
    ):
        create_system_log(
            db,
            action="LOGIN_FAILED",
            resource="AUTH",
            user_id=user.id if user else None,
            details="Đăng nhập thất bại",
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai thông tin đăng nhập hoặc tài khoản không thể đăng nhập",
        )

    token = auth_service.create_access_token(
        data={
            "sub": user.username,
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "student_id": user.username,
            "role": "READER" if user.role == "USER" else user.role,
        }
    )
    create_system_log(
        db,
        action="LOGIN",
        resource="AUTH",
        user_id=user.id,
        details="Đăng nhập thành công",
    )
    db.commit()
    return {
        "access_token": token,
        "token_type": "bearer",
        "message": "Đăng nhập thành công",
    }


@router.post("/logout")
def logout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    token: str = Depends(oauth2_scheme),
):
    payload = auth_service.decode_access_token(token)
    token_id = payload["jti"]
    expires_at = datetime.fromtimestamp(payload["exp"], timezone.utc)
    db.query(RevokedToken).filter(
        RevokedToken.expires_at <= datetime.now(timezone.utc)
    ).delete(synchronize_session=False)
    if not db.query(RevokedToken).filter(RevokedToken.jti == token_id).first():
        db.add(RevokedToken(jti=token_id, expires_at=expires_at))
    create_system_log(
        db,
        action="LOGOUT",
        resource="AUTH",
        user_id=current_user.id,
        details="Đăng xuất",
    )
    db.commit()
    return {"message": "Đăng xuất thành công"}


@router.put("/password")
def change_password(
    password_data: schemas.PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not auth_service.verify_password(
        password_data.current_password, current_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu hiện tại không chính xác",
        )

    current_user.password_hash = auth_service.hash_password(password_data.new_password)
    create_system_log(
        db,
        action="CHANGE_PASSWORD",
        resource="USER",
        user_id=current_user.id,
        details="Đổi mật khẩu",
    )
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}