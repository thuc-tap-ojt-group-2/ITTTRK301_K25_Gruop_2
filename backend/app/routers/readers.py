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