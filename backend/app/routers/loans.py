from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import RoleChecker
from app.loan_service import LoanService
from app.models import Book, Loan, User
from app.schemas import (
    LoanBookSummary,
    LoanCreateRequest,
    LoanResponse,
    LoanUserSummary,
)

router = APIRouter(prefix="/api/loans", tags=["Loans"])
reader_only = RoleChecker(["READER", "USER"])
librarian_or_admin = RoleChecker(["LIBRARIAN", "ADMIN"])

LoanStatus = Literal["PENDING", "BORROWING", "RETURNED", "REJECTED", "CANCELLED"]


def _to_response(db: Session, loan: Loan) -> LoanResponse:
    book = db.query(Book).filter(Book.id == loan.book_id).first()
    user = db.query(User).filter(User.id == loan.user_id).first()
    return LoanResponse(
        id=loan.id,
        user_id=loan.user_id,
        book_id=loan.book_id,
        status=loan.status,
        days=loan.days,
        extension_count=loan.extension_count or 0,
        borrow_date=loan.borrow_date,
        due_date=loan.due_date,
        return_date=loan.return_date,
        approved_by=loan.approved_by,
        created_at=loan.created_at,
        book=LoanBookSummary(id=book.id, title=book.title) if book else None,
        user=(
            LoanUserSummary(
                id=user.id,
                username=user.username,
                full_name=user.full_name,
            )
            if user
            else None
        ),
    )


@router.post("", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
def create_loan(
    loan_in: LoanCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(reader_only),
):
    loan = LoanService.create_request(
        db=db,
        user_id=current_user.id,
        book_id=loan_in.book_id,
        days=loan_in.days,
    )
    return _to_response(db, loan)


@router.get("/my-loans", response_model=List[LoanResponse])
@router.get("/mine", response_model=List[LoanResponse])
def get_my_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(reader_only),
):
    return [
        _to_response(db, loan)
        for loan in LoanService.list_for_reader(db, current_user.id)
    ]


@router.patch("/{loan_id}/cancel", response_model=LoanResponse)
@router.put("/{loan_id}/cancel", response_model=LoanResponse)
def cancel_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(reader_only),
):
    loan = LoanService.cancel_request(db, loan_id, current_user.id)
    return _to_response(db, loan)


@router.post("/{loan_id}/extend", response_model=LoanResponse)
def extend_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(reader_only),
):
    loan = LoanService.extend(db, loan_id, current_user.id)
    return _to_response(db, loan)


@router.get("", response_model=List[LoanResponse])
@router.get("/", response_model=List[LoanResponse])
def list_loans(
    status_filter: Optional[LoanStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(librarian_or_admin),
):
    return [
        _to_response(db, loan)
        for loan in LoanService.list_for_staff(db, status_filter)
    ]


@router.put("/{loan_id}/approve", response_model=LoanResponse)
def approve_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(librarian_or_admin),
):
    loan = LoanService.approve(db, loan_id, current_user.id)
    return _to_response(db, loan)


@router.put("/{loan_id}/reject", response_model=LoanResponse)
def reject_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(librarian_or_admin),
):
    loan = LoanService.reject(db, loan_id, current_user.id)
    return _to_response(db, loan)


@router.put("/{loan_id}/return", response_model=LoanResponse)
def return_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(librarian_or_admin),
):
    loan = LoanService.return_book(db, loan_id, current_user.id)
    return _to_response(db, loan)
