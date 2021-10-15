"""The Event model."""

from datetime import datetime

from pydantic import BaseModel, Field

from notify_server.models.payload_type import PayloadType


class Event(BaseModel):
    """The type of published events."""

    createdOn: datetime = Field(..., description="When this event was created")
    publisher: str = Field(..., description="Creator of this event")
    data: PayloadType = Field(..., description="Payload of the event")
