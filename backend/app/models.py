from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Boolean, ForeignKey, Date, DateTime
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
    fine = relationship("Fine", back_populates="loan", uselist=False)


class Fine(Base):
    __tablename__ = "fines"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    loan_id = Column(BigInteger, ForeignKey("loans.id"), unique=True, nullable=False)
    amount = Column(Integer, nullable=False, default=0)
    paid = Column(Boolean, nullable=False, default=False)

    loan = relationship("Loan", back_populates="fine")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    actor_id = Column(BigInteger, nullable=True)
    action = Column(String(50), nullable=False)
    detail = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(20), nullable=False, default="USER")