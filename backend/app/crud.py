import math
from datetime import date
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.models import Book, Category, Loan, User
from app.schemas import BookResponse, PageResponse, BookCreateRequest
from app.services import LogService


def get_books_paginated(
    db: Session, 
    page: int = 1, 
    size: int = 5, 
    keyword: Optional[str] = None
) -> PageResponse:
    page = max(1, page)
    size = max(1, size)
    skip = (page - 1) * size

    query = db.query(Book).join(Book.category)

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
    db.flush()

    LogService.record(
        db=db,
        action="ADD_BOOK",
        detail=f"Thêm sách mới: '{new_book.title}' (ID: {new_book.id}, Số bản: {new_book.total_copies})"
    )

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


def delete_book(db: Session, book_id: int):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Không tìm thấy cuốn sách yêu cầu"}
        )

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

    book_title = book.title
    db.delete(book)

    LogService.record(
        db=db,
        action="DELETE_BOOK",
        detail=f"Xóa sách: '{book_title}' (ID: {book_id})"
    )

    db.commit()
    return {"message": "Xóa sách thành công"}


def update_book(
    db: Session, book_id: int, book_in: schemas.BookUpdateRequest
) -> schemas.BookResponse:
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy sách với ID {book_id}",
        )

    if book_in.total is not None:
        borrowed_copies = book.total_copies - book.available_copies
        if book_in.total < borrowed_copies:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tổng số bản mới ({book_in.total}) không được nhỏ hơn số sách đang cho mượn ({borrowed_copies}).",
            )
        book.available_copies = book_in.total - borrowed_copies
        book.total_copies = book_in.total

    if book_in.title is not None:
        book.title = book_in.title.strip()
    if book_in.author is not None:
        book.author = book_in.author.strip()
    if book_in.imageUrl is not None:
        book.image_url = book_in.imageUrl
    if book_in.categoryId is not None:
        category = db.query(Category).filter(Category.id == book_in.categoryId).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Thể loại không tồn tại"
            )
        book.category_id = book_in.categoryId

    LogService.record(
        db=db,
        action="UPDATE_BOOK",
        detail=f"Cập nhật sách: '{book.title}' (ID: {book_id})"
    )

    db.commit()
    db.refresh(book)

    return schemas.BookResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        categoryName=book.category.name if book.category else "Chưa phân loại",
        totalCopies=book.total_copies,
        availableCopies=book.available_copies,
        imageUrl=book.image_url,
    )


def get_categories(db: Session):
    return db.query(Category).all()


def create_category(db: Session, cat_in: schemas.CategoryCreateRequest):
    exist = db.query(Category).filter(Category.name == cat_in.name.strip()).first()
    if exist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Thể loại đã tồn tại"
        )
    category = Category(name=cat_in.name.strip())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db: Session, cat_id: int, cat_in: schemas.CategoryUpdateRequest):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thể loại"
        )
    cat.name = cat_in.name.strip()
    db.commit()
    db.refresh(cat)
    return cat


def delete_category(db: Session, cat_id: int):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thể loại"
        )

    book_count = db.query(Book).filter(Book.category_id == cat_id).count()
    if book_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Không thể xóa thể loại vì đang có {book_count} cuốn sách liên kết.",
        )

    db.delete(cat)
    db.commit()
    return {"message": "Xóa thể loại thành công"}


def get_readers(db: Session, keyword: Optional[str] = None):
    query = db.query(User).filter(User.role.in_(["READER", "USER"]))

    if keyword and keyword.strip():
        kw = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                User.username.ilike(kw),
                User.full_name.ilike(kw),
                User.email.ilike(kw),
            )
        )

    users = query.all()
    results = []
    for u in users:
        borrowing_count = (
            db.query(Loan)
            .filter(
                Loan.user_id == u.id,
                Loan.status.in_(["BORROWING", "PENDING"]),
            )
            .count()
        )

        results.append(
            schemas.ReaderResponse(
                id=u.id,
                username=u.username,
                fullName=u.full_name or u.username,
                email=u.email,
                active=getattr(u, "is_active", True),
                borrowingCount=borrowing_count,
            )
        )
    return results


def calculate_fine(db: Session, loan_id: int, fine_per_day: float = 5000.0):
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phiếu mượn"
        )

    today = date.today()
    target_date = loan.return_date or today
    overdue_days = 0
    if loan.due_date and target_date > loan.due_date:
        overdue_days = (target_date - loan.due_date).days

    total_fine = overdue_days * fine_per_day
    return schemas.FineCalculateResponse(
        loanId=loan.id,
        overdueDays=overdue_days,
        finePerDay=fine_per_day,
        totalFine=total_fine,
        status="OVERDUE" if overdue_days > 0 else "ON_TIME",
    )