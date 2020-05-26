from datetime import datetime
from enum import Enum
import typing

from pydantic import BaseModel, Field

from robot_server.service.json_api import \
    ResponseDataModel, ResponseModel, RequestDataModel, RequestModel

TokenType = str


class AccessTokenInfo(BaseModel):
    token: TokenType =\
        Field(..., description="An access token")
    createdOn: typing.Optional[datetime] =\
        Field(..., description="When this token was created")


AccessTokenResponse = ResponseModel[
    ResponseDataModel[AccessTokenInfo], dict
]
MultipleAccessTokenResponse = ResponseModel[
    typing.List[ResponseDataModel[AccessTokenInfo]], dict
]
AccessTokenRequest = RequestModel[
    RequestDataModel[AccessTokenInfo]
]


class ControlScope(str, Enum):
    """The scope of robot control"""
    robot = 'robot'
