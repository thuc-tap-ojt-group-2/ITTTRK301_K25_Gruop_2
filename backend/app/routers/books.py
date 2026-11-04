from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import PageResponse, BookResponse, BookCreateRequest
from app import crud

router = APIRouter(prefix="/api/books", tags=["Books"])

@router.get("", response_model=PageResponse)
def get_books(
    page: int = Query(1, ge=1, description="Số trang (bắt đầu từ 1)"),
    size: int = Query(10, ge=1, le=100, description="Số sách mỗi trang"),
    db: Session = Depends(get_db)
):
    return crud.get_books_paginated(db=db, page=page, size=size)

@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def add_book(
    book_in: BookCreateRequest,
    db: Session = Depends(get_db)
):
    return crud.create_book(db=db, book_in=book_in)