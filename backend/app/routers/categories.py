from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, schemas
from app.dependencies import RoleChecker
from app.models import User

router = APIRouter(prefix="/api/categories", tags=["Categories"])
staff_only = RoleChecker(["LIBRARIAN", "ADMIN"])


@router.get("", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return crud.get_categories(db)


@router.post("", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: schemas.CategoryCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_only),
):
    return crud.create_category(db, cat_in, actor_id=current_user.id)


@router.put("/{id}", response_model=schemas.CategoryResponse)
def update_category(
    id: int,
    cat_in: schemas.CategoryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_only),
):
    return crud.update_category(db, id, cat_in, actor_id=current_user.id)


@router.delete("/{id}")
def delete_category(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_only),
):
    return crud.delete_category(db, id, actor_id=current_user.id)