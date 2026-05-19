"""JSON API request models."""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

RequestDataT = TypeVar("RequestDataT")


def parse_supplied_user_notes(user_notes: str | None) -> str | None:
    """Return non-empty ``userNotes``, or ``None`` if absent or whitespace-only."""
    if user_notes is None:
        return None
    stripped = user_notes.strip()
    return stripped if stripped else None


class RequestModel(BaseModel, Generic[RequestDataT]):
    """A request model."""

    """See https://jsonapi.org/format/#document-request-data"""

    data: RequestDataT = Field(..., description="the document's 'primary data'")
    userNotes: str | None = Field(
        None,
        description=(
            "Optional user-supplied notes (plain string) for the audit log when the "
            "client performs an action that requires documenting about why they interacted "
            "with the robot. This is a sibling of ``data`` on the request document, not a "
            "field inside ``data``. Whether it is required depends on the auth-server "
            "require-reason-for-interaction setting; individual endpoints may ignore it or "
            "apply additional validation."
        ),
    )

    def supplied_user_notes(self) -> str | None:
        """Return non-empty ``userNotes``, or ``None`` if absent or whitespace-only."""
        return parse_supplied_user_notes(self.userNotes)
