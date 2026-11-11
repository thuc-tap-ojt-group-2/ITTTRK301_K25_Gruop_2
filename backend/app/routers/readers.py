from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/api/readers", tags=["Readers"])


@router.get("", response_model=List[schemas.ReaderResponse])
def get_readers(
    keyword: Optional[str] = Query(None, description="Tìm theo tên, email, mã SV"),
    db: Session = Depends(get_db)
):
    return crud.get_readers(db, keyword)

@router.get("/{id}/loans", response_model=List[schemas.ReaderLoanHistoryResponse])
def get_reader_loans(id: int, db: Session = Depends(get_db)):
    return crud.get_reader_loan_history(db=db, reader_id=id)