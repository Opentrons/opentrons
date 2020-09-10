from datetime import datetime
from pydantic import BaseModel, Field

from robot_server.service.json_api import ResponseModel, ResponseDataModel, \
    RequestDataModel, RequestModel


class SystemTimeAttributes(BaseModel):
    systemTime: datetime


class SystemTimeLinks(BaseModel):
    """A set of useful links"""
    systemTime: str = \
        Field(...,
              description="The URI for system time information")


SystemTimeResponseDataModel = ResponseDataModel[SystemTimeAttributes]

SystemTimeResponse = ResponseModel[SystemTimeResponseDataModel, dict]

SystemTimeRequest = RequestModel[RequestDataModel[SystemTimeAttributes]]
