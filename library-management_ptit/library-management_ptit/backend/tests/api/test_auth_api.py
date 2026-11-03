"""Kiem thu API bang TestClient + SQLite trong bo nho. Can: pip install -r requirements.txt, chay: pytest"""
import pytest

pytest.importorskip("fastapi")
pytest.importorskip("httpx")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (dang ky model voi Base)
from app.database import Base, get_db
from app.main import app

VALID = {"fullName": "Nguyễn Văn A", "studentCode": "B21DCCN001", "email": "a@ptit.edu.vn", "password": "123456"}


@pytest.fixture()
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def override_get_db():
        db = testing_session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_register_returns_201_and_reader_role(client):
    response = client.post("/api/auth/register", json=VALID)
    assert response.status_code == 201
    body = response.json()
    assert body["role"] == "READER"
    assert body["fullName"] == "Nguyễn Văn A"
    assert "password" not in body and "passwordHash" not in body


def test_register_duplicate_email_returns_409(client):
    client.post("/api/auth/register", json=VALID)
    response = client.post("/api/auth/register", json={**VALID, "studentCode": "B21DCCN002"})
    assert response.status_code == 409
    assert response.json()["message"] == "Email đã được đăng ký"


def test_register_short_password_returns_400_with_vietnamese_message(client):
    response = client.post("/api/auth/register", json={**VALID, "password": "123"})
    assert response.status_code == 400
    assert response.json()["message"] == "Mật khẩu phải từ 6 đến 50 ký tự"


def test_register_invalid_email_returns_400(client):
    response = client.post("/api/auth/register", json={**VALID, "email": "khong-hop-le"})
    assert response.status_code == 400
    assert response.json()["message"] == "Email không đúng định dạng"


def test_register_missing_field_returns_400(client):
    body = {k: v for k, v in VALID.items() if k != "fullName"}
    response = client.post("/api/auth/register", json=body)
    assert response.status_code == 400
    assert response.json()["message"] == "Thiếu trường fullName"


def test_login_success_returns_token(client):
    client.post("/api/auth/register", json=VALID)
    response = client.post("/api/auth/login", json={"email": "A@ptit.edu.vn", "password": "123456"})
    assert response.status_code == 200
    body = response.json()
    assert body["token"]
    assert body["role"] == "READER"


def test_login_wrong_password_returns_401(client):
    client.post("/api/auth/register", json=VALID)
    response = client.post("/api/auth/login", json={"email": "a@ptit.edu.vn", "password": "sai"})
    assert response.status_code == 401
    assert response.json()["message"] == "Email hoặc mật khẩu không đúng"


def test_unknown_path_returns_404_with_message(client):
    response = client.get("/api/khong-ton-tai")
    assert response.status_code == 404
    assert "message" in response.json()
