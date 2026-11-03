"""Cac loi nghiep vu. error_handlers.py doi chung thanh phan hoi { "message": "..." }."""


class AppError(Exception):
    status_code = 500

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class BusinessError(AppError):
    """Vi pham quy tac nghiep vu (SRS: 409)."""
    status_code = 409


class UnauthorizedError(AppError):
    status_code = 401


class ForbiddenError(AppError):
    status_code = 403


class NotFoundError(AppError):
    status_code = 404
