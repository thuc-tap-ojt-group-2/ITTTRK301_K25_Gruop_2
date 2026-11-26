import unittest
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import auth_service, crud
from app.database import Base
from app.loan_service import LoanService
from app.models import Book, Category, User
from app.reservation_service import ReservationService
from app.services import FineService


class FinesAndReservationsTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        self.db.add(Category(id=1, name="Công nghệ thông tin"))
        self.db.add(
            User(
                id=1,
                username="reader_1",
                email="reader1@ptit.edu.vn",
                password_hash=auth_service.hash_password("123456"),
                full_name="Độc Giả Một",
                role="READER",
            )
        )
        self.db.add(
            User(
                id=2,
                username="reader_2",
                email="reader2@ptit.edu.vn",
                password_hash=auth_service.hash_password("123456"),
                full_name="Độc Giả Hai",
                role="READER",
            )
        )
        self.db.add(
            User(
                id=3,
                username="librarian_1",
                email="lib1@ptit.edu.vn",
                password_hash=auth_service.hash_password("123456"),
                full_name="Thủ Thư Một",
                role="LIBRARIAN",
            )
        )
        self.db.add(
            Book(
                id=1,
                title="Lập trình Python nâng cao",
                author="Nguyễn Hoàng Thành",
                category_id=1,
                total_copies=2,
                available_copies=2,
            )
        )
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_fine_calculation_and_payment_flow(self):
        # Các mốc tính phạt đơn vị (FINE-01)
        self.assertEqual(FineService.calculate_fine(date(2026, 11, 1), date(2026, 11, 1)), 0)
        self.assertEqual(FineService.calculate_fine(date(2026, 11, 10), date(2026, 11, 5)), 0)
        self.assertEqual(FineService.calculate_fine(date(2026, 11, 1), date(2026, 11, 2)), 5000)
        self.assertEqual(FineService.calculate_fine(date(2026, 11, 1), date(2026, 11, 4)), 15000)
        self.assertEqual(FineService.calculate_fine(None, date(2026, 11, 4)), 0)

        # Trả sách trễ 4 ngày -> chốt khoản phạt 20.000đ và thu phạt
        loan = LoanService.create_request(self.db, user_id=1, book_id=1, days=7)
        loan = LoanService.approve(self.db, loan.id, librarian_id=3)
        loan.due_date = date.today() - timedelta(days=4)
        self.db.commit()

        calc = crud.calculate_fine(self.db, loan.id)
        self.assertEqual(calc.overdueDays, 4)
        self.assertEqual(calc.totalFine, 20000.0)
        self.assertEqual(calc.status, "OVERDUE")

        LoanService.return_book(self.db, loan.id, librarian_id=3)

        my_fines = crud.get_user_fines(self.db, user_id=1)
        self.assertEqual(my_fines.totalUnpaid, 20000.0)
        self.assertEqual(len(my_fines.fines), 1)

        fine_id = my_fines.fines[0].id
        paid_res = crud.mark_fine_as_paid(self.db, fine_id, actor_id=3)
        self.assertEqual(paid_res["fineId"], fine_id)

        # Chặn thu trùng lần 2 (409)
        with self.assertRaises(HTTPException) as dup_pay:
            crud.mark_fine_as_paid(self.db, fine_id, actor_id=3)
        self.assertEqual(dup_pay.exception.status_code, 409)

        self.assertEqual(crud.get_user_fines(self.db, user_id=1).totalUnpaid, 0.0)

    def test_reservations_and_48h_hold_expiration(self):
        # Sách còn bản -> chặn đặt trước (409)
        with self.assertRaises(HTTPException) as still_avail:
            ReservationService.create(self.db, user_id=1, book_id=1)
        self.assertEqual(still_avail.exception.status_code, 409)

        # Cho mượn hết 2 bản sách ID 1
        l1 = LoanService.approve(
            self.db, LoanService.create_request(self.db, 1, 1, 7).id, librarian_id=3
        )
        LoanService.approve(
            self.db, LoanService.create_request(self.db, 2, 1, 7).id, librarian_id=3
        )
        self.assertEqual(self.db.get(Book, 1).available_copies, 0)

        # Độc giả đang mượn sách đó thì không được đặt trước cùng cuốn (409)
        with self.assertRaises(HTTPException) as active_loan_res:
            ReservationService.create(self.db, user_id=1, book_id=1)
        self.assertEqual(active_loan_res.exception.status_code, 409)

        # Tạo thêm 2 độc giả xếp hàng đặt trước
        self.db.add(User(id=4, username="r3", email="r3@ptit.edu.vn", password_hash="x", role="READER"))
        self.db.add(User(id=5, username="r4", email="r4@ptit.edu.vn", password_hash="x", role="READER"))
        self.db.commit()

        r_first = ReservationService.create(self.db, user_id=4, book_id=1)
        r_second = ReservationService.create(self.db, user_id=5, book_id=1)
        self.assertEqual(r_first.status, "WAITING")
        self.assertEqual(r_second.status, "WAITING")

        # Chặn đặt trùng cuốn sách đang chờ (409)
        with self.assertRaises(HTTPException) as dup_res:
            ReservationService.create(self.db, user_id=4, book_id=1)
        self.assertEqual(dup_res.exception.status_code, 409)

        # Trả 1 cuốn -> người đầu tiên (user 4) được giữ chỗ 48h (HOLDING)
        LoanService.return_book(self.db, l1.id, librarian_id=3)
        self.db.refresh(r_first)
        self.db.refresh(r_second)
        self.assertEqual(r_first.status, "HOLDING")
        self.assertIsNotNone(r_first.hold_expires_at)
        self.assertEqual(r_second.status, "WAITING")

        # Giả lập quá hạn 48h -> r_first thành EXPIRED và tự chuyển giữ chỗ 48h cho r_second
        r_first.hold_expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)
        self.db.commit()

        ReservationService.list_for_reader(self.db, user_id=5)
        self.db.refresh(r_first)
        self.db.refresh(r_second)
        self.assertEqual(r_first.status, "EXPIRED")
        self.assertEqual(r_second.status, "HOLDING")

        # Hủy phiếu đặt trước (RSV-03)
        cancelled = ReservationService.cancel(self.db, r_second.id, user_id=5)
        self.assertEqual(cancelled.status, "CANCELLED")


if __name__ == "__main__":
    unittest.main()