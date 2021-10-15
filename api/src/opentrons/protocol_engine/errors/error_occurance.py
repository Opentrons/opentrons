"""Models representing an error occurances."""
from datetime import datetime
from pydantic import BaseModel, Extra, Field


class ErrorOccurance(BaseModel):
    """An occurance of an error in the ProtocolEngine."""

    id: str = Field(
        ...,
        description="A unique identifier for this specific error occurance.",
    )
    errorType: str = Field(..., description="The type of error that occurred")
    createdAt: datetime = Field(..., description="When the error occured")
    detail: str = Field(
        ...,
        description="A human-readable description of this error occurance",
    )

    # TODO(mc, 2021-10-13): replace with concrete subclasses for each
    # specific error type rather than having this loose object
    class Config:
        """Allow extra fields."""

        extra = Extra.allow
