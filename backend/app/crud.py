import math
from datetime import date, datetime, timezone
import unicodedata
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func, desc
from sqlalchemy.orm import Session, joinedload

from app import schemas
from app.models import Book, Category, Loan, User, Fine, Reservation
from app.reservation_service import ReservationService
from app.schemas import BookResponse, PageResponse, BookCreateRequest
from app.services import LogService


def _normalize_search_text(value: Optional[str]) -> str:
    normalized = unicodedata.normalize("NFD", value or "")
    normalized = normalized.replace("đ", "d").replace("Đ", "D")
    return (
        normalized.encode("ascii", "ignore")
        .decode("ascii")
        .lower()
        .strip()
    )


def _to_book_response(book: Book, reserved_copies: int = 0) -> BookResponse:
    cover = book.cover_url or book.image_url
    return BookResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        categoryId=book.category_id,
        categoryName=book.category.name if book.category else "Chưa phân loại",
        totalCopies=book.total_copies,
        availableCopies=max(0, book.available_copies - reserved_copies),
        reservedCopies=reserved_copies,
        imageUrl=cover,
        coverUrl=cover,
        isbn=book.isbn,
        publisher=book.publisher,
        publicationYear=book.publication_year,
        description=book.description,
    )


def get_books_paginated(
    db: Session,
    page: int = 1,
    size: int = 5,
    keyword: Optional[str] = None,
    category_id: Optional[int] = None,
    availability: Optional[str] = None,
) -> PageResponse:
    page = max(1, page)
    size = max(1, size)
    skip = (page - 1) * size

    query = db.query(Book).join(Book.category)
    if category_id is not None:
        query = query.filter(Book.category_id == category_id)

    has_keyword = bool(keyword and keyword.strip())
    if has_keyword or availability in ("available", "empty"):
        normalized_tokens = _normalize_search_text(keyword).split() if has_keyword else []
        all_candidates = (
            query.options(joinedload(Book.category))
            .order_by(Book.id.desc())
            .all()
        )
        hold_counts = {}
        if all_candidates:
            hold_counts = dict(
                db.query(Reservation.book_id, func.count(Reservation.id))
                .filter(
                    Reservation.book_id.in_([book.id for book in all_candidates]),
                    Reservation.status == "HOLDING",
                    Reservation.hold_expires_at > datetime.now(timezone.utc),
                )
                .group_by(Reservation.book_id)
                .all()
            )

        matching_books = []
        for book in all_candidates:
            if normalized_tokens:
                searchable = _normalize_search_text(
                    f"{book.title} {book.author} {book.category.name if book.category else ''} {book.isbn or ''}"
                )
                if not all(token in searchable for token in normalized_tokens):
                    continue
            if availability in ("available", "empty"):
                avail = max(0, book.available_copies - hold_counts.get(book.id, 0))
                if availability == "available" and avail <= 0:
                    continue
                if availability == "empty" and avail > 0:
                    continue
            matching_books.append(book)

        total_elements = len(matching_books)
        books = matching_books[skip : skip + size]
    else:
        total_elements = query.count()
        books = (
            query.options(joinedload(Book.category))
            .order_by(Book.id.desc())
            .offset(skip)
            .limit(size)
            .all()
        )
        hold_counts = {}
        if books:
            hold_counts = dict(
                db.query(Reservation.book_id, func.count(Reservation.id))
                .filter(
                    Reservation.book_id.in_([book.id for book in books]),
                    Reservation.status == "HOLDING",
                    Reservation.hold_expires_at > datetime.now(timezone.utc),
                )
                .group_by(Reservation.book_id)
                .all()
            )
    total_pages = math.ceil(total_elements / size) if total_elements > 0 else 0

    content = [
        _to_book_response(b, hold_counts.get(b.id, 0))
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


def create_book(
    db: Session, book_in: BookCreateRequest, actor_id: Optional[int] = None
) -> BookResponse:
    category = db.query(Category).filter(Category.id == book_in.categoryId).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": f"Thể loại với ID {book_in.categoryId} không tồn tại"}
        )

    cover = book_in.coverUrl or book_in.imageUrl
    new_book = Book(
        title=book_in.title.strip(),
        author=book_in.author.strip(),
        category_id=book_in.categoryId,
        total_copies=book_in.total,
        available_copies=book_in.total,
        image_url=cover,
        cover_url=cover,
        isbn=book_in.isbn,
        publisher=book_in.publisher,
        publication_year=book_in.publicationYear,
        description=book_in.description
    )

    db.add(new_book)
    db.flush()

    LogService.record(
        db=db,
        action="ADD_BOOK",
        detail=f"Thêm sách mới: '{new_book.title}' (ID: {new_book.id}, Số bản: {new_book.total_copies})",
        actor_id=actor_id,
    )

    db.commit()
    db.refresh(new_book)

    return _to_book_response(new_book, 0)


def delete_book(db: Session, book_id: int, actor_id: Optional[int] = None):
    book = (
        db.query(Book)
        .filter(Book.id == book_id)
        .with_for_update()
        .first()
    )
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
    if db.query(Loan).filter(Loan.book_id == book_id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Không thể xóa sách đã có lịch sử phiếu mượn"},
        )
    if db.query(Reservation).filter(Reservation.book_id == book_id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Không thể xóa sách đã có lịch sử đặt trước"},
        )

    book_title = book.title
    db.delete(book)

    LogService.record(
        db=db,
        action="DELETE_BOOK",
        detail=f"Xóa sách: '{book_title}' (ID: {book_id})",
        actor_id=actor_id,
    )

    db.commit()
    return {"message": "Xóa sách thành công"}


def update_book(
    db: Session,
    book_id: int,
    book_in: schemas.BookUpdateRequest,
    actor_id: Optional[int] = None,
) -> schemas.BookResponse:
    book = (
        db.query(Book)
        .filter(Book.id == book_id)
        .with_for_update()
        .first()
    )
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy sách với ID {book_id}",
        )

    ReservationService.sync_book(db, book)

    if book_in.total is not None:
        borrowed_copies = book.total_copies - book.available_copies
        reserved_copies = len(ReservationService.active_holds(db, book.id))
        if book_in.total < borrowed_copies + reserved_copies:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tổng số bản mới ({book_in.total}) không được nhỏ hơn số sách đang mượn và giữ chỗ ({borrowed_copies + reserved_copies}).",
            )
        book.available_copies = book_in.total - borrowed_copies
        book.total_copies = book_in.total

    if book_in.title is not None:
        book.title = book_in.title.strip()
    if book_in.author is not None:
        book.author = book_in.author.strip()
    fields_set = getattr(book_in, "model_fields_set", set())
    if "coverUrl" in fields_set or "imageUrl" in fields_set:
        cover = book_in.coverUrl if "coverUrl" in fields_set else book_in.imageUrl
        if not cover and "imageUrl" in fields_set and book_in.imageUrl:
            cover = book_in.imageUrl
        book.cover_url = cover
        book.image_url = cover
    if book_in.isbn is not None:
        book.isbn = book_in.isbn
    if book_in.publisher is not None:
        book.publisher = book_in.publisher
    if book_in.publicationYear is not None:
        book.publication_year = book_in.publicationYear
    if book_in.description is not None:
        book.description = book_in.description
    if book_in.categoryId is not None:
        category = db.query(Category).filter(Category.id == book_in.categoryId).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Thể loại không tồn tại"
            )
        book.category_id = book_in.categoryId

    ReservationService.sync_book(db, book)
    LogService.record(
        db=db,
        action="UPDATE_BOOK",
        detail=f"Cập nhật sách: '{book.title}' (ID: {book_id})",
        actor_id=actor_id,
    )

    db.commit()
    db.refresh(book)

    reserved_copies = len(ReservationService.active_holds(db, book.id))
    return _to_book_response(book, reserved_copies)


def get_categories(db: Session):
    return db.query(Category).all()


def create_category(
    db: Session,
    cat_in: schemas.CategoryCreateRequest,
    actor_id: Optional[int] = None,
):
    exist = db.query(Category).filter(Category.name == cat_in.name.strip()).first()
    if exist:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Thể loại đã tồn tại"
        )
    category = Category(name=cat_in.name.strip())
    db.add(category)
    db.flush()
    LogService.record(
        db=db,
        action="ADD_CATEGORY",
        detail=f"Thêm thể loại '{category.name}' (ID: {category.id})",
        actor_id=actor_id,
    )
    db.commit()
    db.refresh(category)
    return category


def update_category(
    db: Session,
    cat_id: int,
    cat_in: schemas.CategoryUpdateRequest,
    actor_id: Optional[int] = None,
):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thể loại"
        )
    new_name = cat_in.name.strip()
    duplicate = (
        db.query(Category)
        .filter(Category.id != cat_id, func.lower(Category.name) == new_name.lower())
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Thể loại đã tồn tại"
        )
    previous_name = cat.name
    cat.name = new_name
    LogService.record(
        db=db,
        action="UPDATE_CATEGORY",
        detail=f"Đổi thể loại '{previous_name}' thành '{cat.name}' (ID: {cat.id})",
        actor_id=actor_id,
    )
    db.commit()
    db.refresh(cat)
    return cat


def delete_category(
    db: Session, cat_id: int, actor_id: Optional[int] = None
):
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

    category_name = cat.name
    db.delete(cat)
    LogService.record(
        db=db,
        action="DELETE_CATEGORY",
        detail=f"Xóa thể loại '{category_name}' (ID: {cat_id})",
        actor_id=actor_id,
    )
    db.commit()
    return {"message": "Xóa thể loại thành công"}


def get_readers(db: Session, keyword: Optional[str] = None):
    query = db.query(User).filter(User.role.in_(["READER", "USER"]))

    if keyword and keyword.strip():
        normalized_tokens = _normalize_search_text(keyword).split()
        users = [
            user
            for user in query.all()
            if normalized_tokens and all(
                token
                in _normalize_search_text(
                    f"{user.username} {user.full_name or ''} {user.email}"
                )
                for token in normalized_tokens
            )
        ]
    else:
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
                active=not u.is_locked,
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

def get_all_fines_detailed(db: Session):
    results = []

    finalized_fines = (
        db.query(Fine, Loan, User, Book)
        .join(Loan, Fine.loan_id == Loan.id)
        .join(User, Loan.user_id == User.id)
        .join(Book, Loan.book_id == Book.id)
        .all()
    )
    for fine, loan, user, book in finalized_fines:
        overdue_days = 0
        if loan.due_date and loan.return_date and loan.return_date > loan.due_date:
            overdue_days = (loan.return_date - loan.due_date).days
        results.append(
            schemas.FineDetailResponse(
                id=fine.id,
                loanId=loan.id,
                userId=user.id,
                username=user.username,
                bookTitle=book.title,
                overdueDays=overdue_days,
                amount=float(fine.amount),
                paid=fine.paid,
                type="FINALIZED",
            )
        )

    today = date.today()
    provisional_loans = (
        db.query(Loan, User, Book)
        .join(User, Loan.user_id == User.id)
        .join(Book, Loan.book_id == Book.id)
        .filter(Loan.status == "BORROWING", Loan.due_date < today)
        .all()
    )
    for loan, user, book in provisional_loans:
        overdue_days = (today - loan.due_date).days
        amount = overdue_days * 5000
        results.append(
            schemas.FineDetailResponse(
                id=None,
                loanId=loan.id,
                userId=user.id,
                username=user.username,
                bookTitle=book.title,
                overdueDays=overdue_days,
                amount=float(amount),
                paid=False,
                type="PROVISIONAL",
            )
        )
    return results


def mark_fine_as_paid(
    db: Session, fine_id: int, actor_id: Optional[int] = None
):
    fine = db.query(Fine).filter(Fine.id == fine_id).first()
    if not fine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Không tìm thấy khoản phạt yêu cầu"},
        )
    if fine.paid:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Khoản phạt này đã được thanh toán",
        )
    fine.paid = True
    LogService.record(
        db=db,
        action="COLLECT_FINE",
        detail=f"Thu tiền phạt ID {fine_id} số tiền {fine.amount}đ cho phiếu mượn {fine.loan_id}",
        actor_id=actor_id,
    )
    db.commit()
    return {"message": "Đánh dấu thu tiền phạt thành công", "fineId": fine.id}


def get_reader_loan_history(db: Session, reader_id: int):
    reader = db.query(User).filter(User.id == reader_id).first()
    if not reader:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "Không tìm thấy độc giả yêu cầu"},
        )

    loans = (
        db.query(Loan, Book)
        .join(Book, Loan.book_id == Book.id)
        .filter(Loan.user_id == reader_id)
        .order_by(Loan.id.desc())
        .all()
    )

    return [
        schemas.ReaderLoanHistoryResponse(
            id=loan.id,
            bookId=book.id,
            bookTitle=book.title,
            status=loan.status,
            days=loan.days,
            borrowDate=loan.borrow_date,
            dueDate=loan.due_date,
            returnDate=loan.return_date,
        )
        for loan, book in loans
    ]

def get_user_fines(db: Session, user_id: int):
    results = []
    total_unpaid = 0.0

    finalized_fines = (
        db.query(Fine, Loan, Book)
        .join(Loan, Fine.loan_id == Loan.id)
        .join(Book, Loan.book_id == Book.id)
        .filter(Loan.user_id == user_id)
        .all()
    )
    for fine, loan, book in finalized_fines:
        overdue_days = 0
        if loan.due_date and loan.return_date and loan.return_date > loan.due_date:
            overdue_days = (loan.return_date - loan.due_date).days
        amount = float(fine.amount)
        if not fine.paid:
            total_unpaid += amount
        results.append(
            schemas.FineDetailResponse(
                id=fine.id,
                loanId=loan.id,
                userId=user_id,
                username="",
                bookTitle=book.title,
                overdueDays=overdue_days,
                amount=amount,
                paid=fine.paid,
                type="FINALIZED",
            )
        )

    today = date.today()
    provisional_loans = (
        db.query(Loan, Book)
        .join(Book, Loan.book_id == Book.id)
        .filter(Loan.user_id == user_id, Loan.status == "BORROWING", Loan.due_date < today)
        .all()
    )
    for loan, book in provisional_loans:
        overdue_days = (today - loan.due_date).days
        amount = float(overdue_days * 5000)
        total_unpaid += amount
        results.append(
            schemas.FineDetailResponse(
                id=None,
                loanId=loan.id,
                userId=user_id,
                username="",
                bookTitle=book.title,
                overdueDays=overdue_days,
                amount=amount,
                paid=False,
                type="PROVISIONAL",
            )
        )

    return schemas.MyFineSummaryResponse(totalUnpaid=total_unpaid, fines=results)

def get_public_stats(db: Session) -> schemas.PublicStatsResponse:
    total_titles = db.query(func.count(Book.id)).scalar()
    total_copies = db.query(func.coalesce(func.sum(Book.total_copies), 0)).scalar()
    total_categories = db.query(func.count(Category.id)).scalar()

    return schemas.PublicStatsResponse(
        total_titles=int(total_titles or 0),
        total_copies=int(total_copies or 0),
        total_categories=int(total_categories or 0),
    )


def get_stats_overview(db: Session) -> schemas.StatsOverviewResponse:
    total_titles = db.query(func.count(Book.id)).scalar()
    total_copies = db.query(func.coalesce(func.sum(Book.total_copies), 0)).scalar()
    total_readers = (
        db.query(func.count(User.id))
        .filter(User.role.in_(["READER", "USER"]))
        .scalar()
    )
    total_books = total_copies

    borrowing_count = (
        db.query(func.count(Loan.id))
        .filter(Loan.status == "BORROWING")
        .scalar()
    )

    today = date.today()
    overdue_count = (
        db.query(func.count(Loan.id))
        .filter(Loan.status == "BORROWING", Loan.due_date < today)
        .scalar()
    )

    total_fines = db.query(func.coalesce(func.sum(Fine.amount), 0)).filter(Fine.paid == False).scalar()

    return schemas.StatsOverviewResponse(
        totalTitles=int(total_titles or 0),
        totalCopies=int(total_copies or 0),
        totalReaders=int(total_readers or 0),
        totalBooks=int(total_books or 0),
        borrowingCount=int(borrowing_count or 0),
        overdueCount=int(overdue_count or 0),
        totalFines=float(total_fines or 0.0),
    )


def get_top_borrowed_books(db: Session, limit: int = 5):
    rows = (
        db.query(
            Book.id,
            Book.title,
            Book.author,
            func.count(Loan.id).label("borrow_count"),
        )
        .join(Loan, Loan.book_id == Book.id)
        .filter(Loan.status.in_(["BORROWING", "RETURNED"]))
        .group_by(Book.id, Book.title, Book.author)
        .order_by(desc("borrow_count"), Book.id.asc())
        .limit(limit)
        .all()
    )

    return [
        schemas.TopBookItem(
            bookId=r.id,
            title=r.title,
            author=r.author,
            borrowCount=int(r.borrow_count),
        )
        for r in rows
    ]


def get_monthly_loan_stats(db: Session, months: int = 6):
    today = date.today()
    target_months = []
    year, month = today.year, today.month
    for _ in range(months):
        target_months.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    target_months.reverse()

    start_date_str = f"{target_months[0]}-01"

    dialect_name = db.bind.dialect.name if db.bind is not None else ""
    month_expr = (
        func.strftime("%Y-%m", Loan.borrow_date)
        if dialect_name == "sqlite"
        else func.date_format(Loan.borrow_date, "%Y-%m")
    )
    rows = (
        db.query(month_expr.label("ym"), func.count(Loan.id).label("cnt"))
        .filter(
            Loan.borrow_date.isnot(None),
            Loan.borrow_date >= start_date_str,
            Loan.status.in_(["BORROWING", "RETURNED"]),
        )
        .group_by("ym")
        .all()
    )

    counts_map = {r.ym: int(r.cnt) for r in rows}

    return [
        schemas.MonthlyLoanItem(
            month=ym,
            loanCount=counts_map.get(ym, 0),
        )
        for ym in target_months
    ]