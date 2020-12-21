import typing
from pydantic import BaseModel


class ProtocolStepEvent(BaseModel):
    command: str
    data: typing.Dict[str, typing.Any]