from sqlalchemy import or_

from app import auth_service
from app.database import SessionLocal
from app.models import User


DEMO_PASSWORD = "123456"
DEMO_USERS = (
    ("admin", "admin@ptit.edu.vn", "Quản trị viên", "ADMIN"),
    ("thuthu", "thuthu@ptit.edu.vn", "Thủ thư", "LIBRARIAN"),
    ("B22DCCN101", "docgia@ptit.edu.vn", "Nguyễn Hoàng An", "READER"),
)


def main():
    created = []
    skipped = []

    with SessionLocal.begin() as db:
        for username, email, full_name, role in DEMO_USERS:
            existing = (
                db.query(User)
                .filter(or_(User.username == username, User.email == email))
                .first()
            )
            if existing:
                skipped.append(email)
                continue

            db.add(
                User(
                    username=username,
                    email=email,
                    password_hash=auth_service.hash_password(DEMO_PASSWORD),
                    full_name=full_name,
                    role=role,
                    is_locked=False,
                )
            )
            db.flush()
            created.append(email)

    for email in created:
        print(f"Created demo account: {email}")
    for email in skipped:
        print(f"Skipped existing account (not modified): {email}")
    if not created:
        print("No demo accounts were created.")


if __name__ == "__main__":
    main()
