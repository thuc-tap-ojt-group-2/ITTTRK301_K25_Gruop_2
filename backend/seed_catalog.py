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
    ("Nền tảng Giáo dục học", "Nguyễn An Bình", "Giáo dục", "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop"),
    ("Phương pháp học tập chủ động", "Lê Minh Châu", "Giáo dục", "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=600&fit=crop"),
    ("Kinh tế học qua tình huống đời thường", "Trần Quang Huy", "Kinh tế", "https://images.unsplash.com/photo-1559539707-721290587a0e?w=400&h=600&fit=crop"),
    ("Quản lý tài chính cá nhân căn bản", "Phạm Thảo Linh", "Kinh tế", "https://images.unsplash.com/photo-1557339572-1d76094753bd?w=400&h=600&fit=crop"),
    ("Mùa hạ bên hiên nhà", "Nguyễn Gia Hân", "Tiểu thuyết", "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop"),
    ("Chuyến tàu qua miền sương", "Lê Hoàng Nam", "Tiểu thuyết", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop"),
    ("Bầu trời đêm cho người mới bắt đầu", "Vũ Hải Đăng", "Thiên văn", "https://images.unsplash.com/photo-1534578678718-a14456294e09?w=400&h=600&fit=crop"),
    ("Hệ Mặt Trời và những hành tinh", "Đỗ Ngọc Mai", "Thiên văn", "https://images.unsplash.com/photo-1462331848778-442579fb8e70?w=400&h=600&fit=crop"),
    ("Khám phá đại dương sâu", "Trần Phương Anh", "Khám phá", "https://images.unsplash.com/photo-1544620348-c7fd4533399f?w=400&h=600&fit=crop"),
    ("Hành trình qua rừng nhiệt đới", "Nguyễn Minh Khoa", "Khám phá", "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop"),
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

        for book_data in SAMPLE_BOOKS:
            title, author, category_name, image_url = book_data
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
                    image_url=image_url,
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
