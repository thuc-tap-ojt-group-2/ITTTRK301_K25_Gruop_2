import math
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models import Book, Category, Loan
from app.schemas import BookResponse, PageResponse, BookCreateRequest


def get_books_paginated(
    db: Session, 
    page: int = 1, 
    size: int = 10, 
    keyword: Optional[str] = None
) -> PageResponse:
    page = max(1, page)
    size = max(1, size)
    skip = (page - 1) * size

    # Base query có JOIN với category
    query = db.query(Book).join(Book.category)

    # BOOK-02: Tìm kiếm theo tên, tác giả, thể loại
    # Collation utf8mb4_unicode_ci trong MySQL tự động tìm kiếm không phân biệt dấu và hoa thường
    if keyword and keyword.strip():
        kw = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                Book.title.ilike(kw),
                Book.author.ilike(kw),
                Category.name.ilike(kw)
            )
        )

    total_elements = query.count()
    total_pages = math.ceil(total_elements / size) if total_elements > 0 else 0

    books = (
        query.options(joinedload(Book.category))
        .order_by(Book.id.desc())
        .offset(skip)
        .limit(size)
        .all()
    )

    content = [
        BookResponse(
            id=b.id,
            title=b.title,
            author=b.author,
            categoryName=b.category.name if b.category else "",
            totalCopies=b.total_copies,
            availableCopies=b.available_copies,
            imageUrl=b.image_url
        )
        for b in books
    ]

    return PageResponse(
        content=content,
        pageNumber=page,
        pageSize=size,
        totalElements=total_elements,
        totalPages=total_pages,
        last=(page >= total_pages) if total_pages > 0 else True
    )


def create_book(db: Session, book_in: BookCreateRequest) -> BookResponse:
    category = db.query(Category).filter(Category.id == book_in.categoryId).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": f"Thể loại với ID {book_in.categoryId} không tồn tại"}
        )

    new_book = Book(
        title=book_in.title.strip(),
        author=book_in.author.strip(),
        category_id=book_in.categoryId,
        total_copies=book_in.total,
        available_copies=book_in.total,
        image_url=book_in.imageUrl
    )

    db.add(new_book)
    db.commit()
    db.refresh(new_book)

    return BookResponse(
        id=new_book.id,
        title=new_book.title,
        author=new_book.author,
        categoryName=category.name,
        totalCopies=new_book.total_copies,
        availableCopies=new_book.available_copies,
        imageUrl=new_book.image_url
    )


def get_categories(db: Session):
    return db.query(Category).order_by(Category.name).all()


def update_book(db: Session, book_id: int, book_in: BookCreateRequest) -> BookResponse:
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Không tìm thấy cuốn sách yêu cầu"}
        )

    category = db.query(Category).filter(Category.id == book_in.categoryId).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": f"Thể loại với ID {book_in.categoryId} không tồn tại"}
        )

    reserved_copies = book.total_copies - book.available_copies
    if book_in.total < reserved_copies:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Tổng số bản không thể ít hơn số bản đang được mượn hoặc chờ duyệt"}
        )

    book.title = book_in.title.strip()
    book.author = book_in.author.strip()
    book.category_id = book_in.categoryId
    book.total_copies = book_in.total
    book.available_copies = book_in.total - reserved_copies
    book.image_url = book_in.imageUrl

    db.commit()
    db.refresh(book)

    return BookResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        categoryName=category.name,
        totalCopies=book.total_copies,
        availableCopies=book.available_copies,
        imageUrl=book.image_url
    )


# BOOK-04 & BR07: Xóa sách
def delete_book(db: Session, book_id: int):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Không tìm thấy cuốn sách yêu cầu"}
        )

    # Ràng buộc BR07: Không xóa sách đang được mượn hoặc đang có đăng ký chờ duyệt
    active_loans = (
        db.query(Loan)
        .filter(Loan.book_id == book_id, Loan.status.in_(["PENDING", "BORROWING"]))
        .first()
    )
    if active_loans:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Không thể xóa sách đang được mượn hoặc có phiếu chờ duyệt"}
        )

    db.delete(book)
    db.commit()
    return {"message": "Xóa sách thành công"}