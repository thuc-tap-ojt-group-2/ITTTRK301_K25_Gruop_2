import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    if APP_ENV in {"production", "prod"}:
        raise RuntimeError("SECRET_KEY must be configured outside development.")
    SECRET_KEY = "ptit-library-development-only-change-before-deploy"

ALGORITHM = "HS256"
