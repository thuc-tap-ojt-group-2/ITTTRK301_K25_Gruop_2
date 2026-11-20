import unittest
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker

from app import auth_service
from app import crud
from app.database import Base
from app.dependencies import get_current_user
from app.loan_service import LoanService
from app.models import (
    AuditLog,
    Book,
    Category,
    Fine,
    Reservation,
    RevokedToken,
    User,
)
from app.reservation_service import ReservationService
from app.routers.loans import extend_loan
from app.routers.admin import list_audit_logs
from app.routers.auth import change_password, login, logout, register
from app.schemas import PasswordChangeRequest, UserLogin, UserRegister
import migrate_auth_loan


class AuthAndLoanTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        self.db.add(Category(id=1, name="Test"))
        self.db.add(
            User(
                id=1,
                username="reader-1",
                email="reader@example.test",
                password_hash=auth_service.hash_password("secret1"),
                role="READER",
            )
        )
        self.db.add(
            User(
                id=2,
                username="staff-1",
                email="staff@example.test",
                password_hash=auth_service.hash_password("secret1"),
                role="LIBRARIAN",
            )
        )
        self.db.add(
            Book(
                id=1,
                title="Test book",
                author="Test author",
                category_id=1,
                total_copies=1,
                available_copies=1,
            )
        )
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_jwt_is_verified_by_the_same_configuration_and_can_be_revoked(self):
        token = auth_service.create_access_token(
            {"sub": "reader-1", "user_id": 1, "role": "READER"}
        )
        self.assertEqual(auth_service.decode_access_token(token)["sub"], "reader-1")
        self.assertEqual(get_current_user(token, self.db).id, 1)

        payload = auth_service.decode_access_token(token)
        from datetime import datetime, timezone

        self.db.add(
            RevokedToken(
                jti=payload["jti"],
                expires_at=datetime.fromtimestamp(payload["exp"], timezone.utc),
            )
        )
        self.db.commit()
        with self.assertRaises(HTTPException) as error:
            get_current_user(token, self.db)
        self.assertEqual(error.exception.status_code, 401)

    def test_registration_login_password_change_and_logout(self):
        created = register(
            UserRegister(
                username="new-reader",
                email="new-reader@library.org",
                password="secret2",
                full_name="New Reader",
            ),
            self.db,
        )
        user = self.db.get(User, created["user_id"])
        self.assertEqual(user.role, "READER")

        token_data = login(
            UserLogin(username="new-reader@library.org", password="secret2"),
            self.db,
        )
        token = token_data["access_token"]
        current_user = get_current_user(token, self.db)

        change_password(
            PasswordChangeRequest(
                current_password="secret2",
                new_password="secret3",
            ),
            self.db,
            current_user,
        )
        with self.assertRaises(HTTPException):
            login(UserLogin(username="new-reader", password="secret2"), self.db)
        new_token = login(
            UserLogin(username="new-reader", password="secret3"),
            self.db,
        )["access_token"]

        current_user = get_current_user(new_token, self.db)
        logout(self.db, current_user, new_token)
        with self.assertRaises(HTTPException) as revoked:
            get_current_user(new_token, self.db)
        self.assertEqual(revoked.exception.status_code, 401)

    def test_locked_user_cannot_use_an_existing_token(self):
        token = auth_service.create_access_token(
            {"sub": "reader-1", "user_id": 1, "role": "READER"}
        )
        user = self.db.get(User, 1)
        user.is_locked = True
        self.db.commit()

        with self.assertRaises(HTTPException) as error:
            get_current_user(token, self.db)
        self.assertEqual(error.exception.status_code, 401)

    def test_audit_logs_resolve_actor_names_and_handle_unknown_actors(self):
        reader = self.db.get(User, 1)
        reader.full_name = "Nguyễn An"
        self.db.add_all(
            [
                AuditLog(actor_id=1, action="LOGIN", detail="AUTH: Đăng nhập"),
                AuditLog(actor_id=99, action="LOGIN", detail="AUTH: Đăng nhập"),
                AuditLog(actor_id=None, action="LOGIN_FAILED", detail="AUTH: Thất bại"),
            ]
        )
        self.db.commit()

        logs = list_audit_logs(limit=10, db=self.db, _current_user=reader)
        actors = {log["actor_id"]: log["actor_name"] for log in logs}

        self.assertEqual(
            actors,
            {
                1: "Nguyễn An (reader-1)",
                99: "Tài khoản #99 (không còn tồn tại)",
                None: "Khách / tài khoản không xác định",
            },
        )

    def test_request_does_not_decrement_stock_until_approval(self):
        loan = LoanService.create_request(self.db, user_id=1, book_id=1, days=14)
        self.assertEqual(loan.status, "PENDING")
        self.assertEqual(self.db.get(Book, 1).available_copies, 1)

        approved = LoanService.approve(self.db, loan.id, librarian_id=2)
        self.assertEqual(approved.status, "BORROWING")
        self.assertEqual(approved.due_date, date.today() + timedelta(days=14))
        self.assertEqual(self.db.get(Book, 1).available_copies, 0)

    def test_business_rules_reject_invalid_loan_requests(self):
        with self.assertRaises(HTTPException) as invalid_days:
            LoanService.create_request(self.db, user_id=1, book_id=1, days=10)
        self.assertEqual(invalid_days.exception.status_code, 400)

        LoanService.create_request(self.db, user_id=1, book_id=1, days=7)
        with self.assertRaises(HTTPException) as duplicate:
            LoanService.create_request(self.db, user_id=1, book_id=1, days=14)
        self.assertEqual(duplicate.exception.status_code, 409)

        for book_id in (2, 3, 4):
            self.db.add(
                Book(
                    id=book_id,
                    title=f"Book {book_id}",
                    author="Test",
                    category_id=1,
                    total_copies=1,
                    available_copies=1,
                )
            )
        self.db.commit()
        LoanService.create_request(self.db, user_id=1, book_id=2, days=7)
        LoanService.create_request(self.db, user_id=1, book_id=3, days=7)
        with self.assertRaises(HTTPException) as too_many:
            LoanService.create_request(self.db, user_id=1, book_id=4, days=7)
        self.assertEqual(too_many.exception.status_code, 409)

    def test_request_accepts_thirty_days(self):
        loan = LoanService.create_request(self.db, user_id=1, book_id=1, days=30)
        self.assertEqual(loan.days, 30)
        self.assertEqual(loan.status, "PENDING")

    def test_overdue_loan_blocks_new_request(self):
        loan = LoanService.create_request(self.db, user_id=1, book_id=1, days=7)
        loan = LoanService.approve(self.db, loan.id, librarian_id=2)
        loan.due_date = date.today() - timedelta(days=1)
        self.db.add(
            Book(
                id=2,
                title="Another book",
                author="Test author",
                category_id=1,
                total_copies=1,
                available_copies=1,
            )
        )
        self.db.commit()

        with self.assertRaises(HTTPException) as overdue:
            LoanService.create_request(self.db, user_id=1, book_id=2, days=7)
        self.assertEqual(overdue.exception.status_code, 409)
        self.assertIn("quá hạn", overdue.exception.detail)

    def test_loan_can_be_extended_once_by_seven_days(self):
        loan = LoanService.create_request(self.db, user_id=1, book_id=1, days=14)
        loan = LoanService.approve(self.db, loan.id, librarian_id=2)
        original_due_date = loan.due_date

        extended = LoanService.extend(self.db, loan.id, user_id=1)

        self.assertEqual(extended.due_date, original_due_date + timedelta(days=7))
        self.assertEqual(extended.extension_count, 1)

    def test_loan_cannot_be_extended_twice(self):
        loan = LoanService.create_request(self.db, user_id=1, book_id=1, days=14)
        loan = LoanService.approve(self.db, loan.id, librarian_id=2)
        LoanService.extend(self.db, loan.id, user_id=1)
        due_date_after_first_extension = loan.due_date

        with self.assertRaises(HTTPException) as second_extension:
            LoanService.extend(self.db, loan.id, user_id=1)

        self.assertEqual(second_extension.exception.status_code, 409)
        self.assertEqual(loan.due_date, due_date_after_first_extension)
        self.assertEqual(loan.extension_count, 1)

    def test_overdue_loan_cannot_be_extended(self):
        loan = LoanService.create_request(self.db, user_id=1, book_id=1, days=7)
        loan = LoanService.approve(self.db, loan.id, librarian_id=2)
        loan.due_date = date.today() - timedelta(days=1)
        self.db.commit()

        with self.assertRaises(HTTPException) as overdue:
            LoanService.extend(self.db, loan.id, user_id=1)

        self.assertEqual(overdue.exception.status_code, 409)
        self.assertIn("quá hạn", overdue.exception.detail)
        self.assertEqual(loan.extension_count, 0)

    def test_reservation_by_another_reader_blocks_extension(self):
        self.db.add(
            User(
                id=3,
                username="reader-2",
                email="reader2@library.org",
                password_hash=auth_service.hash_password("secret1"),
                role="READER",
            )
        )
        self.db.commit()
        loan = LoanService.create_request(self.db, user_id=1, book_id=1, days=14)
        loan = LoanService.approve(self.db, loan.id, librarian_id=2)
        created_reservation = ReservationService.create(
            self.db, user_id=3, book_id=1
        )

        with self.assertRaises(HTTPException) as reservation:
            LoanService.extend(self.db, loan.id, user_id=1)

        self.assertEqual(reservation.exception.status_code, 409)
        self.assertIn("đang chờ hoặc giữ chỗ", reservation.exception.detail)
        self.assertEqual(loan.extension_count, 0)

        created_reservation.status = "HOLDING"
        created_reservation.hold_expires_at = datetime.now(timezone.utc) + timedelta(
            hours=1
        )
        self.db.commit()
        with self.assertRaises(HTTPException):
            LoanService.extend(self.db, loan.id, user_id=1)

        created_reservation.hold_expires_at = datetime.now(timezone.utc) - timedelta(
            minutes=1
        )
        self.db.commit()
        extended = LoanService.extend(self.db, loan.id, user_id=1)
        self.assertEqual(extended.extension_count, 1)

    def test_extend_loan_route_returns_updated_loan(self):
        loan = LoanService.create_request(self.db, user_id=1, book_id=1, days=14)
        loan = LoanService.approve(self.db, loan.id, librarian_id=2)

        response = extend_loan(
            loan_id=loan.id,
            db=self.db,
            current_user=self.db.get(User, 1),
        )

        self.assertEqual(response.extension_count, 1)
        self.assertEqual(response.due_date, loan.due_date)

    def test_extension_migration_is_idempotent_for_existing_database(self):
        migration_engine = create_engine("sqlite://")
        original_engine = migrate_auth_loan.engine
        try:
            with migration_engine.begin() as connection:
                connection.execute(
                    text("CREATE TABLE loans (id INTEGER PRIMARY KEY)")
                )
            migrate_auth_loan.engine = migration_engine

            migrate_auth_loan._ensure_column(
                "loans", "extension_count", "INT NOT NULL DEFAULT 0"
            )
            migrate_auth_loan._ensure_column(
                "loans", "extension_count", "INT NOT NULL DEFAULT 0"
            )

            columns = inspect(migration_engine).get_columns("loans")
            self.assertEqual(
                sum(column["name"] == "extension_count" for column in columns), 1
            )
        finally:
            migrate_auth_loan.engine = original_engine
            migration_engine.dispose()

    def test_book_search_matches_vietnamese_without_diacritics(self):
        self.db.add(
            Book(
                id=2,
                title="Nguyễn Du",
                author="Tác giả Việt Nam",
                category_id=1,
                total_copies=1,
                available_copies=1,
            )
        )
        self.db.commit()

        result = crud.get_books_paginated(self.db, page=1, size=10, keyword="nguyen")
        self.assertEqual(result.totalElements, 1)
        self.assertEqual(result.content[0].title, "Nguyễn Du")

    def test_cancel_and_reject_pending_requests_do_not_change_stock(self):
        cancelled = LoanService.create_request(self.db, user_id=1, book_id=1, days=7)
        LoanService.cancel_request(self.db, cancelled.id, user_id=1)
        self.assertEqual(self.db.get(Book, 1).available_copies, 1)

        pending = LoanService.create_request(self.db, user_id=1, book_id=1, days=7)
        rejected = LoanService.reject(self.db, pending.id, librarian_id=2)
        self.assertEqual(rejected.status, "REJECTED")
        self.assertEqual(self.db.get(Book, 1).available_copies, 1)

    def test_return_increases_stock_and_charges_one_fine(self):
        loan = LoanService.create_request(self.db, user_id=1, book_id=1, days=7)
        loan = LoanService.approve(self.db, loan.id, librarian_id=2)
        loan.due_date = date.today() - timedelta(days=3)
        self.db.commit()

        returned = LoanService.return_book(self.db, loan.id, librarian_id=2)
        fine = self.db.query(Fine).filter(Fine.loan_id == loan.id).one()
        self.assertEqual(returned.status, "RETURNED")
        self.assertEqual(fine.amount, 15000)
        self.assertEqual(self.db.get(Book, 1).available_copies, 1)
        self.assertGreaterEqual(
            self.db.query(AuditLog).filter(AuditLog.actor_id == 2).count(), 2
        )

        with self.assertRaises(HTTPException) as duplicate_return:
            LoanService.return_book(self.db, loan.id, librarian_id=2)
        self.assertEqual(duplicate_return.exception.status_code, 409)
        self.assertEqual(self.db.query(Fine).filter(Fine.loan_id == loan.id).count(), 1)

    def test_return_promotes_waiting_reservation_and_only_holder_can_borrow(self):
        self.db.add(
            User(
                id=3,
                username="reader-2",
                email="reader2@library.org",
                password_hash=auth_service.hash_password("secret1"),
                role="READER",
            )
        )
        self.db.commit()

        loan = LoanService.create_request(self.db, user_id=1, book_id=1, days=7)
        loan = LoanService.approve(self.db, loan.id, librarian_id=2)
        reservation = ReservationService.create(self.db, user_id=3, book_id=1)
        self.assertEqual(reservation.status, "WAITING")

        LoanService.return_book(self.db, loan.id, librarian_id=2)
        self.db.refresh(reservation)
        self.assertEqual(reservation.status, "HOLDING")
        self.assertEqual(self.db.get(Book, 1).available_copies, 1)

        with self.assertRaises(HTTPException) as unavailable:
            LoanService.create_request(self.db, user_id=1, book_id=1, days=7)
        self.assertEqual(unavailable.exception.status_code, 409)

        held_loan = LoanService.create_request(self.db, user_id=3, book_id=1, days=7)
        LoanService.approve(self.db, held_loan.id, librarian_id=2)
        self.db.refresh(reservation)
        self.assertEqual(reservation.status, "FULFILLED")
        self.assertEqual(self.db.get(Book, 1).available_copies, 0)


if __name__ == "__main__":
    unittest.main()
