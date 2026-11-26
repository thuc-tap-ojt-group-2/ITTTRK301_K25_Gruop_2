from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import RoleChecker
from app.log_service import create_system_log
from app.models import AuditLog, User
from app.schemas import (
    AdminUserResponse,
    AuditLogResponse,
    UserLockUpdateRequest,
    UserRoleUpdateRequest,
)

router = APIRouter(prefix="/api/admin", tags=["Administration"])
admin_only = RoleChecker(["ADMIN"])


@router.get("/users", response_model=List[AdminUserResponse])
def list_users(
    db: Session = Depends(get_db),
    _current_user: User = Depends(admin_only),
):
    return db.query(User).order_by(User.id.asc()).all()


@router.put("/users/{user_id}/role", response_model=AdminUserResponse)
def update_user_role(
    user_id: int,
    role_update: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quản trị viên không thể tự đổi vai trò của mình",
        )
    user = db.query(User).filter(User.id == user_id).with_for_update().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tài khoản",
        )

    previous_role = user.role
    user.role = role_update.role
    create_system_log(
        db,
        action="UPDATE_USER_ROLE",
        resource="USER",
        user_id=current_user.id,
        details=f"Đổi vai trò tài khoản {user.id}: {previous_role} -> {user.role}",
    )
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}/lock", response_model=AdminUserResponse)
def update_user_lock(
    user_id: int,
    lock_update: UserLockUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    if user_id == current_user.id and lock_update.is_locked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quản trị viên không thể tự khóa tài khoản của mình",
        )
    user = db.query(User).filter(User.id == user_id).with_for_update().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy tài khoản",
        )

    user.is_locked = lock_update.is_locked
    create_system_log(
        db,
        action="LOCK_USER" if user.is_locked else "UNLOCK_USER",
        resource="USER",
        user_id=current_user.id,
        details=f"{'Khóa' if user.is_locked else 'Mở khóa'} tài khoản {user.id}",
    )
    db.commit()
    db.refresh(user)
    return user


@router.get("/logs", response_model=List[AuditLogResponse])
def list_audit_logs(
    limit: int = Query(10, ge=1, le=10),
    db: Session = Depends(get_db),
    _current_user: User = Depends(admin_only),
):
    entries = (
        db.query(AuditLog, User.full_name, User.username)
        .outerjoin(User, User.id == AuditLog.actor_id)
        .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": log.id,
            "actor_id": log.actor_id,
            "actor_name": (
                f"{full_name} ({username})"
                if full_name and username
                else username
                or (
                    f"Tài khoản #{log.actor_id} (không còn tồn tại)"
                    if log.actor_id is not None
                    else "Khách / tài khoản không xác định"
                )
            ),
            "action": log.action,
            "detail": log.detail,
            "created_at": log.created_at,
        }
        for log, full_name, username in entries
    ]
