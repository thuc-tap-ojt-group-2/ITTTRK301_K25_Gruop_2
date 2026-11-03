from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(settings.db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependency cua FastAPI: mo mot phien lam viec va dong lai sau moi request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
