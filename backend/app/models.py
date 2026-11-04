from sqlalchemy import Column, Integer, BigInteger, String, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)

    books = relationship("Book", back_populates="category")


class Book(Base):
    __tablename__ = "books"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    author = Column(String(150), nullable=False)
    category_id = Column(BigInteger, ForeignKey("categories.id"), nullable=False)
    total_copies = Column(Integer, nullable=False, default=1)
    available_copies = Column(Integer, nullable=False, default=1)
    image_url = Column(String(500), nullable=True)

    category = relationship("Category", back_populates="books")
    loans = relationship("Loan", back_populates="book")


class Loan(Base):
    __tablename__ = "loans"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, nullable=False)
    book_id = Column(BigInteger, ForeignKey("books.id"), nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")
    days = Column(Integer, nullable=False, default=14)
    borrow_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    return_date = Column(Date, nullable=True)
    approved_by = Column(BigInteger, nullable=True)

    book = relationship("Book", back_populates="loans")