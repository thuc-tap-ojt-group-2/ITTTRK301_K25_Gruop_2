import argparse
import csv
import shutil
import sys
import subprocess
from datetime import datetime
from pathlib import Path

from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "backend"
TOOLS_ROOT = PROJECT_ROOT / "tools" / "cover-fix"
REPORT_DIR = TOOLS_ROOT / "reports"
BACKUP_DIR = TOOLS_ROOT / "backup"
sys.path.insert(0, str(BACKEND_ROOT))

from app.database import engine, DB_HOST, DB_PASSWORD, DB_PORT, DB_USER, DB_NAME


def load_high_confidence():
    candidates = REPORT_DIR / "candidates.csv"
    if not candidates.exists():
        return []
    with candidates.open("r", newline="", encoding="utf-8-sig") as report:
        return [
            row for row in csv.DictReader(report)
            if row.get("confidence", "").strip().lower() == "cao"
        ]


def create_backup(rows):
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    timestamped_db = None
    source_db = PROJECT_ROOT / "library_dev.db"

    mysql_dump = None
    with engine.connect() as connection:
        dialect = connection.dialect.name
    if dialect == "sqlite" and source_db.exists():
        timestamped_db = BACKUP_DIR / ("library_dev-" + stamp + ".db")
        shutil.copy2(source_db, timestamped_db)
    elif dialect == "mysql":
        mysql_dump = BACKUP_DIR / ("library-ptit-" + stamp + ".sql")
        env = dict(__import__("os").environ)
        command = ["mysqldump", "-h", str(DB_HOST),
                   "-P", str(DB_PORT),
                   "-u", str(DB_USER),
                   "-p" + str(DB_PASSWORD),
                   str(DB_NAME)]
        try:
            with mysql_dump.open("wb") as dump:
                completed = subprocess.run(command, stdout=dump, stderr=subprocess.PIPE, env=env)
            if completed.returncode != 0:
                mysql_dump.unlink(missing_ok=True)
                raise RuntimeError(completed.stderr.decode("utf-8", "replace"))
        except FileNotFoundError:
            mysql_dump = None
            raise RuntimeError("mysqldump khong co san; khong the tao ban sao luu MySQL")
    else:
        raise RuntimeError("Loai database khong duoc ho tro cho backup")

    if dialect == "sqlite" and not timestamped_db:
        raise RuntimeError("Sao luu SQLite that bai")
    if dialect == "mysql" and not mysql_dump:
        raise RuntimeError("Sao luu MySQL that bai")

    backup_csv = BACKUP_DIR / ("cover-before-" + stamp + ".csv")
    with backup_csv.open("w", newline="", encoding="utf-8-sig") as report:
        writer = csv.DictWriter(report, fieldnames=["id", "link_old"])
        writer.writeheader()
        writer.writerows([
            {"id": row["id"], "link_old": row["link_old"]}
            for row in rows
        ])
    return timestamped_db or mysql_dump, backup_csv


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--consent", default="")
    args = parser.parse_args()

    rows = load_high_confidence()
    print("HIGH_CONFIDENCE_ROWS=" + str(len(rows)))

    if not args.apply:
        print("MODE=DRY-RUN")
        for row in rows:
            print(row["id"] + "\t" + row["link_new"])
        print("NO_DATABASE_CHANGE")
        return

    if args.consent != "đồng ý áp dụng":
        print("REFUSED: can exact --consent \"dong y ap dung\"")
        print("NO_DATABASE_CHANGE")
        return

    if not rows:
        print("REFUSED: khong co candidates tin cay cao")
        print("NO_DATABASE_CHANGE")
        return

    try:
        database_backup, csv_backup = create_backup(rows)
    except Exception as exc:
        print("BACKUP_FAILED=" + str(exc))
        print("NO_DATABASE_CHANGE")
        return

    applied = []
    try:
        with engine.begin() as connection:
            for row in rows:
                result = connection.execute(
                    text("UPDATE books SET image_url = :new_url WHERE id = :book_id"),
                    {"new_url": row["link_new"], "book_id": int(row["id"])},
                )
                if result.rowcount != 1:
                    raise RuntimeError("Book id " + row["id"] + " changed " + str(result.rowcount) + " rows")
                applied.append(row)
    except Exception as exc:
        print("TRANSACTION_FAILED=" + str(exc))
        print("DATABASE_ROLLBACK_COMPLETE")
        return

    applied_path = REPORT_DIR / "applied.csv"
    with applied_path.open("w", newline="", encoding="utf-8-sig") as report:
        writer = csv.DictWriter(report, fieldnames=[
            "id", "title", "author", "link_old", "link_new", "source", "confidence", "size_image"
        ])
        writer.writeheader()
        writer.writerows(applied)

    print("DATABASE_BACKUP=" + str(database_backup))
    print("CSV_BACKUP=" + str(csv_backup))
    print("APPLIED=" + str(len(applied)))
    print("APPLIED_REPORT=" + str(applied_path))


if __name__ == "__main__":
    main()
