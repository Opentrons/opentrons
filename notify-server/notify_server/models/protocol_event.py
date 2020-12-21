import typing
from pydantic import BaseModel


class ProtocolStepEvent(BaseModel):
    command: str
    payload: typing.Dict[str, typing.Any]