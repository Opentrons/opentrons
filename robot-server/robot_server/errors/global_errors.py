"""Global error types."""
from typing_extensions import Literal

from .error_responses import ErrorDetails


class UnexpectedError(ErrorDetails):
    """An error returned when an unhandled exception occurs."""

    id: Literal["UnexpectedError"] = "UnexpectedError"
    title: str = "Unexpected Internal Error"


class BadRequest(ErrorDetails):
    """An error returned when the framework rejects the request."""

    id: Literal["BadRequest"] = "BadRequest"
    title: str = "Bad Request"


class InvalidRequest(ErrorDetails):
    """An error returned when the request fails validation."""

    id: Literal["InvalidRequest"] = "InvalidRequest"
    title: str = "Invalid Request"
