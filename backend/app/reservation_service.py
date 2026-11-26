from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.log_service import create_system_log
from app.models import Book, Loan, Reservation, User

HOLD_DURATION = timedelta(hours=48)
ACTIVE_LOAN_STATUSES = ("PENDING", "BORROWING")
ACTIVE_RESERVATION_STATUSES = ("WAITING", "HOLDING")


class ReservationService:
    @staticmethod
    def active_holds(db: Session, book_id: int) -> List[Reservation]:
        return (
            db.query(Reservation)
            .filter(
                Reservation.book_id == book_id,
                Reservation.status == "HOLDING",
                Reservation.hold_expires_at > datetime.now(timezone.utc),
            )
            .all()
        )

    @classmethod
    def sync_book(cls, db: Session, book: Book) -> None:
        now = datetime.now(timezone.utc)
        expired_holds = (
            db.query(Reservation)
            .filter(
                Reservation.book_id == book.id,
                Reservation.status == "HOLDING",
                Reservation.hold_expires_at <= now,
            )
            .with_for_update()
            .all()
        )
        for reservation in expired_holds:
            reservation.status = "EXPIRED"
            create_system_log(
                db,
                action="EXPIRE_RESERVATION",
                resource="RESERVATION",
                user_id=None,
                details=f"Hết hạn giữ chỗ ID {reservation.id}",
            )

        holdings = cls.active_holds(db, book.id)
        available_for_reservations = max(0, book.available_copies - len(holdings))
        waiting = (
            db.query(Reservation)
            .filter(
                Reservation.book_id == book.id,
                Reservation.status == "WAITING",
            )
            .order_by(Reservation.created_at.asc(), Reservation.id.asc())
            .with_for_update()
            .all()
        )
        for reservation in waiting[:available_for_reservations]:
            reservation.status = "HOLDING"
            reservation.hold_expires_at = now + HOLD_DURATION
            create_system_log(
                db,
                action="HOLD_RESERVATION",
                resource="RESERVATION",
                user_id=None,
                details=f"Giữ sách 48 giờ cho phiếu đặt trước ID {reservation.id}",
            )

    @classmethod
    def create(cls, db: Session, user_id: int, book_id: int) -> Reservation:
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
        cls.sync_book(db, book)
        active_holds = cls.active_holds(db, book.id)
        if book.available_copies - len(active_holds) > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Chỉ được đặt trước khi sách hết bản",
            )

        active_loan = (
            db.query(Loan)
            .filter(
                Loan.user_id == user_id,
                Loan.book_id == book_id,
                Loan.status.in_(ACTIVE_LOAN_STATUSES),
            )
            .first()
        )
        if active_loan:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Bạn đang mượn hoặc có phiếu chờ duyệt cho cuốn sách này",
            )

        existing = (
            db.query(Reservation)
            .filter(
                Reservation.user_id == user_id,
                Reservation.book_id == book_id,
                Reservation.status.in_(ACTIVE_RESERVATION_STATUSES),
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Bạn đã đặt trước cuốn sách này và đang trong hàng chờ",
            )

        reservation = Reservation(
            user_id=user_id,
            book_id=book_id,
            status="WAITING",
            created_at=datetime.now(timezone.utc),
        )
        db.add(reservation)
        db.flush()
        cls.sync_book(db, book)
        create_system_log(
            db,
            action="CREATE_RESERVATION",
            resource="RESERVATION",
            user_id=user_id,
            details=f"Đặt trước sách ID {book_id}, phiếu {reservation.id}",
        )
        db.commit()
        db.refresh(reservation)
        return reservation

    @classmethod
    def cancel(cls, db: Session, reservation_id: int, user_id: int) -> Reservation:
        reservation = (
            db.query(Reservation)
            .filter(
                Reservation.id == reservation_id,
                Reservation.user_id == user_id,
            )
            .first()
        )
        if reservation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy phiếu đặt trước",
            )

        book = (
            db.query(Book)
            .filter(Book.id == reservation.book_id)
            .with_for_update()
            .first()
        )
        if book is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy sách của phiếu đặt trước",
            )
        reservation = (
            db.query(Reservation)
            .filter(
                Reservation.id == reservation_id,
                Reservation.user_id == user_id,
            )
            .with_for_update()
            .first()
        )
        if reservation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy phiếu đặt trước",
            )
        cls.sync_book(db, book)
        if reservation.status not in ACTIVE_RESERVATION_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Phiếu đặt trước không còn hoạt động",
            )

        reservation.status = "CANCELLED"
        reservation.hold_expires_at = None
        cls.sync_book(db, book)
        create_system_log(
            db,
            action="CANCEL_RESERVATION",
            resource="RESERVATION",
            user_id=user_id,
            details=f"Hủy phiếu đặt trước ID {reservation.id}",
        )
        db.commit()
        db.refresh(reservation)
        return reservation

    @classmethod
    def list_for_reader(cls, db: Session, user_id: int) -> List[Reservation]:
        rows = (
            db.query(Reservation)
            .filter(Reservation.user_id == user_id)
            .order_by(Reservation.created_at.desc(), Reservation.id.desc())
            .all()
        )
        book_ids = {row.book_id for row in rows}
        for book_id in book_ids:
            book = (
                db.query(Book)
                .filter(Book.id == book_id)
                .with_for_update()
                .first()
            )
            if book:
                cls.sync_book(db, book)
        db.commit()
        return (
            db.query(Reservation)
            .filter(Reservation.user_id == user_id)
            .order_by(Reservation.created_at.desc(), Reservation.id.desc())
            .all()
        )
