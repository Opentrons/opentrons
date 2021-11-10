from typing import List

from typing_extensions import Literal

from pydantic import BaseModel, Field


class ModuleConnection(BaseModel):
    """Model a single module connection."""

    url: str = Field(
        ...,
        description="The url (port) value the module driver should connect to. "
        "For example: socket://host:port",
    )
    module_type: str = Field(
        ..., description="What kind of module this connection emulates."
    )
    identifier: str = Field(..., description="Unique id for this emulator.")


class Message(BaseModel):
    """A message sent to module server clients."""

    status: Literal["connected", "disconnected", "dump"] = Field(
        ...,
        description="`dump` includes a complete list of connected emulators. "
        "`connected` for new connections. `disconnected` for emulators "
        "that have disconnected.  ",
    )
    connections: List[ModuleConnection]
