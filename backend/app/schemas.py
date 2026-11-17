from datetime import date, datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


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


class BookUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=150)
    categoryId: Optional[int] = Field(None, gt=0)
    total: Optional[int] = Field(None, ge=1)
    imageUrl: Optional[str] = Field(None, max_length=500)


class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    categoryName: str
    totalCopies: int
    availableCopies: int
    reservedCopies: int = 0
    imageUrl: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PageResponse(BaseModel):
    content: List[BookResponse]
    pageNumber: int
    pageSize: int
    totalElements: int
    totalPages: int
    last: bool


class UserRegister(BaseModel):
    username: str = Field(
        ..., min_length=3, max_length=50, description="Tên đăng nhập từ 3 đến 50 ký tự"
    )
    email: EmailStr = Field(..., description="Email hợp lệ")
    password: str = Field(..., min_length=6, description="Mật khẩu tối thiểu 6 ký tự")
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    # Kept as `username` for compatibility with the current login form.
    username: str = Field(..., description="Tên đăng nhập")
    password: str = Field(..., description="Mật khẩu")


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class UserRoleUpdateRequest(BaseModel):
    role: Literal["READER", "LIBRARIAN", "ADMIN"]


class UserLockUpdateRequest(BaseModel):
    is_locked: bool


class AdminUserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_locked: bool

    model_config = ConfigDict(from_attributes=True)


class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int] = None
    action: str
    detail: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    message: str


class LoanCreateRequest(BaseModel):
    book_id: int = Field(..., gt=0)
    days: Literal[7, 14, 30]


class LoanBookSummary(BaseModel):
    id: int
    title: str


class LoanUserSummary(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None


class LoanResponse(BaseModel):
    id: int
    user_id: int
    book_id: int
    status: str
    days: int
    borrow_date: Optional[date] = None
    due_date: Optional[date] = None
    return_date: Optional[date] = None
    approved_by: Optional[int] = None
    created_at: datetime
    book: Optional[LoanBookSummary] = None
    user: Optional[LoanUserSummary] = None

    model_config = ConfigDict(from_attributes=True)


class ReservationCreateRequest(BaseModel):
    book_id: int = Field(..., gt=0)


class ReservationResponse(BaseModel):
    id: int
    user_id: int
    book_id: int
    status: str
    created_at: datetime
    hold_expires_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


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


class FineDetailResponse(BaseModel):
    id: Optional[int] = None
    loanId: int
    userId: int
    username: str
    bookTitle: str
    overdueDays: int
    amount: float
    paid: bool
    type: str

    model_config = ConfigDict(from_attributes=True)


class ReaderLoanHistoryResponse(BaseModel):
    id: int
    bookId: int
    bookTitle: str
    status: str
    days: int
    borrowDate: Optional[date] = None
    dueDate: Optional[date] = None
    returnDate: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class MyFineSummaryResponse(BaseModel):
    totalUnpaid: float
    fines: List[FineDetailResponse]


class StatsOverviewResponse(BaseModel):
    totalBooks: int
    borrowingCount: int
    overdueCount: int
    totalFines: float


class TopBookItem(BaseModel):
    bookId: int
    title: str
    author: str
    borrowCount: int


class MonthlyLoanItem(BaseModel):
    month: str
    loanCount: int