"""Request and response models for /system endpoints."""
from datetime import datetime
from pydantic import BaseModel

from robot_server.service.json_api import ResponseModel, ResponseDataModel, RequestModel


class SystemTimeAttributes(BaseModel):
    """System time attributes common to requests and responses."""

    systemTime: datetime


class SystemTimeResponseAttributes(ResponseDataModel, SystemTimeAttributes):
    """System time response model attributes."""

    pass


SystemTimeResponse = ResponseModel[SystemTimeResponseAttributes]

SystemTimeRequest = RequestModel[SystemTimeAttributes]
