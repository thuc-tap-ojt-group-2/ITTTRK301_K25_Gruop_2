from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain import UserData
from app.exceptions import BusinessError
from app.models import UserModel


def _to_data(model: UserModel) -> UserData:
    return UserData(
        id=model.id,
        full_name=model.full_name,
        student_code=model.student_code,
        email=model.email,
        password_hash=model.password_hash,
        role=model.role,
        locked=model.locked,
    )


class UserRepository:
    def __init__(self, db: Session):
        self._db = db

    def find_by_email(self, email: str) -> Optional[UserData]:
        model = self._db.scalars(select(UserModel).where(UserModel.email == email)).first()
        return _to_data(model) if model else None

    def exists_by_email(self, email: str) -> bool:
        return self._db.scalars(select(UserModel.id).where(UserModel.email == email)).first() is not None

    def exists_by_student_code(self, student_code: str) -> bool:
        return self._db.scalars(select(UserModel.id).where(UserModel.student_code == student_code)).first() is not None

    def add(self, user: UserData) -> UserData:
        model = UserModel(
            full_name=user.full_name,
            student_code=user.student_code,
            email=user.email,
            password_hash=user.password_hash,
            role=user.role,
            locked=user.locked,
        )
        self._db.add(model)
        try:
            self._db.commit()
        except IntegrityError:  # hai nguoi dang ky cung luc, rang buoc duy nhat cua CSDL chan lai
            self._db.rollback()
            raise BusinessError("Email hoặc mã sinh viên đã được đăng ký")
        self._db.refresh(model)
        return _to_data(model)
