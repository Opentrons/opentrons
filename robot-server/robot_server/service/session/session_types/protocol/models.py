import typing
from enum import Enum

from pydantic import BaseModel


class ProtocolSessionState(str, Enum):
    idle = "idle"
    preparing = "preparing"
    ready = "ready"
    running = "running"
    simulating = "simulating"
    failed = "failed"
    paused = "paused"
    exited = "exited"


class ProtocolSessionDetails(BaseModel):
    protocolId: str
    currentState: ProtocolSessionState
    # TODO: Amit 8/3/2020 - proper schema for command types
    executedCommands: typing.List[typing.Any]
