from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.dependencies import RoleChecker
from app.models import User

router = APIRouter(prefix="/api/stats", tags=["Statistics"])

allow_librarian_or_admin = RoleChecker(["LIBRARIAN", "ADMIN"])


@router.get("/overview", response_model=schemas.StatsOverviewResponse)
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_librarian_or_admin),
):
    return crud.get_stats_overview(db=db)


@router.get("/top-books", response_model=List[schemas.TopBookItem])
def get_top_books(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_librarian_or_admin),
):
    return crud.get_top_borrowed_books(db=db, limit=5)


@router.get("/monthly", response_model=List[schemas.MonthlyLoanItem])
def get_monthly_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_librarian_or_admin),
):
    return crud.get_monthly_loan_stats(db=db, months=6)