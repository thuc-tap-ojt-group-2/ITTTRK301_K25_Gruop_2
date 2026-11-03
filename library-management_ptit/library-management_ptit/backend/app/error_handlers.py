"""Mot noi duy nhat tra loi theo mau { "message": "..." } (SRS muc 6.2)."""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.exceptions import AppError

logger = logging.getLogger(__name__)

HTTP_MESSAGES = {
    401: "Chưa đăng nhập hoặc token không hợp lệ",
    403: "Bạn không đủ quyền thực hiện thao tác này",
    404: "Không tìm thấy đường dẫn",
    405: "Phương thức không được hỗ trợ",
}


def _json(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"message": message})


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError):
        return _json(exc.status_code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def handle_validation(request: Request, exc: RequestValidationError):
        message = "Dữ liệu không hợp lệ"
        errors = exc.errors()
        if errors:
            first = errors[0]
            error_type = first.get("type")
            if error_type == "missing":
                message = f"Thiếu trường {first['loc'][-1]}"
            elif error_type == "json_invalid":
                message = "Dữ liệu gửi lên không đúng định dạng JSON"
            else:
                message = str(first.get("msg", "")).removeprefix("Value error, ") or message
        return _json(400, message)

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(request: Request, exc: StarletteHTTPException):
        return _json(exc.status_code, HTTP_MESSAGES.get(exc.status_code, str(exc.detail)))

    @app.exception_handler(Exception)
    async def handle_unexpected(request: Request, exc: Exception):
        logger.exception("Loi he thong")
        return _json(500, "Lỗi hệ thống, vui lòng thử lại sau")
