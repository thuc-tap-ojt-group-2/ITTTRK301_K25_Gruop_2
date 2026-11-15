from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import RoleChecker
from app.models import User
from app.reservation_service import ReservationService
from app.schemas import ReservationCreateRequest, ReservationResponse

router = APIRouter(prefix="/api/reservations", tags=["Reservations"])
reader_only = RoleChecker(["READER", "USER"])


@router.post("", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
def create_reservation(
    reservation_in: ReservationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(reader_only),
):
    return ReservationService.create(
        db, user_id=current_user.id, book_id=reservation_in.book_id
    )


@router.get("/mine", response_model=List[ReservationResponse])
def get_my_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(reader_only),
):
    return ReservationService.list_for_reader(db, user_id=current_user.id)


@router.delete("/{reservation_id}", response_model=ReservationResponse)
def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(reader_only),
):
    return ReservationService.cancel(
        db, reservation_id=reservation_id, user_id=current_user.id
    )
