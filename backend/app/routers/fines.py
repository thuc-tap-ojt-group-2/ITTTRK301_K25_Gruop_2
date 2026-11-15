from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.dependencies import RoleChecker
from app.models import User

router = APIRouter(prefix="/api/fines", tags=["Fines"])
reader_only = RoleChecker(["READER", "USER"])
staff_only = RoleChecker(["LIBRARIAN", "ADMIN"])

@router.get("/mine", response_model=schemas.MyFineSummaryResponse)
def get_my_fines(
    db: Session = Depends(get_db),
    current_user: User = Depends(reader_only),
):
    return crud.get_user_fines(db=db, user_id=current_user.id)


@router.get("/calculate/{loan_id}", response_model=schemas.FineCalculateResponse)
def calculate_fine(
    loan_id: int,
    fine_per_day: float = Query(5000.0, ge=0.0),
    db: Session = Depends(get_db),
    _current_user: User = Depends(staff_only),
):
    return crud.calculate_fine(db=db, loan_id=loan_id, fine_per_day=fine_per_day)


@router.get("", response_model=List[schemas.FineDetailResponse])
def get_all_fines(
    db: Session = Depends(get_db),
    _current_user: User = Depends(staff_only),
):
    return crud.get_all_fines_detailed(db=db)


@router.put("/{fine_id}/paid")
def pay_fine(
    fine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_only),
):
    return crud.mark_fine_as_paid(
        db=db, fine_id=fine_id, actor_id=current_user.id
    )