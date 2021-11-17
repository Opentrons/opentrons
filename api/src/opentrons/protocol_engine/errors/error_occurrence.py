"""Models for concrete occurrences of specific errors."""
from datetime import datetime
from pydantic import BaseModel, Field


# TODO(mc, 2021-11-12): flesh this model out with structured error data
# for each error type so client may produce better error messages
class ErrorOccurrence(BaseModel):
    """An occurrence of a specific error during protocol execution."""

    id: str = Field(..., description="Unique identifier of this error occurrence.")
    errorType: str = Field(..., description="Specific error type that occurred.")
    createdAt: datetime = Field(..., description="When the error occurred.")
    detail: str = Field(..., description="A human-readable message about the error.")
