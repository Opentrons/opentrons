"""Protocol Engine types dealing with command preconditions."""

from pydantic import BaseModel, Field

from opentrons_shared_data.util import StrEnum


class PreconditionTypes(StrEnum):
    """Precondition types used for identification during state update."""

    IS_CAMERA_USED = "isCameraUsed"


class CommandPreconditions(BaseModel):
    """Preconditions of commands as described in protocol analysis."""

    isCameraUsed: bool = Field(
        default=False,
        description="Parameter to determine if a Camera is used in a protocol.",
    )
