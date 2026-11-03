"""Kiem thu AuthService bang doi tuong gia (khong can MySQL). Chay: python -m unittest discover -s tests -v
hoac pytest."""
import unittest
from typing import Optional

from app.domain import UserData
from app.exceptions import BusinessError, ForbiddenError, UnauthorizedError
from app.services.auth_service import AuthService


class FakeUserRepository:
    def __init__(self):
        self.users: list[UserData] = []
        self.next_id = 1

    def find_by_email(self, email: str) -> Optional[UserData]:
        return next((u for u in self.users if u.email == email), None)

    def exists_by_email(self, email: str) -> bool:
        return self.find_by_email(email) is not None

    def exists_by_student_code(self, student_code: str) -> bool:
        return any(u.student_code == student_code for u in self.users)

    def add(self, user: UserData) -> UserData:
        user.id = self.next_id
        self.next_id += 1
        self.users.append(user)
        return user


class FakeHasher:
    def hash(self, raw_password: str) -> str:
        return "hashed:" + raw_password

    def verify(self, raw_password: str, password_hash: str) -> bool:
        return password_hash == "hashed:" + raw_password


class FakeTokens:
    def create(self, user_id, email, role) -> str:
        return f"token-{user_id}-{role}"


class AuthServiceTest(unittest.TestCase):
    def setUp(self):
        self.repo = FakeUserRepository()
        self.service = AuthService(self.repo, FakeHasher(), FakeTokens())

    def register_default(self, email="a@ptit.edu.vn", code="B21DCCN001"):
        return self.service.register(" Nguyễn Văn A ", code, email, "123456")

    def test_register_success_hashes_password_and_sets_reader_role(self):
        user = self.register_default(email=" A@PTIT.edu.vn ")
        self.assertEqual("a@ptit.edu.vn", user.email)
        self.assertEqual("Nguyễn Văn A", user.full_name)
        self.assertEqual("hashed:123456", user.password_hash)
        self.assertEqual("READER", user.role)
        self.assertEqual(1, user.id)

    def test_register_duplicate_email_is_rejected(self):
        self.register_default()
        with self.assertRaises(BusinessError):
            self.register_default(code="B21DCCN002")
        self.assertEqual(1, len(self.repo.users))

    def test_register_duplicate_email_ignores_case(self):
        self.register_default()
        with self.assertRaises(BusinessError):
            self.register_default(email="A@PTIT.EDU.VN", code="B21DCCN002")

    def test_register_duplicate_student_code_is_rejected(self):
        self.register_default()
        with self.assertRaises(BusinessError):
            self.register_default(email="b@ptit.edu.vn")

    def test_login_success_returns_token(self):
        self.register_default()
        result = self.service.login("A@ptit.edu.vn", "123456")
        self.assertEqual("token-1-READER", result["token"])
        self.assertEqual(1, result["user_id"])
        self.assertEqual("READER", result["role"])

    def test_login_wrong_password_is_unauthorized(self):
        self.register_default()
        with self.assertRaises(UnauthorizedError):
            self.service.login("a@ptit.edu.vn", "sai")

    def test_login_unknown_email_is_unauthorized_with_same_message(self):
        self.register_default()
        with self.assertRaises(UnauthorizedError) as unknown:
            self.service.login("x@ptit.edu.vn", "123456")
        with self.assertRaises(UnauthorizedError) as wrong:
            self.service.login("a@ptit.edu.vn", "sai")
        self.assertEqual(unknown.exception.message, wrong.exception.message)

    def test_login_locked_account_is_forbidden(self):
        user = self.register_default()
        user.locked = True
        with self.assertRaises(ForbiddenError):
            self.service.login("a@ptit.edu.vn", "123456")

    def test_locked_account_with_wrong_password_does_not_reveal_lock(self):
        user = self.register_default()
        user.locked = True
        with self.assertRaises(UnauthorizedError):
            self.service.login("a@ptit.edu.vn", "sai")


if __name__ == "__main__":
    unittest.main()
