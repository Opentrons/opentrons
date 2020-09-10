from datetime import datetime
from pydantic import BaseModel

from robot_server.service.json_api import ResponseModel, ResponseDataModel, \
    RequestDataModel, RequestModel


class SystemTimeAttributes(BaseModel):
    systemTime: datetime


SystemTimeResponseDataModel = ResponseDataModel[SystemTimeAttributes]

SystemTimeResponse = ResponseModel[SystemTimeResponseDataModel, dict]

SystemTimeRequest = RequestModel[RequestDataModel[SystemTimeAttributes]]
