from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import RoleChecker
from app.models import Book, Reservation, User
from app.reservation_service import ReservationService
from app.schemas import ReservationCreateRequest, ReservationResponse

router = APIRouter(prefix="/api/reservations", tags=["Reservations"])
reader_only = RoleChecker(["READER", "USER"])


def _to_response(db: Session, reservation: Reservation) -> ReservationResponse:
    book = db.query(Book).filter(Book.id == reservation.book_id).first()
    queue_position = None
    if reservation.status == "WAITING":
        ahead = (
            db.query(func.count(Reservation.id))
            .filter(
                Reservation.book_id == reservation.book_id,
                Reservation.status == "WAITING",
                (Reservation.created_at < reservation.created_at)
                | (
                    (Reservation.created_at == reservation.created_at)
                    & (Reservation.id < reservation.id)
                ),
            )
            .scalar()
        )
        queue_position = int(ahead or 0) + 1

    return ReservationResponse(
        id=reservation.id,
        userId=reservation.user_id,
        bookId=reservation.book_id,
        bookTitle=book.title if book else "",
        bookAuthor=book.author if book else "",
        status=reservation.status,
        queuePosition=queue_position,
        createdAt=reservation.created_at,
        holdExpiresAt=reservation.hold_expires_at,
    )


@router.post("", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
def create_reservation(
    reservation_in: ReservationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(reader_only),
):
    res = ReservationService.create(
        db, user_id=current_user.id, book_id=reservation_in.bookId
    )
    return _to_response(db, res)


@router.get("/mine", response_model=List[ReservationResponse])
def get_my_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(reader_only),
):
    rows = ReservationService.list_for_reader(db, user_id=current_user.id)
    return [_to_response(db, r) for r in rows]


@router.delete("/{reservation_id}", response_model=ReservationResponse)
def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(reader_only),
):
    res = ReservationService.cancel(
        db, reservation_id=reservation_id, user_id=current_user.id
    )
    return _to_response(db, res)