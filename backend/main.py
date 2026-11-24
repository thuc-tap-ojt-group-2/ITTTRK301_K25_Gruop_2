import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import (
    admin,
    auth,
    books,
    categories,
    fines,
    loans,
    readers,
    reservations,
    stats,
)

load_dotenv(Path(__file__).resolve().parent / ".env")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PTIT Library Management API",
    version="1.0.0",
    description="Hệ thống quản lý thư viện PTIT"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:5500,http://127.0.0.1:5500,http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(categories.router)
app.include_router(readers.router)
app.include_router(loans.router)
app.include_router(reservations.router)
app.include_router(fines.router)
app.include_router(stats.router)


@app.get("/")
def root():
    return {"message": "PTIT Library API is running"}