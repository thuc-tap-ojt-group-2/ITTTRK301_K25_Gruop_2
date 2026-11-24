from app.database import SessionLocal
from app.models import Book, Category


CATEGORY_NAMES = [
    "Giáo dục",
    "Kinh tế",
    "Tiểu thuyết",
    "Thiên văn",
    "Khám phá",
    "Công nghệ thông tin",
    "Ngoại ngữ",
    "Khoa học",
    "Xã hội",
    "Kỹ năng",
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
    ("Cấu trúc dữ liệu và Giải thuật", "Nguyễn Đức Nghĩa", "Công nghệ thông tin", "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=600&fit=crop"),
    ("Lập trình Web hiện đại", "Phạm Văn Hạnh", "Công nghệ thông tin", "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=600&fit=crop"),
    ("Hệ quản trị cơ sở dữ liệu", "Lê Hà Thanh Sang", "Công nghệ thông tin", "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=600&fit=crop"),
    ("Mạng máy tính căn bản", "Trần Minh Tuấn", "Công nghệ thông tin", "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=600&fit=crop"),
    ("An toàn thông tin ứng dụng", "Nguyễn Quang Huy", "Công nghệ thông tin", "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=600&fit=crop"),
    ("Trí tuệ nhân tạo cho người mới bắt đầu", "Đỗ Nhật Minh", "Công nghệ thông tin", "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=600&fit=crop"),
    ("Kỹ thuật phần mềm thực hành", "Vũ Minh Phương", "Công nghệ thông tin", "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=600&fit=crop"),
    ("Python nâng cao", "Ngô Thanh Sơn", "Công nghệ thông tin", "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=600&fit=crop"),
    ("Java từ cơ bản đến dự án", "Hoàng Quốc Anh", "Công nghệ thông tin", "https://images.unsplash.com/photo-1516101922849-9109e3b0f58f?w=400&h=600&fit=crop"),
    ("Tiếng Anh giao tiếp cho sinh viên", "Sarah Nguyễn", "Ngoại ngữ", "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=600&fit=crop"),
    ("Từ vựng tiếng Anh chuyên ngành CNTT", "Michael Phạm", "Ngoại ngữ", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=600&fit=crop"),
    ("Luyện nghe tiếng Anh qua hội thoại", "David Trần", "Ngoại ngữ", "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=600&fit=crop"),
    ("Tiếng Nhật sơ cấp", "Haruka Yamamoto", "Ngoại ngữ", "https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=600&fit=crop"),
    ("Vật lý đại cương", "Lê Văn Khoa", "Khoa học", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=600&fit=crop"),
    ("Hóa học cơ sở", "Nguyễn Thu Hà", "Khoa học", "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=600&fit=crop"),
    ("Sinh học phân tử", "Phạm Đức Long", "Khoa học", "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=400&h=600&fit=crop"),
    ("Đại số tuyến tính ứng dụng", "Trần Văn Bình", "Khoa học", "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400&h=600&fit=crop"),
    ("Xác suất và Thống kê", "Nguyễn Minh Châu", "Khoa học", "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=600&fit=crop"),
    ("Lãnh đạo và Quản trị", "Phạm Ngọc Tùng", "Kinh tế", "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=600&fit=crop"),
    ("Khởi nghiệp sáng tạo", "Lê Thu Trang", "Kinh tế", "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=600&fit=crop"),
    ("Kỹ năng thuyết trình", "Nguyễn Gia Hưng", "Kỹ năng", "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=600&fit=crop"),
    ("Quản lý thời gian hiệu quả", "Trần Hồng Nhung", "Kỹ năng", "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=600&fit=crop"),
    ("Tư duy phản biện", "Vũ Thảo My", "Kỹ năng", "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&h=600&fit=crop"),
    ("Kinh tế Việt Nam trong hội nhập", "Đặng Quốc Bảo", "Xã hội", "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=600&fit=crop"),
    ("Chính trị học đại cương", "Lê Mai Anh", "Xã hội", "https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=400&h=600&fit=crop"),
    ("Tâm lý học đám đông", "Nguyễn Hữu Đức", "Xã hội", "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=600&fit=crop"),
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
        f"Added {added_categories} categories and {added_books} sample books "
        "(2 copies each). Re-running does not create duplicate titles."
    )


if __name__ == "__main__":
    seed_catalog()
