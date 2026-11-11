from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ==================== BOOK SCHEMAS ====================
class BookCreateRequest(BaseModel):
    title: str = Field(
        ..., min_length=1, max_length=255, description="Tên sách không được để trống"
    )
    author: str = Field(
        ..., min_length=1, max_length=150, description="Tác giả không được để trống"
    )
    categoryId: int = Field(..., gt=0, description="Mã thể loại phải lớn hơn 0")
    total: int = Field(..., ge=1, description="Tổng số bản sách phải từ 1 trở lên")
    imageUrl: Optional[str] = Field(
        None, max_length=500, description="Đường dẫn ảnh bìa nếu có"
    )


class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    categoryName: str
    totalCopies: int
    availableCopies: int
    imageUrl: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PageResponse(BaseModel):
    content: List[BookResponse]
    pageNumber: int
    pageSize: int
    totalElements: int
    totalPages: int
    last: bool


# ==================== AUTH SCHEMAS ====================
class UserRegister(BaseModel):
    username: str = Field(
        ..., min_length=3, max_length=50, description="Tên đăng nhập từ 3 đến 50 ký tự"
    )
    email: EmailStr = Field(..., description="Email hợp lệ")
    password: str = Field(..., min_length=6, description="Mật khẩu tối thiểu 6 ký tự")
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    username: str = Field(..., description="Tên đăng nhập")
    password: str = Field(..., description="Mật khẩu")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    message: str

class BookUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=150)
    categoryId: Optional[int] = Field(None, gt=0)
    total: Optional[int] = Field(None, ge=1)
    imageUrl: Optional[str] = Field(None, max_length=500)


class CategoryCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class CategoryUpdateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class CategoryResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class ReaderResponse(BaseModel):
    id: int
    username: str
    fullName: Optional[str] = None
    email: str
    active: bool
    borrowingCount: int

    model_config = ConfigDict(from_attributes=True)


class FineResponse(BaseModel):
    id: int
    loanId: int
    amount: float
    paid: bool

    model_config = ConfigDict(from_attributes=True)


class FineCalculateResponse(BaseModel):
    loanId: int
    overdueDays: int
    finePerDay: float
    totalFine: float
    status: str