from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/api/fines", tags=["Fines"])

@router.get("/mine", response_model=schemas.MyFineSummaryResponse)
def get_my_fines(
    user_id: int = Query(..., description="ID của độc giả đang đăng nhập"),
    db: Session = Depends(get_db),
):
    return crud.get_user_fines(db=db, user_id=user_id)


@router.get("/calculate/{loan_id}", response_model=schemas.FineCalculateResponse)
def calculate_fine(
    loan_id: int,
    fine_per_day: float = Query(5000.0, ge=0.0),
    db: Session = Depends(get_db),
):
    return crud.calculate_fine(db=db, loan_id=loan_id, fine_per_day=fine_per_day)


@router.get("", response_model=List[schemas.FineDetailResponse])
def get_all_fines(db: Session = Depends(get_db)):
    return crud.get_all_fines_detailed(db=db)


@router.put("/{fine_id}/paid")
def pay_fine(fine_id: int, db: Session = Depends(get_db)):
    return crud.mark_fine_as_paid(db=db, fine_id=fine_id)