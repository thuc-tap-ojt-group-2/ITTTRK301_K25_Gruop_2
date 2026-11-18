from app.database import SessionLocal
from app.models import Book, Category


CATEGORY_NAMES = [
    "Giáo dục",
    "Kinh tế",
    "Tiểu thuyết",
    "Thiên văn",
    "Khám phá",
]

SAMPLE_BOOKS = [
    ("Nền tảng Giáo dục học", "Nguyễn An Bình", "Giáo dục"),
    ("Phương pháp học tập chủ động", "Lê Minh Châu", "Giáo dục"),
    ("Kinh tế học qua tình huống đời thường", "Trần Quang Huy", "Kinh tế"),
    ("Quản lý tài chính cá nhân căn bản", "Phạm Thảo Linh", "Kinh tế"),
    ("Mùa hạ bên hiên nhà", "Nguyễn Gia Hân", "Tiểu thuyết"),
    ("Chuyến tàu qua miền sương", "Lê Hoàng Nam", "Tiểu thuyết"),
    ("Bầu trời đêm cho người mới bắt đầu", "Vũ Hải Đăng", "Thiên văn"),
    ("Hệ Mặt Trời và những hành tinh", "Đỗ Ngọc Mai", "Thiên văn"),
    ("Khám phá đại dương sâu", "Trần Phương Anh", "Khám phá"),
    ("Hành trình qua rừng nhiệt đới", "Nguyễn Minh Khoa", "Khám phá"),
]


def seed_catalog():
    db = SessionLocal()
    added_categories = 0
    added_books = 0

    try:
        categories = {}
        for name in CATEGORY_NAMES:
            category = db.query(Category).filter(Category.name == name).first()
            if category is None:
                category = Category(name=name)
                db.add(category)
                db.flush()
                added_categories += 1
            categories[name] = category

        for title, author, category_name in SAMPLE_BOOKS:
            exists = db.query(Book.id).filter(Book.title == title).first()
            if exists:
                continue

            db.add(
                Book(
                    title=title,
                    author=author,
                    category_id=categories[category_name].id,
                    total_copies=2,
                    available_copies=2,
                )
            )
            added_books += 1

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print(
        f"Đã thêm {added_categories} thể loại và {added_books} sách mẫu "
        "(mỗi sách 2 bản). Chạy lại script không tạo bản ghi trùng."
    )


if __name__ == "__main__":
    seed_catalog()
