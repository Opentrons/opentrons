"""Protocol file models."""
from __future__ import annotations
from datetime import datetime
from pydantic import Field
from opentrons.protocol_runner import ProtocolFileType
from robot_server.service.json_api import ResourceModel


class Protocol(ResourceModel):
    """A model representing an uploaded protocol resource."""

    id: str = Field(..., description="A unique identifier for this protocol.")
    createdAt: datetime = Field(..., description="When this protocol was uploaded.")
    protocolType: ProtocolFileType = Field(
        ...,
        description="The type of protocol file (JSON or Python).",
    )
