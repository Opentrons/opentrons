from datetime import datetime
from pydantic import BaseModel

from robot_server.service.json_api import (
    ResponseModel, ResponseDataModel, RequestModel
)


class SystemTimeAttributes(BaseModel):
    systemTime: datetime


class SystemTimeAttributesResponse(ResponseDataModel, SystemTimeAttributes):
    pass


SystemTimeResponse = ResponseModel[SystemTimeAttributesResponse]

SystemTimeRequest = RequestModel[SystemTimeAttributes]
