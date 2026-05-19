"""JSON API request models."""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

RequestDataT = TypeVar("RequestDataT")


class RequestModel(BaseModel, Generic[RequestDataT]):
    """A request model."""

    """See https://jsonapi.org/format/#document-request-data"""

    data: RequestDataT = Field(..., description="the document's 'primary data'")
    userNotes: str | None = Field(
        None,
        description=(
            "Optional user-supplied notes (plain string) for the audit log when the "
            "client performs an action that requires documenting about why they interacted "
            "with the robot. Whether this field is required depends on the auth-server "
            "require-reason-for-interaction setting; individual endpoints may ignore "
            "it or apply additional validation (e.g. only for certain `data` payloads)."
        ),
    )
