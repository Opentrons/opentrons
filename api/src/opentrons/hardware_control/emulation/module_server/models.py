from typing import List

from typing_extensions import Literal

from pydantic import BaseModel


class Connection(BaseModel):
    """Model a single module connection."""

    url: str
    module_type: str
    identifier: str


class Message(BaseModel):
    """A message sent to module server clients."""

    status: Literal["connected", "disconnected", "dump"]
    connections: List[Connection]
