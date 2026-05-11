"""JSON API request models."""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field

RequestDataT = TypeVar("RequestDataT")


class RequestModel(BaseModel, Generic[RequestDataT]):
    """JSON:API-style request envelope.

    See https://jsonapi.org/format/#document-request-data
    """

    data: RequestDataT = Field(..., description="the document's 'primary data'")
    userNotes: str | None = Field(
        None,
        description=(
            "Optional user-supplied notes (plain string). Endpoints may ignore this or "
            "apply additional validation (e.g. only for certain `data` payloads). "
        ),
    )
