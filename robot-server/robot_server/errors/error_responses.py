"""JSON API errors and response models."""
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional, Sequence


class ApiError(Exception):
    """An exception to throw when an endpoint should respond with an error."""

    def __init__(self, status_code: int, content: Dict[str, Any]) -> None:
        """Intialize the exception.

        Arguments:
            status_code: The status code of the response
            content: The JSON response body
        """
        self.status_code = status_code
        self.content = content


class BaseErrorResponse(BaseModel):
    """Base class for error response bodies."""

    def as_error(self, status_code: int) -> ApiError:
        """Serialize the response as an API error to raise in a handler.

        Example:
            raise ResourceNotFoundResponse().as_error(status.HTTP_404_NOT_FOUND)
        """
        return ApiError(
            status_code=status_code,
            content=self.dict(exclude_none=True),
        )


class LegacyErrorResponse(BaseErrorResponse):
    """An error response with a human readable message."""

    message: str = Field(
        ...,
        description="A human-readable message describing the error.",
    )


class ErrorResponse(BaseErrorResponse):
    """An error response with error type and occurance details."""

    id: str = Field(
        ...,
        description="A unique identifier for this type of error.",
    )
    title: str = Field(
        ...,
        description="A short, human readable name for this type of error",
    )
    detail: str = Field(
        ...,
        description=(
            "A human-readable message describing this specific occurance "
            "of the error."
        ),
    )
    meta: Optional[Dict[str, Any]] = Field(
        None,
        description=(
            "An object containing non-standard information about this "
            "occurance of the error"
        ),
    )


class MultiErrorResponse(BaseErrorResponse):
    """An error response with multiple errors."""

    errors: Sequence[ErrorResponse] = Field(..., description="Error details.")
