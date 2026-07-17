"""JSON API request models."""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

RequestDataT = TypeVar("RequestDataT")


def parse_supplied_user_notes(user_notes: str | None) -> str | None:
    """Return non-empty audit notes, or ``None`` if absent or whitespace-only."""
    if user_notes is None:
        return None
    stripped = user_notes.strip()
    return stripped if stripped else None


class RequestModel(BaseModel, Generic[RequestDataT]):
    """A request model."""

    """See https://jsonapi.org/format/#document-request-data"""

    data: RequestDataT = Field(..., description="the document's 'primary data'")
