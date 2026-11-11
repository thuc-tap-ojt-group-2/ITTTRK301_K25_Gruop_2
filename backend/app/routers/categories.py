from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, schemas

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return crud.get_categories(db)


@router.post("", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(cat_in: schemas.CategoryCreateRequest, db: Session = Depends(get_db)):
    return crud.create_category(db, cat_in)


@router.put("/{id}", response_model=schemas.CategoryResponse)
def update_category(id: int, cat_in: schemas.CategoryUpdateRequest, db: Session = Depends(get_db)):
    return crud.update_category(db, id, cat_in)


@router.delete("/{id}")
def delete_category(id: int, db: Session = Depends(get_db)):
    return crud.delete_category(db, id)