import argparse
import csv
import sys
from pathlib import Path

from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "backend"
TOOLS_ROOT = PROJECT_ROOT / "tools" / "cover-fix"
sys.path.insert(0, str(BACKEND_ROOT))

from app.database import engine


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("backup_csv", type=Path)
    args = parser.parse_args()

    if not args.backup_csv.is_file():
        raise SystemExit("Backup CSV not found")

    with args.backup_csv.open("r", newline="", encoding="utf-8-sig") as report:
        rows = list(csv.DictReader(report))

    if not rows:
        print("ROLLBACK_ROWS=0")
        return

    with engine.begin() as connection:
        for row in rows:
            connection.execute(
                text("UPDATE books SET image_url = :old_url WHERE id = :book_id"),
                {"old_url": row["link_old"], "book_id": int(row["id"])},
            )

    print("ROLLBACK_ROWS=" + str(len(rows)))


if __name__ == "__main__":
    main()
