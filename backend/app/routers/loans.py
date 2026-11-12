from datetime import datetime, timezone
from typing import List, Optional
from app.database import get_db
from app.dependencies import get_current_user
from app.log_service import create_system_log
from app.models import Book, Loan, User
from app.schemas import LoanCreateRequest, LoanResponse
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/loans", tags=["Loans"])


@router.post("/", response_model=LoanResponse, status_code=status.HTTP_201_CREATED)
def create_loan(
    loan_in: LoanCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    book = db.query(Book).filter(Book.id == loan_in.book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy sách"
        )

    if book.available_copies <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sách này hiện đã hết bản sao khả dụng để mượn",
        )

    book.available_copies -= 1
    new_loan = Loan(
        user_id=current_user.id,
        book_id=book.id,
        status="PENDING",
        days=loan_in.days,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)

    create_system_log(
        db=db,
        action="CREATE_LOAN",
        resource="LOAN",
        user_id=current_user.id,
        details=f"Tạo phiếu mượn sách ID {book.id} thành công",
    )
    return new_loan


@router.get("/my-loans", response_model=List[LoanResponse])
def get_my_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Loan)
        .filter(Loan.user_id == current_user.id)
        .order_by(Loan.created_at.desc())
        .all()
    )


@router.patch("/{loan_id}/cancel", response_model=LoanResponse)
def cancel_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    loan = (
        db.query(Loan)
        .filter(Loan.id == loan_id, Loan.user_id == current_user.id)
        .first()
    )
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phiếu mượn"
        )

    if loan.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ có thể hủy phiếu khi đang ở trạng thái PENDING",
        )

    book = db.query(Book).filter(Book.id == loan.book_id).first()
    if book:
        book.available_copies += 1

    loan.status = "CANCELLED"
    db.commit()
    db.refresh(loan)

    create_system_log(
        db=db,
        action="CANCEL_LOAN",
        resource="LOAN",
        user_id=current_user.id,
        details=f"Hủy phiếu mượn ID {loan.id}",
    )
    return loan


@router.get("/", response_model=List[LoanResponse])
def list_loans(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Loan)
    if status_filter:
        query = query.filter(Loan.status == status_filter)
    return query.order_by(Loan.created_at.desc()).all()
