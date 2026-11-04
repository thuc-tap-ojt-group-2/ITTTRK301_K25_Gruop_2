import math
<<<<<<< HEAD
from sqlalchemy.orm import Session, joinedload
from app.models import Book
from app.schemas import BookResponse, PageResponse
=======
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.models import Book, Category
from app.schemas import BookResponse, PageResponse, BookCreateRequest
>>>>>>> 00c7b4d7888699dcb88e483c81b1c431485778e4

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
<<<<<<< HEAD
=======
    )

def create_book(db: Session, book_in: BookCreateRequest) -> BookResponse:
    category = db.query(Category).filter(Category.id == book_in.categoryId).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": f"Thể loại với ID {book_in.categoryId} không tồn tại"}
        )

    new_book = Book(
        title=book_in.title.strip(),
        author=book_in.author.strip(),
        category_id=book_in.categoryId,
        total_copies=book_in.total,
        available_copies=book_in.total,
        image_url=book_in.imageUrl
    )

    db.add(new_book)
    db.commit()
    db.refresh(new_book)

    return BookResponse(
        id=new_book.id,
        title=new_book.title,
        author=new_book.author,
        categoryName=category.name,
        totalCopies=new_book.total_copies,
        availableCopies=new_book.available_copies,
        imageUrl=new_book.image_url
>>>>>>> 00c7b4d7888699dcb88e483c81b1c431485778e4
    )