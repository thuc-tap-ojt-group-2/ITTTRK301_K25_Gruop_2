from typing import List
from app.database import get_db
from app.models import RevokedToken, User
from app.security import ALGORITHM, SECRET_KEY
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session

# Đường dẫn Swagger dùng để lấy token đăng nhập
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# AUTH-03: Dependency giải mã JWT và lấy user hiện tại
def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token xác thực không hợp lệ hoặc đã hết hạn",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError as exc:
        raise credentials_exception from exc

    token_id = payload.get("jti")
    user_id = payload.get("user_id")
    username = payload.get("sub")
    if not token_id or (user_id is None and not username):
        raise credentials_exception

    if db.query(RevokedToken).filter(RevokedToken.jti == token_id).first():
        raise credentials_exception

    user_query = db.query(User)
    if user_id is not None:
        current_user = user_query.filter(User.id == user_id).first()
    else:
        current_user = user_query.filter(User.username == username).first()

    if current_user is None or current_user.is_locked:
        raise credentials_exception

    return current_user


# AUTH-05: Class dependency kiểm tra quyền (Role-Based Access Control)
class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        role = "READER" if current_user.role == "USER" else current_user.role
        allowed_roles = {
            "READER" if allowed_role == "USER" else allowed_role
            for allowed_role in self.allowed_roles
        }
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền thực hiện hành động này",
            )
        return current_user