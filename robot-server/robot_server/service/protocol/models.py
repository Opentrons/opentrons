import typing
from datetime import datetime

from pydantic import BaseModel

from robot_server.service.json_api import ResponseModel, ResponseDataModel


class FileAttributes(BaseModel):
    basename: str


class ProtocolResponseAttributes(BaseModel):
    protocolFile: FileAttributes
    supportFiles: typing.List[FileAttributes]
    lastModifiedAt: datetime
    createdAt: datetime


ProtocolResponseDataModel = ResponseDataModel[ProtocolResponseAttributes]

ProtocolResponse = ResponseModel[
    ProtocolResponseDataModel, dict
]

MultiProtocolResponse = ResponseModel[
    typing.List[ProtocolResponseDataModel], dict
]
