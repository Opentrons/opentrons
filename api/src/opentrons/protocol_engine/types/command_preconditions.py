"""Protocol Engine types dealing with command preconditions."""
from enum import Enum
from pydantic import Field, BaseModel


class PreconditionTypes(str, Enum):
    """Precondition types used for identification during state update."""

    IS_CAMERA_USED = "isCameraUsed"


class CommandPreconditions(BaseModel):
    """Preconditions of commands as described in protocol analysis."""

    isCameraUsed: bool = Field(
        default=False,
        description="Parameter to determine if a Camera is used in a protocol.",
    )
