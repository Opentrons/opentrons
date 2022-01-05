"""JSON API errors and response models."""
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel
from typing import Any, Dict, Generic, Optional, Sequence, Tuple, TypeVar

from robot_server.service.json_api import BaseResponseBody, ResourceLinks


class ApiError(Exception):
    """An exception to throw when an endpoint should respond with an error."""

    def __init__(self, status_code: int, content: Dict[str, Any]) -> None:
        """Initialize the exception.

        Arguments:
            status_code: The status code of the response
            content: The JSON response body
        """
        self.status_code = status_code
        self.content = content


class BaseErrorResponse(BaseResponseBody):
    """Base class for error response bodies."""

    def as_error(self, status_code: int) -> ApiError:
        """Serialize the response as an API error to raise in a handler."""
        return ApiError(
            status_code=status_code,
            content=self.dict(),
        )


class ErrorSource(BaseModel):
    """An object containing references to the source of the error."""

    pointer: Optional[str] = Field(
        None,
        description=(
            "A JSON Pointer [RFC6901] to the associated entity in the request document."
        ),
    )
    parameter: Optional[str] = Field(
        None,
        description="a string indicating which URI query parameter caused the error.",
    )
    header: Optional[str] = Field(
        None,
        description="A string indicating which header caused the error.",
    )


class ErrorDetails(BaseErrorResponse):
    """An error response with error type and occurrence details.

    Extend this class to create specific error responses, and use it in your
    route handlers.

    Example:
        from fastapi import status
        from typing_extensions import Literal
        from robot_server.errors import ErrorResponse, ErrorDetails

        class BadRequest(ErrorDetails):
            id: Literal["BadRequest"] = "BadRequest"
            title: str = "Bad Request"

        # ...

        @router.get(
            path="/some/path",
            response_model=SomeModel,
            responses={
                status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse[BadRequest]},
            }
        )
        def get_some_model():
            # ...
            raise BadRequest.as_error(status.HTTP_400_BAD_REQUEST)
    """

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
            "A human-readable message describing this specific occurrence "
            "of the error."
        ),
    )
    source: Optional[ErrorSource] = Field(
        None,
        description="An object containing references to the source of the error.",
    )
    meta: Optional[Dict[str, Any]] = Field(
        None,
        description=(
            "An object containing non-standard information about this "
            "occurrence of the error"
        ),
    )

    def as_error(self, status_code: int) -> ApiError:
        """Serial this ErrorDetails as an ApiError from an ErrorResponse."""
        return ErrorResponse(errors=(self,)).as_error(status_code)


ErrorDetailsT = TypeVar("ErrorDetailsT", bound=ErrorDetails)


class LegacyErrorResponse(BaseErrorResponse):
    """An error response with a human readable message."""

    message: str = Field(
        ...,
        description="A human-readable message describing the error.",
    )


class ErrorResponse(BaseErrorResponse, GenericModel, Generic[ErrorDetailsT]):
    """A response body for a single error."""

    errors: Tuple[ErrorDetailsT] = Field(..., description="Error details.")
    links: Optional[ResourceLinks] = Field(
        None,
        description=(
            "Links that leads to further details about "
            "this particular occurrence of the problem."
        ),
    )


class MultiErrorResponse(BaseErrorResponse, GenericModel, Generic[ErrorDetailsT]):
    """An response body for multiple errors."""

    errors: Sequence[ErrorDetailsT] = Field(..., description="Error details.")
    links: Optional[ResourceLinks] = Field(
        None,
        description=(
            "Links that leads to further details about "
            "this particular occurrence of the problem."
        ),
    )
