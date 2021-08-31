"""Protocol file models."""
from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field, Json
from opentrons.protocol_runner import ProtocolFileType
from robot_server.service.json_api import ResourceModel
from typing import Optional


class Metadata(BaseModel):
    """Extra, nonessential information about the protocol.

    This can include things like:

    * A human-readable title and description.
    * A last-modified date.
    * A list of authors.

    The exact set of fields is not defined by this API.
    A protocol can define whatever it likes as its metadata,
    and this API will pass it along without modification.
    When reading a protocol's metadata,
    you should treat it as an arbitrary JSON object from an untrusted source.

    This metadata does *not* include
    anything material to how the robot will run the protocol.
    For example, it does not include the protocol's pipette and labware requirements.

    (Exception:
    Python protocols define their `apiLevel`,
    which *does* affect how they're run,
    as part of their metadata.
    This is for historical reasons;
    `apiLevel` is not truly metadata and doesn't really belong here.
    You should not rely on a Python protocol's correct `apiLevel` being present here.
    If a compelling need arises, this API may expose `apiLevel` some other way.)
    """

    class Config:
        extra = "allow"


class Protocol(ResourceModel):
    """A model representing an uploaded protocol resource."""

    id: str = Field(..., description="A unique identifier for this protocol.")
    createdAt: datetime = Field(
        ...,
        description="When this protocol was *uploaded.*"
                    " (`metadata` may have information about"
                    " when this protocol was *authored.*)"
    )
    protocolType: ProtocolFileType = Field(
        ...,
        description="The type of protocol file (JSON or Python).",
    )
    pythonApiLevel: Optional[str]  # To do: Fix optional and document
    protocolMetadata: Metadata = Metadata()  # To do: Remove optional
