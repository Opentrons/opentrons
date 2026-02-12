"""Request and response models for /system endpoints."""

from datetime import datetime

from pydantic import BaseModel

from server_utils.fastapi_utils.models.json_api import (
    DeprecatedResponseDataModel,
    DeprecatedResponseModel,
    RequestModel,
)


class SystemTimeAttributes(BaseModel):
    """System time attributes common to requests and responses."""

    systemTime: datetime


class SystemTimeResponseAttributes(DeprecatedResponseDataModel, SystemTimeAttributes):
    """System time response model attributes."""


SystemTimeResponse = DeprecatedResponseModel[SystemTimeResponseAttributes]

SystemTimeRequest = RequestModel[SystemTimeAttributes]
