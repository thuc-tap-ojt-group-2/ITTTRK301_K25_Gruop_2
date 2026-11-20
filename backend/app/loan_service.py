from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.log_service import create_system_log
from app.models import Book, Fine, Loan, User
from app.models import Reservation
from app.reservation_service import ReservationService
from app.services import FineService

ACTIVE_LOAN_STATUSES = ("PENDING", "BORROWING")
ALLOWED_LOAN_DAYS = (7, 14, 30)
LOAN_EXTENSION_DAYS = 7


class LoanService:
    @staticmethod
    def create_request(
        db: Session, user_id: int, book_id: int, days: int
    ) -> Loan:
        if days not in ALLOWED_LOAN_DAYS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Thời hạn mượn chỉ được chọn 7, 14 hoặc 30 ngày",
            )

        user = (
            db.query(User)
            .filter(User.id == user_id)
            .with_for_update()
            .first()
        )
        if user is None or user.is_locked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tài khoản không hợp lệ",
            )

        book = (
            db.query(Book)
            .filter(Book.id == book_id)
            .with_for_update()
            .first()
        )
        if book is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy sách",
            )
        ReservationService.sync_book(db, book)
        active_holds = (
            db.query(Reservation)
            .filter(
                Reservation.book_id == book_id,
                Reservation.status == "HOLDING",
                Reservation.hold_expires_at > datetime.now(timezone.utc),
            )
            .all()
        )
        user_has_hold = any(item.user_id == user_id for item in active_holds)
        if book.available_copies - len(active_holds) <= 0 and not user_has_hold:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Sách hiện không còn bản có thể đăng ký mượn",
            )

        active_loans = (
            db.query(Loan)
            .filter(
                Loan.user_id == user_id,
                Loan.status.in_(ACTIVE_LOAN_STATUSES),
            )
            .all()
        )
        if len(active_loans) >= 3:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Mỗi độc giả chỉ được có tối đa 3 phiếu đang chờ hoặc đang mượn",
            )
        if any(loan.book_id == book_id for loan in active_loans):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Bạn đã có phiếu chờ hoặc đang mượn cuốn sách này",
            )

        overdue_loan = (
            db.query(Loan)
            .filter(
                Loan.user_id == user_id,
                Loan.status == "BORROWING",
                Loan.due_date < date.today(),
            )
            .first()
        )
        if overdue_loan:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Bạn còn sách quá hạn chưa trả",
            )

        loan = Loan(
            user_id=user_id,
            book_id=book_id,
            status="PENDING",
            days=days,
            created_at=datetime.now(timezone.utc),
        )
        db.add(loan)
        db.flush()
        create_system_log(
            db,
            action="CREATE_LOAN",
            resource="LOAN",
            user_id=user_id,
            details=f"Tạo phiếu mượn ID {loan.id}",
        )
        db.commit()
        db.refresh(loan)
        return loan

    @staticmethod
    def cancel_request(db: Session, loan_id: int, user_id: int) -> Loan:
        loan = (
            db.query(Loan)
            .filter(Loan.id == loan_id, Loan.user_id == user_id)
            .with_for_update()
            .first()
        )
        if loan is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy phiếu mượn",
            )
        if loan.status != "PENDING":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Chỉ có thể hủy phiếu đang chờ duyệt",
            )

        loan.status = "CANCELLED"
        create_system_log(
            db,
            action="CANCEL_LOAN",
            resource="LOAN",
            user_id=user_id,
            details=f"Hủy phiếu mượn ID {loan.id}",
        )
        db.commit()
        db.refresh(loan)
        return loan

    @staticmethod
    def list_for_staff(
        db: Session, status_filter: Optional[str] = None
    ) -> list[Loan]:
        query = db.query(Loan)
        if status_filter:
            query = query.filter(Loan.status == status_filter)
        return query.order_by(Loan.created_at.desc(), Loan.id.desc()).all()

    @staticmethod
    def list_for_reader(db: Session, user_id: int) -> list[Loan]:
        return (
            db.query(Loan)
            .filter(Loan.user_id == user_id)
            .order_by(Loan.created_at.desc(), Loan.id.desc())
            .all()
        )

    @staticmethod
    def approve(db: Session, loan_id: int, librarian_id: int) -> Loan:
        loan = (
            db.query(Loan)
            .filter(Loan.id == loan_id)
            .with_for_update()
            .first()
        )
        if loan is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy phiếu mượn",
            )
        if loan.status != "PENDING":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Chỉ có thể duyệt phiếu đang chờ",
            )

        book = (
            db.query(Book)
            .filter(Book.id == loan.book_id)
            .with_for_update()
            .first()
        )
        if book is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy sách của phiếu mượn",
            )
        ReservationService.sync_book(db, book)
        active_holds = (
            db.query(Reservation)
            .filter(
                Reservation.book_id == book.id,
                Reservation.status == "HOLDING",
                Reservation.hold_expires_at > datetime.now(timezone.utc),
            )
            .all()
        )
        user_has_hold = any(item.user_id == loan.user_id for item in active_holds)
        if book.available_copies <= 0 or (
            book.available_copies - len(active_holds) <= 0 and not user_has_hold
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Sách đã hết bản có thể cho mượn; phiếu vẫn ở trạng thái chờ",
            )

        today = date.today()
        book.available_copies -= 1
        loan.status = "BORROWING"
        loan.borrow_date = today
        loan.due_date = today + timedelta(days=loan.days)
        loan.approved_by = librarian_id
        for reservation in active_holds:
            if reservation.user_id == loan.user_id:
                reservation.status = "FULFILLED"
                reservation.hold_expires_at = None
                break
        create_system_log(
            db,
            action="APPROVE_LOAN",
            resource="LOAN",
            user_id=librarian_id,
            details=f"Duyệt phiếu mượn ID {loan.id}",
        )
        db.commit()
        db.refresh(loan)
        return loan

    @staticmethod
    def reject(db: Session, loan_id: int, librarian_id: int) -> Loan:
        loan = (
            db.query(Loan)
            .filter(Loan.id == loan_id)
            .with_for_update()
            .first()
        )
        if loan is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy phiếu mượn",
            )
        if loan.status != "PENDING":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Chỉ có thể từ chối phiếu đang chờ",
            )

        loan.status = "REJECTED"
        create_system_log(
            db,
            action="REJECT_LOAN",
            resource="LOAN",
            user_id=librarian_id,
            details=f"Từ chối phiếu mượn ID {loan.id}",
        )
        db.commit()
        db.refresh(loan)
        return loan

    @staticmethod
    def return_book(db: Session, loan_id: int, librarian_id: int) -> Loan:
        loan = (
            db.query(Loan)
            .filter(Loan.id == loan_id)
            .with_for_update()
            .first()
        )
        if loan is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy phiếu mượn",
            )
        if loan.status != "BORROWING":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Chỉ có thể nhận trả phiếu đang được mượn",
            )
        if loan.due_date is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Phiếu mượn chưa có hạn trả",
            )

        book = (
            db.query(Book)
            .filter(Book.id == loan.book_id)
            .with_for_update()
            .first()
        )
        if book is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy sách của phiếu mượn",
            )
        if db.query(Fine).filter(Fine.loan_id == loan.id).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Phiếu mượn đã có khoản phạt được chốt",
            )

        returned_on = date.today()
        fine_amount = FineService.calculate_fine(loan.due_date, returned_on)
        loan.status = "RETURNED"
        loan.return_date = returned_on
        book.available_copies += 1
        ReservationService.sync_book(db, book)
        if fine_amount:
            db.add(Fine(loan_id=loan.id, amount=fine_amount, paid=False))

        create_system_log(
            db,
            action="RETURN_LOAN",
            resource="LOAN",
            user_id=librarian_id,
            details=f"Nhận trả phiếu mượn ID {loan.id}; tiền phạt {fine_amount}đ",
        )
        db.commit()
        db.refresh(loan)
        return loan

    @staticmethod
    def extend(db: Session, loan_id: int, user_id: int) -> Loan:
        loan = (
            db.query(Loan)
            .filter(Loan.id == loan_id, Loan.user_id == user_id)
            .with_for_update()
            .first()
        )
        if loan is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy phiếu mượn",
            )
        if loan.status != "BORROWING":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Chỉ có thể gia hạn phiếu đang được mượn",
            )
        if loan.due_date is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Phiếu mượn chưa có hạn trả",
            )
        if loan.due_date < date.today():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Không thể gia hạn phiếu đã quá hạn",
            )
        if (loan.extension_count or 0) >= 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Mỗi phiếu mượn chỉ được gia hạn một lần",
            )

        book = (
            db.query(Book)
            .filter(Book.id == loan.book_id)
            .with_for_update()
            .first()
        )
        if book is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy sách của phiếu mượn",
            )

        now = datetime.now(timezone.utc)
        active_reservation = (
            db.query(Reservation)
            .filter(
                Reservation.book_id == loan.book_id,
                Reservation.user_id != user_id,
                or_(
                    Reservation.status == "WAITING",
                    and_(
                        Reservation.status == "HOLDING",
                        Reservation.hold_expires_at > now,
                    ),
                ),
            )
            .first()
        )
        if active_reservation is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Không thể gia hạn vì độc giả khác đang chờ hoặc giữ chỗ cuốn sách",
            )

        loan.due_date += timedelta(days=LOAN_EXTENSION_DAYS)
        loan.extension_count = (loan.extension_count or 0) + 1
        create_system_log(
            db,
            action="EXTEND_LOAN",
            resource="LOAN",
            user_id=user_id,
            details=(
                f"Gia hạn phiếu mượn ID {loan.id} thêm {LOAN_EXTENSION_DAYS} ngày; "
                f"hạn trả mới {loan.due_date.isoformat()}"
            ),
        )
        db.commit()
        db.refresh(loan)
        return loan
