import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, ensure_schema_compatibility
from app.routers import books, auth, loans

default_frontend_origins = (
    "http://localhost:5500",
    "http://127.0.0.1:5500",
)
frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS", ",".join(default_frontend_origins)
    ).split(",")
    if origin.strip()
]

Base.metadata.create_all(bind=engine)
ensure_schema_compatibility()

app = FastAPI(
    title="PTIT Library Management API",
    version="1.0.0",
    description="Hệ thống quản lý thư viện PTIT"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books.router)
app.include_router(auth.router)
app.include_router(loans.router)

@app.get("/")
def root():
    return {"message": "PTIT Library API is running"}
