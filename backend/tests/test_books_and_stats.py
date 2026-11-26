import unittest
from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app import auth_service, crud, schemas
from app.database import Base
from app.loan_service import LoanService
from app.models import Book, Category, User


class BooksAndStatsTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")

        @event.listens_for(self.engine, "connect")
        def _register_mysql_functions(dbapi_connection, _connection_record):
            dbapi_connection.create_function(
                "date_format", 2, lambda d, _fmt: str(d)[:7] if d else None
            )
            
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
                isbn="9786040000001",
                category_id=1,
                total_copies=2,
                available_copies=2,
            )
        )
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_categories_and_books_crud(self):
        cat = crud.create_category(
            self.db, schemas.CategoryCreateRequest(name="Toán ứng dụng"), actor_id=2
        )
        self.assertEqual(cat.name, "Toán ứng dụng")

        updated_cat = crud.update_category(
            self.db, cat.id, schemas.CategoryUpdateRequest(name="Toán rời rạc"), actor_id=2
        )
        self.assertEqual(updated_cat.name, "Toán rời rạc")

        created_book = crud.create_book(
            self.db,
            schemas.BookCreateRequest(
                title="Cấu trúc dữ liệu và Giải thuật",
                author="Tác giả A",
                categoryId=cat.id,
                total=5,
            ),
            actor_id=2,
        )
        self.assertEqual(created_book.totalCopies, 5)
        self.assertEqual(created_book.availableCopies, 5)

        # Chặn xóa thể loại đang có sách liên kết
        with self.assertRaises(HTTPException) as cat_err:
            crud.delete_category(self.db, cat.id, actor_id=2)
        self.assertEqual(cat_err.exception.status_code, 409)

        # Cập nhật thông tin & số bản sách
        updated_book = crud.update_book(
            self.db,
            created_book.id,
            schemas.BookUpdateRequest(title="CTDL & Giải thuật (Tái bản)", total=3),
            actor_id=2,
        )
        self.assertEqual(updated_book.totalCopies, 3)
        self.assertEqual(updated_book.availableCopies, 3)

        # Xóa sách và xóa thể loại rỗng
        res = crud.delete_book(self.db, created_book.id, actor_id=2)
        self.assertIn("thành công", res["message"])
        crud.delete_category(self.db, cat.id, actor_id=2)

    def test_book_search_can_be_scoped_by_title_author_and_isbn(self):
        title_results = crud.get_books_paginated(
            self.db, keyword="Python", search_by="title"
        )
        self.assertEqual(title_results.totalElements, 1)

        title_only_results = crud.get_books_paginated(
            self.db, keyword="Python", search_by="author"
        )
        self.assertEqual(title_only_results.totalElements, 0)

        author_results = crud.get_books_paginated(
            self.db, keyword="nguyen hoang", search_by="author"
        )
        self.assertEqual(author_results.totalElements, 1)

        isbn_results = crud.get_books_paginated(
            self.db, keyword="9786040000001", search_by="isbn"
        )
        self.assertEqual(isbn_results.totalElements, 1)
        self.assertEqual(isbn_results.content[0].isbn, "9786040000001")

    def test_statistics_overview_top_books_and_monthly(self):
        loan = LoanService.create_request(self.db, user_id=1, book_id=1, days=7)
        loan = LoanService.approve(self.db, loan.id, librarian_id=2)
        loan.due_date = date.today() - timedelta(days=2)
        self.db.commit()
        LoanService.return_book(self.db, loan.id, librarian_id=2)

        overview = crud.get_stats_overview(self.db)
        self.assertEqual(overview.totalBooks, 2)
        self.assertEqual(overview.totalFines, 10000.0)

        top_books = crud.get_top_borrowed_books(self.db, limit=5)
        self.assertEqual(len(top_books), 1)
        self.assertEqual(top_books[0].bookId, 1)
        self.assertEqual(top_books[0].borrowCount, 1)

        monthly = crud.get_monthly_loan_stats(self.db, months=6)
        self.assertEqual(len(monthly), 6)
        self.assertEqual(sum(item.loanCount for item in monthly), 1)

    def test_latent_bugs_delete_returned_book_duplicate_category_filters_and_hash(self):
        # Đảm bảo verify_password trả về False thay vì lỗi ValueError khi hash hỏng
        self.assertFalse(auth_service.verify_password("123456", "not-a-bcrypt-hash"))

        # Chặn cập nhật thể loại trùng tên (400 thay vì IntegrityError 500)
        cat_extra = crud.create_category(
            self.db, schemas.CategoryCreateRequest(name="Kinh tế"), actor_id=2
        )
        with self.assertRaises(HTTPException) as dup_cat:
            crud.update_category(
                self.db,
                cat_extra.id,
                schemas.CategoryUpdateRequest(name="Công nghệ thông tin"),
                actor_id=2,
            )
        self.assertEqual(dup_cat.exception.status_code, 400)

        # Tạo và cập nhật/xóa coverUrl rõ ràng, trả về categoryId
        created = crud.create_book(
            self.db,
            schemas.BookCreateRequest(
                title="Cơ sở dữ liệu",
                author="Trần Văn B",
                categoryId=cat_extra.id,
                total=1,
                coverUrl="https://example.com/cover.jpg",
                isbn="9786049999999",
            ),
            actor_id=2,
        )
        self.assertEqual(created.categoryId, cat_extra.id)
        self.assertEqual(created.coverUrl, "https://example.com/cover.jpg")

        cleared = crud.update_book(
            self.db,
            created.id,
            schemas.BookUpdateRequest(coverUrl=None),
            actor_id=2,
        )
        self.assertIsNone(cleared.coverUrl)
        self.assertIsNone(cleared.imageUrl)

        # Lọc theo category_id, availability và tìm kiếm theo ISBN khi search_by=None
        by_isbn = crud.get_books_paginated(self.db, keyword="9786049999999")
        self.assertEqual(by_isbn.totalElements, 1)
        by_cat = crud.get_books_paginated(self.db, category_id=cat_extra.id)
        self.assertEqual(by_cat.totalElements, 1)

        loan = LoanService.create_request(self.db, user_id=1, book_id=created.id, days=7)
        loan = LoanService.approve(self.db, loan.id, librarian_id=2)
        empty_filter = crud.get_books_paginated(self.db, availability="empty")
        self.assertEqual([b.id for b in empty_filter.content], [created.id])
        LoanService.return_book(self.db, loan.id, librarian_id=2)

        # Chặn xóa sách đã có lịch sử mượn trả (409 thay vì IntegrityError 500)
        with self.assertRaises(HTTPException) as del_err:
            crud.delete_book(self.db, created.id, actor_id=2)
        self.assertEqual(del_err.exception.status_code, 409)


if __name__ == "__main__":
    unittest.main()