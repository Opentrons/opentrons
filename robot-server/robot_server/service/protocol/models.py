import typing
from datetime import datetime

from pydantic import BaseModel

from robot_server.service.json_api import ResponseModel, ResponseDataModel


class ProtocolResponseAttributes(BaseModel):
    name: str
    protocolFile: str
    userFiles: typing.List[str]
    lastModifiedAt: datetime
    createdAt: datetime


ProtocolResponse = ResponseModel[
    ResponseDataModel[ProtocolResponseAttributes], dict
]

MultiProtocolResponse = ResponseModel[
    typing.List[ResponseDataModel[ProtocolResponseAttributes]], dict
]
