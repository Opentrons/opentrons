"""Protocol file models."""
from pydantic import Field
from opentrons.file_runner import ProtocolFileType
from robot_server.service.json_api import ResponseDataModel


class ProtocolResource(ResponseDataModel):
    """A model representing an uploaded protocol resource."""

    id: str = Field(..., description="A unique identifier for this protocol.")
    fileName: str = Field(..., description="The base name of the protocol file.")
    fileType: ProtocolFileType = Field(
        ...,
        description="The type of protocol file (JSON or Python).",
    )
