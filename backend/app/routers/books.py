
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.schemas import BookCreateRequest, BookResponse, PageResponse

router = APIRouter(prefix="/api/books", tags=["Books"])


@router.get("", response_model=PageResponse)
def get_books(
    page: int = Query(1, ge=1, description="Số trang (bắt đầu từ 1)"),
    size: int = Query(10, ge=1, le=100, description="Số sách mỗi trang"),
    keyword: Optional[str] = Query(None, description="Từ khóa tìm kiếm theo tên, tác giả, thể loại"),
    db: Session = Depends(get_db)
):
    """
    BOOK-01: Phân trang sách
    BOOK-02: Tìm kiếm theo tên, tác giả, thể loại (không phân biệt hoa thường, dấu tiếng Việt)
    """
    return crud.get_books_paginated(db=db, page=page, size=size, keyword=keyword)


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book_in: BookCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Tạo mới sách
    """
    return crud.create_book(db=db, book_in=book_in)


@router.delete("/{book_id}", status_code=status.HTTP_200_OK)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db)
):
    """
    BOOK-04 & BR07: Xóa sách
    """
    return crud.delete_book(db=db, book_id=book_id)