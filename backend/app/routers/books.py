from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.dependencies import RoleChecker
from app.models import User
from app.schemas import BookCreateRequest, BookResponse, BookUpdateRequest, PageResponse

router = APIRouter(prefix="/api/books", tags=["Books"])
staff_only = RoleChecker(["LIBRARIAN", "ADMIN"])


@router.get("", response_model=PageResponse)
def get_books(
    page: int = Query(1, ge=1, description="Số trang (bắt đầu từ 1)"),
    size: int = Query(10, ge=1, le=10, description="Số sách mỗi trang"),
    keyword: Optional[str] = Query(
        None, description="Từ khóa tìm kiếm; phạm vi chọn bằng tham số search_by"
    ),
    search_by: Optional[Literal["title", "author", "isbn"]] = Query(
        None, description="Phạm vi tìm kiếm: nhan đề, tác giả hoặc ISBN"
    ),
    db: Session = Depends(get_db)
):
    return crud.get_books_paginated(
        db=db, page=page, size=size, keyword=keyword, search_by=search_by
    )


@router.get("/categories", response_model=List[schemas.CategoryResponse])
def get_categories_compat(db: Session = Depends(get_db)):
    return crud.get_categories(db)


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book_in: BookCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_only),
):
    return crud.create_book(db=db, book_in=book_in, actor_id=current_user.id)


@router.put("/{book_id}", response_model=BookResponse)
def update_book(
    book_id: int,
    book_in: BookUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_only),
):
    return crud.update_book(
        db=db, book_id=book_id, book_in=book_in, actor_id=current_user.id
    )


@router.delete("/{book_id}", status_code=status.HTTP_200_OK)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_only),
):
    return crud.delete_book(db=db, book_id=book_id, actor_id=current_user.id)