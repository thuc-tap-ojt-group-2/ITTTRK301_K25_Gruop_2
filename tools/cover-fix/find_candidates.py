import csv
import hashlib
import json
import os
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "backend"
REPORT_DIR = PROJECT_ROOT / "tools" / "cover-fix" / "reports"
CACHE_DIR = PROJECT_ROOT / "tools" / "cover-fix" / "cache"
sys.path.insert(0, str(BACKEND_ROOT))

os.chdir(BACKEND_ROOT)
from app.database import engine


def normalize(value):
    value = unicodedata.normalize("NFD", str(value or ""))
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    value = "".join(ch.lower() if ch.isalnum() else " " for ch in value)
    return " ".join(value.split())


def author_match(candidate_author, target_author):
    if not candidate_author or not target_author:
        return False
    c = normalize(candidate_author)
    t = normalize(target_author)
    if c == t:
        return True
    c_parts = set(c.split())
    t_parts = set(t.split())
    return bool(c_parts & t_parts) and len(c_parts & t_parts) >= 2


def title_match(candidate_title, target_title):
    c = normalize(candidate_title)
    t = normalize(target_title)
    if c == t:
        return True
    if not c or not t:
        return False
    shorter = min(len(c), len(t))
    longer = max(len(c), len(t))
    if shorter / longer < 0.95:
        return False
    return c in t or t in c


def get_json(url, cache_key):
    cache_file = CACHE_DIR / (cache_key + ".json")
    if cache_file.exists():
        return json.loads(cache_file.read_text(encoding="utf-8"))
    request = urllib.request.Request(url, headers={"User-Agent": "PTIT-Library-Cover-Finder/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            payload = json.loads(response.read(4 * 1024 * 1024).decode("utf-8"))
    except urllib.error.HTTPError as exc:
        return {"_api_error": "HTTP " + str(exc.code)}
    except urllib.error.URLError as exc:
        return {"_api_error": "loi mang: " + str(exc.reason)}
    except TimeoutError:
        return {"_api_error": "timeout"}
    cache_file.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    time.sleep(0.20)
    return payload


def image_dimensions(payload):
    if len(payload) >= 24 and payload[:8] == b"\x89PNG\r\n\x1a\n":
        return int.from_bytes(payload[16:20], "big"), int.from_bytes(payload[20:24], "big")
    if payload[:2] == b"\xff\xd8":
        pos = 2
        while pos + 9 < len(payload):
            if payload[pos] != 0xFF:
                pos += 1
                continue
            marker = payload[pos + 1]
            pos += 2
            if marker == 0xD9:
                break
            if pos + 2 > len(payload):
                break
            length = int.from_bytes(payload[pos:pos + 2], "big")
            if marker in range(0xC0, 0xC4) and pos + 7 <= len(payload):
                return (int.from_bytes(payload[pos + 5:pos + 7], "big"),
                        int.from_bytes(payload[pos + 3:pos + 5], "big"))
            pos += length
    if payload[:6] in (b"GIF87a", b"GIF89a") and len(payload) >= 10:
        return int.from_bytes(payload[6:8], "little"), int.from_bytes(payload[8:10], "little")
    return None, None


def validate_image(url):
    if not url or not url.startswith("https://"):
        return None, "khong phai URL HTTPS"
    request = urllib.request.Request(url, headers={"User-Agent": "PTIT-Library-Cover-Finder/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            content_type = response.headers.get("Content-Type", "").split(";")[0].strip().lower()
            payload = response.read(2 * 1024 * 1024 + 1)
            width, height = image_dimensions(payload)
            if response.status != 200:
                return None, "HTTP " + str(response.status)
            if not content_type.startswith("image/"):
                return None, "khong phai image/*"
            if len(payload) > 2 * 1024 * 1024:
                return None, "vuot 2MB"
            if not width or width < 200:
                return None, "chieu rong duoi 200px"
            if len(payload) < 1500:
                return None, "co the la placeholder qua nho"
            return (width, height, len(payload)), "ok"
    except Exception as exc:
        return None, "loi tai anh: " + str(exc)


def openlibrary_candidates(title, author):
    query = urllib.parse.urlencode({"title": title, "author": author, "limit": 10})
    cache_key = "ol_" + hashlib.sha1(normalize(title + author).encode("utf-8")).hexdigest()
    data = get_json("https://openlibrary.org/search.json?" + query,
                    cache_key)
    candidates = []
    api_error = data.get("_api_error")
    if api_error:
        return candidates, api_error
    for doc in data.get("docs", []):
        candidate_title = doc.get("title")
        candidate_author = ", ".join(doc.get("author_name", []))
        cover_id = doc.get("cover_i")
        if not cover_id:
            continue
        if title_match(candidate_title, title) and author_match(candidate_author, author):
            candidates.append({
                "title": candidate_title,
                "author": candidate_author,
                "url": "https://covers.openlibrary.org/b/id/" + str(cover_id) + "-L.jpg",
                "source": "Open Library",
            })
    return candidates, None


def google_candidates(title, author):
    query = urllib.parse.quote_plus("intitle:" + title + " inauthor:" + author)
    cache_key = "gb_" + hashlib.sha1(normalize(title + author).encode("utf-8")).hexdigest()
    data = get_json("https://www.googleapis.com/books/v1/volumes?q=" + query + "&maxResults=10",
                    cache_key)
    candidates = []
    api_error = data.get("_api_error")
    if api_error:
        return candidates, api_error
    for item in data.get("items", []):
        info = item.get("volumeInfo", {})
        candidate_title = info.get("title")
        candidate_author = ", ".join(info.get("authors", []))
        links = info.get("imageLinks", {})
        raw_url = links.get("large") or links.get("extraLarge") or links.get("medium") or links.get("thumbnail") or links.get("smallThumbnail")
        if not raw_url:
            continue
        candidate_url = raw_url.replace("http://", "https://").split("&edge")[0].replace("zoom=1", "zoom=2")
        if title_match(candidate_title, title) and author_match(candidate_author, author):
            candidates.append({
                "title": candidate_title,
                "author": candidate_author,
                "url": candidate_url,
                "source": "Google Books",
            })
    return candidates, None


def main():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    broken_ids = {6, 8, 9, 13, 14, 17, 26}
    with engine.connect() as connection:
        rows = connection.execute(
            text("SELECT id, title, author, image_url FROM books")
        ).mappings().all()

    candidates_rows = []
    not_found_rows = []

    for row in rows:
        if row["id"] not in broken_ids:
            continue
        merged, api_error = openlibrary_candidates(row["title"], row["author"])
        if not merged:
            google_merged, google_error = google_candidates(row["title"], row["author"])
            merged = google_merged
            if google_error:
                api_error = (api_error + "; " if api_error else "") + google_error

        valid = None
        reasons = []
        for candidate in merged:
            dimensions, reason = validate_image(candidate["url"])
            if dimensions:
                valid = {**candidate, "dimensions": dimensions}
                break
            reasons.append(reason)

        if valid:
            width, height, size = valid["dimensions"]
            candidates_rows.append({
                "id": row["id"],
                "title": row["title"],
                "author": row["author"],
                "link_old": row["image_url"] or "",
                "link_new": valid["url"],
                "source": valid["source"],
                "confidence": "cao",
                "size_image": str(width) + "x" + str(height),
            })
        else:
            not_found_rows.append({
                "id": row["id"],
                "title": row["title"],
                "author": row["author"],
                "link_old": row["image_url"] or "",
                "reason": (
                    "; ".join(reasons) + (("; " + api_error) if api_error else "")
                    if reasons
                    else ((api_error + "; ") if api_error else "") + "khong tim thay tren cac nguon"
                ),
            })

    candidates_path = REPORT_DIR / "candidates.csv"
    not_found_path = REPORT_DIR / "not-found.csv"

    with candidates_path.open("w", newline="", encoding="utf-8-sig") as report:
        writer = csv.DictWriter(report, fieldnames=[
            "id", "title", "author", "link_old", "link_new", "source", "confidence", "size_image"
        ])
        writer.writeheader()
        writer.writerows(candidates_rows)

    with not_found_path.open("w", newline="", encoding="utf-8-sig") as report:
        writer = csv.DictWriter(report, fieldnames=["id", "title", "author", "link_old", "reason"])
        writer.writeheader()
        writer.writerows(not_found_rows)

    print("CANDIDATES=" + str(len(candidates_rows)))
    print("NOT_FOUND=" + str(len(not_found_rows)))
    print("CANDIDATES_REPORT=" + str(candidates_path))
    print("NOT_FOUND_REPORT=" + str(not_found_path))


if __name__ == "__main__":
    main()
