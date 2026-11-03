"""AUTH-01 dang ky, AUTH-02 dang nhap, AUTH-04 bam mat khau, BR08 tai khoan khoa, BR09 mac dinh READER.

Lop nay chi dung doi tuong duoc truyen vao (repository, hasher, tokens) nen kiem thu duoc bang doi tuong gia.
"""
from app import constants
from app.domain import Role, UserData
from app.exceptions import BusinessError, ForbiddenError, UnauthorizedError


def normalize_email(email: str) -> str:
    return email.strip().lower()


class AuthService:
    def __init__(self, users, hasher, tokens):
        self._users = users
        self._hasher = hasher
        self._tokens = tokens

    def register(self, full_name: str, student_code: str, email: str, password: str) -> UserData:
        email = normalize_email(email)
        student_code = student_code.strip()

        if self._users.exists_by_email(email):
            raise BusinessError("Email đã được đăng ký")
        if self._users.exists_by_student_code(student_code):
            raise BusinessError("Mã sinh viên đã được đăng ký")

        user = UserData(
            id=None,
            full_name=full_name.strip(),
            student_code=student_code,
            email=email,
            password_hash=self._hasher.hash(password),
            role=Role.READER.value,  # BR09: tu dang ky luon la READER
        )
        return self._users.add(user)

    def login(self, email: str, password: str) -> dict:
        user = self._users.find_by_email(normalize_email(email))
        # Cung mot thong bao cho "khong co tai khoan" va "sai mat khau" de khong lo tai khoan nao ton tai
        if user is None or not self._hasher.verify(password, user.password_hash):
            raise UnauthorizedError(constants.MSG_BAD_CREDENTIALS)
        if user.locked:  # BR08
            raise ForbiddenError("Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên")
        token = self._tokens.create(user.id, user.email, user.role)
        return {"token": token, "user_id": user.id, "full_name": user.full_name, "role": user.role}
