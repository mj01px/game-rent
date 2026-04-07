from typing import Any

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    detail = response.data.get("detail") if isinstance(response.data, dict) else None

    if detail is not None:
        message = str(detail)
        code = getattr(getattr(detail, "code", None), "__str__", lambda: "error")() or "error"
    else:
        details = []
        for field, errors in (response.data.items() if isinstance(response.data, dict) else []):
            for err in (errors if isinstance(errors, list) else [errors]):
                details.append({"field": field, "issue": str(err)})
        message = "Erro de validação." if details else "Erro inesperado."
        code = "VALIDATION_ERROR" if details else "ERROR"
        response.data = {
            "data": None,
            "error": {"code": code, "message": message, "details": details},
            "meta": None,
        }
        return response

    response.data = {
        "data": None,
        "error": {"code": code.upper(), "message": message, "details": []},
        "meta": None,
    }
    return response

def api_response(
    data: Any = None,
    meta: dict | None = None,
    status_code: int = status.HTTP_200_OK,
) -> Response:
    return Response(
        {
            "data": data,
            "error": None,
            "meta": meta,
        },
        status=status_code,
    )

def api_error(
    code: str,
    message: str,
    details: list | None = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
) -> Response:
    return Response(
        {
            "data": None,
            "error": {
                "code": code,
                "message": message,
                "details": details or [],
            },
            "meta": None,
        },
        status=status_code,
    )
