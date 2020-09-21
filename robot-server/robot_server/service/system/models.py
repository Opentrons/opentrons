from datetime import datetime
from pydantic import BaseModel

from robot_server.service.json_api import (
    ResponseModel, ResponseDataModel, RequestModel
)


class SystemTimeAttributes(BaseModel):
    systemTime: datetime


SystemTimeResponseDataModel = ResponseDataModel[SystemTimeAttributes]

SystemTimeResponse = ResponseModel[SystemTimeAttributes, dict]

SystemTimeRequest = RequestModel[SystemTimeAttributes]
