from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(self, status_code: int, code: str, message: str, details: dict[str, Any] | None = None):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or {}


def error_response(status_code: int, code: str, message: str, details: dict[str, Any] | None = None) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": {"code": code, "message": message, "details": details or {}}})


async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return error_response(exc.status_code, exc.code, exc.message, exc.details)


async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [{"loc": list(e["loc"]), "msg": e["msg"], "type": e["type"]} for e in exc.errors()]
    return error_response(422, "VALIDATION_ERROR", "Request validation failed", {"errors": errors})


async def unexpected_error_handler(_: Request, __: Exception) -> JSONResponse:
    return error_response(500, "INTERNAL_ERROR", "An unexpected internal error occurred")
