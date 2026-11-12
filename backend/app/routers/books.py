from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.schemas import BookCreateRequest, BookResponse, BookUpdateRequest, PageResponse

router = APIRouter(prefix="/api/books", tags=["Books"])


@router.get("", response_model=PageResponse)
def get_books(
    page: int = Query(1, ge=1, description="Số trang (bắt đầu từ 1)"),
    size: int = Query(10, ge=1, le=100, description="Số sách mỗi trang"),
    keyword: Optional[str] = Query(None, description="Từ khóa tìm kiếm theo tên, tác giả, thể loại"),
    db: Session = Depends(get_db)
):
    return crud.get_books_paginated(db=db, page=page, size=size, keyword=keyword)


@router.get("/categories", response_model=List[schemas.CategoryResponse])
def get_categories_compat(db: Session = Depends(get_db)):
    return crud.get_categories(db)


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book_in: BookCreateRequest,
    db: Session = Depends(get_db)
):
    return crud.create_book(db=db, book_in=book_in)


@router.put("/{book_id}", response_model=BookResponse)
def update_book(
    book_id: int,
    book_in: BookUpdateRequest,
    db: Session = Depends(get_db)
):
    return crud.update_book(db=db, book_id=book_id, book_in=book_in)


@router.delete("/{book_id}", status_code=status.HTTP_200_OK)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db)
):
    return crud.delete_book(db=db, book_id=book_id)