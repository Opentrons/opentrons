import typing
from datetime import datetime

from pydantic import BaseModel

from robot_server.service.json_api import ResponseModel, ResponseDataModel
from robot_server.service.json_api.response import MultiResponseModel


class FileAttributes(BaseModel):
    basename: str


class ProtocolResponseAttributes(BaseModel):
    protocolFile: FileAttributes
    supportFiles: typing.List[FileAttributes]
    lastModifiedAt: datetime
    createdAt: datetime


ProtocolResponseDataModel = ResponseDataModel[ProtocolResponseAttributes]

ProtocolResponse = ResponseModel[ProtocolResponseAttributes, dict]

MultiProtocolResponse = MultiResponseModel[ProtocolResponseAttributes, dict]
