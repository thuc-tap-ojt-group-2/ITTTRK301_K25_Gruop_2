from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import books, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PTIT Library Management API",
    version="1.0.0",
    description="Hệ thống quản lý thư viện PTIT"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books.router)
app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "PTIT Library API is running"}
