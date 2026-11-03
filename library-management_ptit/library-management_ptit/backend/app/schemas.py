"""Doi tuong request, response. JSON dung camelCase (fullName, studentCode) theo docs/api-mau.md."""
import re

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel

from app import constants
from app.domain import UserData

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class RegisterRequest(CamelModel):
    full_name: str
    student_code: str
    email: str
    password: str

    @field_validator("full_name")
    @classmethod
    def check_full_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Họ tên không được để trống")
        if len(value) > 100:
            raise ValueError("Họ tên tối đa 100 ký tự")
        return value

    @field_validator("student_code")
    @classmethod
    def check_student_code(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Mã sinh viên không được để trống")
        if len(value) > 20:
            raise ValueError("Mã sinh viên tối đa 20 ký tự")
        return value

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Email không được để trống")
        if len(value) > 100 or not EMAIL_PATTERN.match(value):
            raise ValueError("Email không đúng định dạng")
        return value

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        if not value:
            raise ValueError("Mật khẩu không được để trống")
        if not constants.MIN_PASSWORD_LENGTH <= len(value) <= constants.MAX_PASSWORD_LENGTH:
            raise ValueError(
                f"Mật khẩu phải từ {constants.MIN_PASSWORD_LENGTH} đến {constants.MAX_PASSWORD_LENGTH} ký tự")
        if len(value.encode("utf-8")) > constants.MAX_PASSWORD_BYTES:
            raise ValueError("Mật khẩu quá dài, hãy dùng ít ký tự có dấu hơn")
        return value


class LoginRequest(CamelModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def check_email(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Email không được để trống")
        return value

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        if not value:
            raise ValueError("Mật khẩu không được để trống")
        return value


class UserResponse(CamelModel):
    id: int
    full_name: str
    student_code: str
    email: str
    role: str

    @classmethod
    def from_data(cls, user: UserData) -> "UserResponse":
        return cls(id=user.id, full_name=user.full_name, student_code=user.student_code,
                   email=user.email, role=user.role)


class AuthResponse(CamelModel):
    token: str
    user_id: int
    full_name: str
    role: str

class ChangePasswordRequest(CamelModel):
    old_password:str
    new_password:str 
    @field_validator("old_password")
    @classmethod
    def check_old_password(cls,value:str)->str:
        if not value:
            raise ValueError("Mật khẩu cũ không được để trống")
        return value 
    @field_validator("new_password")
    @classmethod
    def check_new_password(cls,value:str)->str:
        if not value:
            raise ValueError("Mật khẩu mới không được để trống ")
        if not constants.MIN_PASSWORD_LENGTH <= len(value) <= constants.MAX_PASSWORD_LENGTH:
            raise ValueError(f"Mật khẩu phải từ {constants.MIN_PASSWORD_LENGTH} đến {constants.MAX_PASSWORD_LENGTH} ký tự")
        
        if len(value.encode("utf-8")) > constants.MAX_PASSWORD_LENGTH:
            raise ValueError("Mật khẩu quá dài, hãy dùng ít ký tự có dấu hơn")
        return value 
    class MessageResponse(CamelModel):
        message:str 
    
    class UserResponse(CamelModel):
        id:int 
        full_name:str
        student_code:str 
        email:str 
        role:str 
        role:str 
        locked:bool = False 
        
        @classmethod
        def from_data(cls,user:UserData)->"UserResponse":
            return cls(
            id=user.id,
            full_name=user.full_name,
            student_code=user.student_code,
            email=user.email,
            role=user.role,
            locked=getattr(user, "locked", False),
        )