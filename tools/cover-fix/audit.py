import csv
import concurrent.futures
import os
import sys
import time
import urllib.parse
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "backend"
REPORT_DIR = PROJECT_ROOT / "tools" / "cover-fix" / "reports"
sys.path.insert(0, str(BACKEND_ROOT))

os.chdir(BACKEND_ROOT)
from app.database import engine


def classify_link(link):
    if not link:
        return "trống"
    value = str(link).strip()
    parsed = urllib.parse.urlparse(value)
    if parsed.scheme in ("http", "https") and parsed.netloc:
        domain = parsed.netloc.lower()
        suffix = Path(parsed.path).suffix.lower()
        html_hint = not suffix or suffix in (".html", ".htm", ".php", ".asp", ".jsp")
        if html_hint:
            return "liên kết dạng trang web"
        if parsed.scheme == "http":
            return "http"
        return "ảnh HTTPS"
    if value.startswith("//"):
        return "giao thức tương đối"
    if parsed.scheme == "" and "/" not in value:
        return "đường dẫn tương đối"
    if parsed.scheme == "":
        return "đường dẫn tương đối"
    return "định dạng không rõ"


def image_dimensions(payload):
    if len(payload) >= 24 and payload[:8] == b"\x89PNG\r\n\x1a\n":
        return int.from_bytes(payload[16:20], "big"), int.from_bytes(payload[20:24], "big")
    if payload[:2] == b"\xff\xd8":
        pos = 2
        height = width = None
        while pos + 9 < len(payload):
            if payload[pos] != 0xFF:
                pos += 1
                continue
            marker = payload[pos + 1]
            pos += 2
            if marker == 0xD8:
                continue
            if marker in (0xD9, 0xDA):
                break
            if pos + 2 > len(payload):
                break
            length = int.from_bytes(payload[pos:pos + 2], "big")
            if marker in range(0xC0, 0xC4) and pos + 7 <= len(payload):
                height = int.from_bytes(payload[pos + 3:pos + 5], "big")
                width = int.from_bytes(payload[pos + 5:pos + 7], "big")
                break
            pos += length
        return width, height
    if payload[:6] in (b"GIF87a", b"GIF89a") and len(payload) >= 10:
        return int.from_bytes(payload[6:8], "little"), int.from_bytes(payload[8:10], "little")
    return None, None


def check_link(row):
    book_id, title, author, link = row
    result = {
        "id": book_id,
        "title": title,
        "author": author,
        "link": link or "",
        "domain": "",
        "link_kind": classify_link(link),
        "mixed_content": "",
        "status": "",
        "reason": "",
        "bytes": "",
        "content_type": "",
        "final_url": "",
        "width": "",
        "height": "",
    }
    if not link:
        result["status"] = "EMPTY"
        result["reason"] = "khong co link"
        return result

    value = str(link).strip()
    parsed = urllib.parse.urlparse(value)
    result["domain"] = parsed.netloc.lower()
    result["mixed_content"] = "yes" if parsed.scheme == "http" else "no"
    if parsed.scheme not in ("http", "https"):
        result["status"] = "INVALID"
        result["reason"] = "khong phai URL HTTP/HTTPS"
        return result

    for referer_enabled in (False, True):
        try:
            headers = {"User-Agent": "PTIT-Library-Cover-Audit/1.0"}
            if referer_enabled:
                headers["Referer"] = "http://localhost:5500/"
            request = urllib.request.Request(value, headers=headers, method="GET")
            with urllib.request.urlopen(request, timeout=8) as response:
                status = response.status
                content_type = response.headers.get("Content-Type", "").split(";")[0].strip().lower()
                final_url = response.geturl()
                payload = response.read(2 * 1024 * 1024 + 1)
                size = len(payload)
                width, height = image_dimensions(payload)
                result.update({
                    "status": str(status),
                    "bytes": str(size),
                    "content_type": content_type,
                    "final_url": final_url,
                    "width": str(width or ""),
                    "height": str(height or ""),
                })
                if status != 200:
                    result["reason"] = "HTTP " + str(status)
                elif not content_type.startswith("image/"):
                    result["reason"] = "noidung khong phai anh"
                elif size > 2 * 1024 * 1024:
                    result["reason"] = "anh vuot 2MB"
                elif width and width < 100:
                    result["reason"] = "anh qua nho duoi 100px"
                elif final_url.startswith("http://"):
                    result["reason"] = "mixed-content / chuyen huong ve HTTP"
                else:
                    result["reason"] = "good"
                    result["status"] = "GOOD"
                return result
        except urllib.error.HTTPError as exc:
            status = exc.code
            if status in (403, 404) and not referer_enabled:
                continue
            result["status"] = str(status)
            result["reason"] = "403 bi chan nhung/hotlink" if status == 403 else "404 khong tim thay"
            return result
        except urllib.error.URLError as exc:
            reason = str(exc.reason)
            result["status"] = "ERROR"
            result["reason"] = "DNS/ket noi: " + reason
        except TimeoutError:
            result["status"] = "TIMEOUT"
            result["reason"] = "het thoi gian"
        except Exception as exc:
            result["status"] = "ERROR"
            result["reason"] = "loi yeu cau: " + str(exc)
    return result


def main():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    with engine.connect() as connection:
        dialect = connection.dialect.name
        connection.execute(text("SELECT 1"))
        rows = connection.execute(
            text("SELECT id, title, author, image_url FROM books")
        ).mappings().all()

    records = [(row["id"], row["title"], row["author"], row["image_url"]) for row in rows]
    report_path = REPORT_DIR / "audit.csv"

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(check_link, records))
        time.sleep(0.05)

    with report_path.open("w", newline="", encoding="utf-8-sig") as report:
        writer = csv.DictWriter(report, fieldnames=[
            "id", "title", "author", "link", "domain", "link_kind", "mixed_content", "status", "reason",
            "bytes", "content_type", "final_url", "width", "height",
        ])
        writer.writeheader()
        writer.writerows(results)

    links = [str(row[3]).strip() for row in records if row[3] and str(row[3]).strip()]
    distinct_links = len(set(links))
    good = sum(1 for item in results if item["status"] == "GOOD")
    broken = len(results) - sum(1 for item in results if item["status"] in ("GOOD",))
    empty = sum(1 for item in results if item["status"] == "EMPTY")
    reasons = {}
    for item in results:
        if item["status"] != "GOOD":
            reasons[item["reason"]] = reasons.get(item["reason"], 0) + 1

    link_types = {}
    for link in links:
        link_type = classify_link(link)
        link_types[link_type] = link_types.get(link_type, 0) + 1

    print("DATABASE_DIALECT=" + dialect)
    print("TABLE=books")
    print("IMAGE_COLUMN=image_url")
    print("REPORT=" + str(report_path))
    print("TOTAL_BOOKS=" + str(len(records)))
    print("HAS_LINK=" + str(len(links)))
    print("EMPTY_LINK=" + str(empty))
    print("DISTINCT_LINK=" + str(distinct_links))
    print("GOOD=" + str(good))
    print("BROKEN=" + str(broken))
    print("LINK_TYPES=" + repr(link_types).encode("ascii", "backslashreplace").decode("ascii"))
    print("REASONS=" + repr(reasons).encode("ascii", "backslashreplace").decode("ascii"))


if __name__ == "__main__":
    main()
