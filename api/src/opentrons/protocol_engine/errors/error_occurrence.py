"""Models for concrete occurrences of specific errors."""
from datetime import datetime
from typing import Any, Dict
from pydantic import BaseModel, Field
from .exceptions import ErrorCode


# TODO(mc, 2021-11-12): flesh this model out with structured error data
# for each error type so client may produce better error messages
class ErrorOccurrence(BaseModel):
    """An occurrence of a specific error during protocol execution."""

    id: str = Field(..., description="Unique identifier of this error occurrence.")
    errorType: str = Field(..., description="Specific error type that occurred.")
    createdAt: datetime = Field(..., description="When the error occurred.")
    detail: str = Field(..., description="A human-readable message about the error.")
    errorCode: str = Field(
        default=ErrorCode.UNKNOWN.value,
        description="An enumerated error code for the error type.",
    )

    class Config:
        """Customize configuration for this model."""

        @staticmethod
        def schema_extra(schema: Dict[str, Any], model: object) -> None:
            """Append the schema to make the errorCode appear required.

            `errorCode` has a default because it is not included in earlier
            versions of this model, _and_ this model is loaded directly from
            the on-robot store. That means that, without a default, it will
            fail to parse. Once a default is defined, the automated schema will
            mark this as a non-required field, which is misleading as this is
            a response from the server to the client and it will always have an
            errorCode defined. This hack is required because it informs the client
            that it does not, in fact, have to account for a missing errorCode.
            """
            schema["required"].append("errorCode")
