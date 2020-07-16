import typing
from datetime import datetime

from pydantic import BaseModel

from robot_server.service.json_api import ResponseModel, ResponseDataModel


class ProtocolResponseAttributes(BaseModel):
    protocolFile: str
    userFiles: typing.List[str]
    lastModifiedAt: datetime
    createdAt: datetime


ProtocolResponseDataModel = ResponseDataModel[ProtocolResponseAttributes]

ProtocolResponse = ResponseModel[
    ProtocolResponseDataModel, dict
]

MultiProtocolResponse = ResponseModel[
    typing.List[ProtocolResponseDataModel], dict
]
