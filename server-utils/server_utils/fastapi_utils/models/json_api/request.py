"""JSON API request models."""

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

RequestDataT = TypeVar("RequestDataT")


class UserConfirmation(BaseModel):
    """Who acknowledged an action, when, and why.

    May appear as optional `userConfirmation` on `RequestModel` when an endpoint records
    access-control or audit context alongside the request `data`.
    """

    note: str = Field(..., description="User-supplied justification note.")
    confirmedAt: datetime = Field(..., description="When the user confirmed.")
    username: str = Field(..., description="Username that confirmed.")


class RequestModel(BaseModel, Generic[RequestDataT]):
    """JSON:API-style request envelope.

    See https://jsonapi.org/format/#document-request-data
    """

    data: RequestDataT = Field(..., description="the document's 'primary data'")
    userConfirmation: UserConfirmation | None = Field(
        None,
        description=(
            "Optional user confirmation for audit / access control. Endpoints may "
            "ignore this or apply additional validation (e.g. only for certain "
            "`data` payloads)."
        ),
    )
