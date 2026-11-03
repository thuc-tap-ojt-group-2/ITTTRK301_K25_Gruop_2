"""Doc cau hinh tu bien moi truong (hoac file .env). Khong ghi mat khau vao ma nguon."""
import os
from dataclasses import dataclass
from urllib.parse import quote_plus

from dotenv import load_dotenv

load_dotenv()

# Khoa chi de chay thu tren may ca nhan. Khi trien khai that phai dat JWT_SECRET rieng.
DEV_JWT_SECRET = "dev-only-secret-change-me-dev-only-secret-change-me"


@dataclass(frozen=True)
class Settings:
    db_url: str
    jwt_secret: str
    jwt_expire_hours: int


def load_settings() -> Settings:
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "3306")
    name = os.getenv("DB_NAME", "library_ptit")
    user = quote_plus(os.getenv("DB_USER", "root"))
    password = quote_plus(os.getenv("DB_PASSWORD", ""))
    db_url = os.getenv("DB_URL") or f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}?charset=utf8mb4"
    return Settings(
        db_url=db_url,
        jwt_secret=os.getenv("JWT_SECRET", DEV_JWT_SECRET),
        jwt_expire_hours=int(os.getenv("JWT_EXPIRE_HOURS", "24")),
    )


settings = load_settings()
