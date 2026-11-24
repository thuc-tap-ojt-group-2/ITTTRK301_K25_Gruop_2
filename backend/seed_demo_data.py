from datetime import date, timedelta

from sqlalchemy import or_

from app import auth_service
from app.database import SessionLocal
from app.models import Book, Fine, Loan, Reservation, User


DEMO_PASSWORD = "123456"
DEMO_PUBLISHER = "PTIT - Dữ liệu mẫu"


def seed_missing_book_metadata(db):
    updated = 0
    for book in db.query(Book).all():
        changed = False
        if not book.isbn:
            book.isbn = f"DEMO-PTIT-{book.id:05d}"
            changed = True
        if not book.publisher:
            book.publisher = DEMO_PUBLISHER
            changed = True
        if book.publication_year is None:
            book.publication_year = 2024
            changed = True
        if not book.description:
            category = book.category.name if book.category else "chưa phân loại"
            book.description = (
                f"Dữ liệu mẫu giới thiệu sách {book.title} thuộc thể loại {category}. "
                "Vui lòng cập nhật bằng thông tin thư mục chính thức."
            )
            changed = True
        updated += int(changed)
    return updated


def seed_demo_fines(db, today):
    cases = (
        ("B22DCCN111", "Cấu trúc dữ liệu và Giải thuật", 20, 10, 5, False),
        ("B22DCCN112", "Clean Code - Mã sạch", 30, 14, 10, True),
    )
    created = 0
    for username, title, borrowed_days, due_days, returned_days, paid in cases:
        reader = db.query(User).filter(User.username == username).first()
        book = db.query(Book).filter(Book.title == title).first()
        if reader is None or book is None:
            print(f"Skipped demo fine for {username}: reader or book is missing.")
            continue

        existing = (
            db.query(Fine)
            .join(Loan, Fine.loan_id == Loan.id)
            .filter(Loan.user_id == reader.id, Loan.book_id == book.id)
            .first()
        )
        if existing:
            continue

        due_date = today - timedelta(days=due_days)
        return_date = today - timedelta(days=returned_days)
        loan = Loan(
            user_id=reader.id,
            book_id=book.id,
            status="RETURNED",
            days=14,
            borrow_date=today - timedelta(days=borrowed_days),
            due_date=due_date,
            return_date=return_date,
        )
        db.add(loan)
        db.flush()
        db.add(Fine(
            loan_id=loan.id,
            amount=(return_date - due_date).days * 5000,
            paid=paid,
        ))
        created += 1
    return created


def main():
    today = date.today()
    created_readers = []
    skipped_readers = []
    created_fines = 0

    with SessionLocal.begin() as db:
        for index in range(1, 13):
            username = f"B22DCCN{100 + index}"
            email = f"reader{index}@ptit.edu.vn"
            existing = db.query(User).filter(
                or_(User.username == username, User.email == email)
            ).first()
            if existing:
                skipped_readers.append(username)
                continue
            reader = User(
                username=username,
                email=email,
                password_hash=auth_service.hash_password(DEMO_PASSWORD),
                full_name=f"Độc giả demo {index}",
                role="READER",
                is_locked=False,
            )
            db.add(reader)
            db.flush()
            created_readers.append(reader)

        books = db.query(Book).all()
        readers = db.query(User).filter(User.role == "READER").all()

        if len(readers) < 1 or len(books) < 1:
            print("Seeder needs at least one reader and one book.")
            return

        updated_book_metadata = seed_missing_book_metadata(db)
        existing_loans = db.query(Loan).count()
        existing_reservations = db.query(Reservation).count()

        if existing_loans == 0:
            statuses = [
                ("BORROWING", 18, 12),
                ("BORROWING", 20, -5),
                ("BORROWING", 24, 3),
                ("BORROWING", 28, -2),
                ("RETURNED", 95, -10),
                ("RETURNED", 75, -15),
                ("OVERDUE", 22, -8),
                ("PENDING", 5, 20),
                ("RETURNED", 120, -20),
                ("BORROWING", 65, 8),
                ("BORROWING", 48, 1),
                ("RETURNED", 150, -14),
            ]
            for index, (status, borrow_offset, due_offset) in enumerate(statuses):
                reader = readers[index % len(readers)]
                book = books[index % len(books)]
                borrow_date = today - timedelta(days=borrow_offset)
                due_date = today + timedelta(days=due_offset)
                return_date = None
                if status == "RETURNED":
                    return_date = today - timedelta(days=max(1, 5 + (index % 30)))
                    due_date = return_date - timedelta(days=2)
                if status == "OVERDUE":
                    status_value = "BORROWING"
                elif status == "PENDING":
                    status_value = "PENDING"
                else:
                    status_value = status
                db.add(Loan(
                    user_id=reader.id,
                    book_id=book.id,
                    status=status_value,
                    days=14,
                    borrow_date=borrow_date,
                    due_date=due_date,
                    return_date=return_date,
                    created_at=borrow_date,
                ))
            db.flush()

        if existing_reservations == 0:
            for index in range(6):
                db.add(Reservation(
                    user_id=readers[index % len(readers)].id,
                    book_id=books[(index + 3) % len(books)].id,
                    status="WAITING",
                    created_at=today - timedelta(days=index),
                ))

        created_fines = seed_demo_fines(db, today)

    print(f"Created readers: {len(created_readers)}")
    print(f"Skipped existing readers: {len(skipped_readers)}")
    print(f"Books with missing sample metadata filled: {updated_book_metadata}")
    print(f"Created finalized demo fines: {created_fines}")
    print("Demo loans, reservations, and fines are repeat-safe.")


if __name__ == "__main__":
    main()
