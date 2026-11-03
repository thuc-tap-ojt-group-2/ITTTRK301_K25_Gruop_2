import math
from sqlalchemy.orm import Session, joinedload
from app.models import Book
from app.schemas import BookResponse, PageResponse

def get_books_paginated(db: Session, page: int = 1, size: int = 10) -> PageResponse:
    page = max(1, page)
    size = max(1, size)
    skip = (page - 1) * size

    total_elements = db.query(Book).count()
    total_pages = math.ceil(total_elements / size) if total_elements > 0 else 0

    books = (
        db.query(Book)
        .options(joinedload(Book.category))
        .order_by(Book.id.desc())
        .offset(skip)
        .limit(size)
        .all()
    )

    content = [
        BookResponse(
            id=b.id,
            title=b.title,
            author=b.author,
            categoryName=b.category.name if b.category else "",
            totalCopies=b.total_copies,
            availableCopies=b.available_copies,
            imageUrl=b.image_url
        )
        for b in books
    ]

    return PageResponse(
        content=content,
        pageNumber=page,
        pageSize=size,
        totalElements=total_elements,
        totalPages=total_pages,
        last=(page >= total_pages) if total_pages > 0 else True
    )