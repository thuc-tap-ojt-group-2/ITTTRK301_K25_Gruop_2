from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, schemas, models

router = APIRouter(prefix="/api/fines", tags=["Fines"])


@router.get("/calculate/{loan_id}", response_model=schemas.FineCalculateResponse)
def calculate_fine(
    loan_id: int,
    fine_per_day: float = Query(5000.0, ge=0.0),
    db: Session = Depends(get_db),
):
    return crud.calculate_fine(db=db, loan_id=loan_id, fine_per_day=fine_per_day)


@router.get("", response_model=List[schemas.FineResponse])
def get_fines(
    db: Session = Depends(get_db),
):
    fines = db.query(models.Fine).order_by(models.Fine.id.desc()).all()
    return [
        schemas.FineResponse(
            id=f.id,
            loanId=f.loan_id,
            amount=float(f.amount),
            paid=f.paid
        )
        for f in fines
    ]


@router.put("/{fine_id}/pay")
def pay_fine(fine_id: int, db: Session = Depends(get_db)):
    fine = db.query(models.Fine).filter(models.Fine.id == fine_id).first()
    if not fine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy khoản phạt"
        )
    fine.paid = True
    db.commit()
    return {"message": "Thanh toán phí phạt thành công", "fineId": fine.id}