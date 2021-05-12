"""Request models for the /sessions API."""
from enum import Enum
from pydantic import Field

from robot_server.service.json_api import ResponseDataModel


class CommandType(str, Enum):
    """All available session types."""

    NOOP = "noop"


class SessionCommand(ResponseDataModel):
    """A command to execute during the session."""

    id: str = Field(..., description="Unique command identifier.")
    commandType: CommandType = Field(
        CommandType.NOOP,
        description="Specific command type.",
    )
