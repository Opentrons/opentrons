import typing
from datetime import datetime

from pydantic import BaseModel

from robot_server.service.json_api import (
    ResponseModel, ResponseDataModel, MultiResponseModel)


class FileAttributes(BaseModel):
    basename: str


class ProtocolResponseAttributes(ResponseDataModel):
    protocolFile: FileAttributes
    supportFiles: typing.List[FileAttributes]
    lastModifiedAt: datetime
    createdAt: datetime


ProtocolResponse = ResponseModel[ProtocolResponseAttributes]

MultiProtocolResponse = MultiResponseModel[ProtocolResponseAttributes]
