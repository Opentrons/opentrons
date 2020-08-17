import typing
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class ProtocolSessionDetails(BaseModel):
    protocolId: str = \
        Field(...,
              description="The protocol used by this session")
    currentState: typing.Optional[str]
    events: typing.List[typing.Any] =\
        Field(...,
              description="The events that have occurred thus far")


class EventSource(str, Enum):
    session_command = "sessionCommand"
    protocol_event = "protocol"


class ProtocolSessionEvent(BaseModel):
    """An event occurring during a protocol session"""
    source: EventSource = \
        Field(..., description="Initiator of this event")
    event: str = \
        Field(..., description="The event that occurred")
    commandId: typing.Optional[str] = None
    startedAt: typing.Optional[datetime] = None
    completedAt: typing.Optional[datetime] = None
    params: typing.Optional[typing.Dict[str, typing.Any]] = None
    result: typing.Optional[str] = None
