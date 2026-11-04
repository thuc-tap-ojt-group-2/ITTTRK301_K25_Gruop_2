from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

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

class BookCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Tên sách không được để trống")
    author: str = Field(..., min_length=1, max_length=150, description="Tác giả không được để trống")
    categoryId: int = Field(..., gt=0, description="Mã thể loại phải lớn hơn 0")
    total: int = Field(..., ge=1, description="Tổng số bản sách phải từ 1 trở lên")
    imageUrl: Optional[str] = Field(None, max_length=500, description="Đường dẫn ảnh bìa nếu có")

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