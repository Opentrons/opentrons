"""Protocol file models."""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field, Json
from opentrons.protocol_runner import ProtocolFileType
from robot_server.service.json_api import ResourceModel
from typing import Optional


class Metadata(BaseModel):
    """Static info that doesn't affect how the protocol will be run."""

    class Config:
        extra = "allow"


class Protocol(ResourceModel):
    """A model representing an uploaded protocol resource."""

    id: str = Field(..., description="A unique identifier for this protocol.")
    createdAt: datetime = Field(
        ...,
        description="When this protocol was *uploaded.* See also `metadata.createdAt`.",
    )
    protocolType: ProtocolFileType = Field(
        ...,
        description="The type of protocol file (JSON or Python).",
    )
    pythonApiLevel: Optional[str]  # To do: Fix optional and document
    protocolMetadata: Metadata = Metadata()  # To do: Remove optional
