"""Doi tuong nghiep vu thuan Python, khong phu thuoc FastAPI hay SQLAlchemy (de kiem thu don gian)."""
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class Role(str, Enum):
    READER = "READER"
    LIBRARIAN = "LIBRARIAN"
    ADMIN = "ADMIN"


@dataclass
class UserData:
    id: Optional[int]
    full_name: str
    student_code: str
    email: str
    password_hash: str
    role: str = Role.READER.value
    locked: bool = False
