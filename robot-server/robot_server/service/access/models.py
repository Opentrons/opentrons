from datetime import datetime
from enum import Enum
import typing

from pydantic import BaseModel, Field

from robot_server.service.json_api import (
    ResponseModel, RequestModel, ResponseDataModel, MultiResponseModel)

TokenType = str


class AccessTokenInfo(BaseModel):
    token: TokenType =\
        Field(..., description="An access token")
    createdAt: typing.Optional[datetime] =\
        Field(..., description="When this token was created")


class AccessTokenInfoResponse(ResponseDataModel, AccessTokenInfo):
    pass


AccessTokenResponse = ResponseModel[
    AccessTokenInfoResponse
]
MultipleAccessTokenResponse = MultiResponseModel[
    AccessTokenInfoResponse
]
AccessTokenRequest = RequestModel[
    AccessTokenInfo
]


class ControlScope(str, Enum):
    """The scope of robot control"""
    robot = 'robot'
