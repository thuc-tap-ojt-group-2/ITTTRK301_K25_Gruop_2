import csv
import concurrent.futures
import sys
import urllib.request
from pathlib import Path

from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "backend"
REPORT_DIR = PROJECT_ROOT / "tools" / "cover-fix" / "reports"
sys.path.insert(0, str(BACKEND_ROOT))

from app.database import engine


def check(row):
    book_id, title, link = row
    if not link:
        return {
            "id": book_id,
            "title": title,
            "link": "",
            "status": "EMPTY",
            "content_type": "",
            "reason": "khong co link",
        }
    request = urllib.request.Request(
        str(link),
        headers={"User-Agent": "PTIT-Library-Link-Check/1.0"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            content_type = response.headers.get("Content-Type", "").split(";")[0].strip()
            payload = response.read(512 * 1024)
            if response.status == 200 and content_type.startswith("image/"):
                status = "GOOD"
                reason = "dang hoat dong"
            elif not content_type.startswith("image/"):
                status = "BROKEN"
                reason = "khong phai anh"
            else:
                status = "BROKEN"
                reason = "HTTP " + str(response.status)
            return {
                "id": book_id,
                "title": title,
                "link": link,
                "status": status,
                "content_type": content_type,
                "reason": reason,
            }
    except Exception as exc:
        return {
            "id": book_id,
            "title": title,
            "link": link,
            "status": "BROKEN",
            "content_type": "",
            "reason": str(exc),
        }


def main():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    with engine.connect() as connection:
        rows = connection.execute(
            text("SELECT id, title, image_url FROM books")
        ).mappings().all()

    records = [(row["id"], row["title"], row["image_url"]) for row in rows]
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(check, records))

    report_path = REPORT_DIR / "link-check.csv"
    with report_path.open("w", newline="", encoding="utf-8-sig") as report:
        writer = csv.DictWriter(
            report,
            fieldnames=["id", "title", "link", "status", "content_type", "reason"],
        )
        writer.writeheader()
        writer.writerows(results)

    good = sum(1 for row in results if row["status"] == "GOOD")
    print("TOTAL=" + str(len(results)))
    print("GOOD=" + str(good))
    print("BROKEN_OR_EMPTY=" + str(len(results) - good))
    print("REPORT=" + str(report_path))


if __name__ == "__main__":
    main()
