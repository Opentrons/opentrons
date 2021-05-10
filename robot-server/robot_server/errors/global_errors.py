"""Global error types."""
from typing_extensions import Literal

from .error_responses import ErrorResponse


class UnexpectedErrorResponse(ErrorResponse):
    """An error returned when an unhandled exception occurs."""

    id: Literal["UnexpectedError"] = "UnexpectedError"
    title: str = "Unexpected Internal Error"


class BadRequestResponse(ErrorResponse):
    """An error returned when the framework rejects the request."""

    id: Literal["BadRequest"] = "BadRequest"
    title: str = "Bad Request"
