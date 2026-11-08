from datetime import datetime, timezone
from app.database import Base
from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
 
 
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
 
 
class User(Base):
    __tablename__ = "users"
 
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    # Vai trò theo SRS: READER, LIBRARIAN, ADMIN
    role = Column(String(20), nullable=False, default="READER")
    # AUTH-06: False nghĩa là tài khoản bị khóa
    is_active = Column(Boolean, nullable=False, default=True, server_default="1")
 
    # Loan có 2 khóa ngoại tới users (user_id, approved_by) nên phải chỉ rõ dùng cột nào
    loans = relationship(
        "Loan", back_populates="user", foreign_keys="Loan.user_id"
    )
    logs = relationship("SystemLog", back_populates="user")
 
 
class Loan(Base):
    __tablename__ = "loans"
 
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    book_id = Column(BigInteger, ForeignKey("books.id"), nullable=False)
 
    status = Column(String(20), nullable=False, default="PENDING", index=True)
    days = Column(Integer, nullable=False, default=14)
    borrow_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    return_date = Column(Date, nullable=True)
    # Thủ thư đã duyệt phiếu này
    approved_by = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
 
    book = relationship("Book", back_populates="loans")
    user = relationship("User", back_populates="loans", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])
 
 
class SystemLog(Base):
    __tablename__ = "system_logs"
 
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    resource = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
 
    user = relationship("User", back_populates="logs")