import importlib
import pkgutil

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import routers
from app.error_handlers import register_error_handlers

app = FastAPI(title="Website quản lý thư viện PTIT", version="0.1.0")

# Cho phep giao dien (Live Server, cong bat ky tren localhost) goi API
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

register_error_handlers(app)

# Tu dong nap moi file trong app/routers (moi file co bien `router`).
# Them API moi chi can them file vao thu muc routers, khong phai sua main.py (it xung dot khi nhieu nguoi cung lam).
for module_info in pkgutil.iter_modules(routers.__path__):
    app.include_router(importlib.import_module(f"app.routers.{module_info.name}").router)
