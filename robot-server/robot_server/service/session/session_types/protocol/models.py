import typing
from pydantic import BaseModel


class ProtocolSessionDetails(BaseModel):
    protocolId: str
    currentState: typing.Optional[str]
    # TODO: Amit 8/3/2020 - proper schema for command types
    executedCommands: typing.List[typing.Any]
