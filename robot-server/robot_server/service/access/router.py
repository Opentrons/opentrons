import secrets
from datetime import datetime
from starlette import status as status_codes
from fastapi import APIRouter

from robot_server.service.errors import RobotServerError
from robot_server.service.access import models as access
from robot_server.service.json_api import ErrorResponse, Error

router = APIRouter()


@router.get("/access/tokens",
            description="Get all created access tokens",
            response_model=access.MultipleAccessTokenResponse)
async def get_access_tokens() -> access.MultipleAccessTokenResponse:
    raise RobotServerError(status_code=status_codes.HTTP_501_NOT_IMPLEMENTED,
                           error=Error(title="Not implemented"))


@router.post("/access/tokens",
             description="Create an access token",
             response_model=access.AccessTokenResponse,
             status_code=status_codes.HTTP_201_CREATED)
async def create_access_token() -> access.AccessTokenResponse:
    token = secrets.token_urlsafe(nbytes=8)
    # TODO Store the token
    return access.AccessTokenResponse(
        data=access.ResponseDataModel.create(
            attributes=access.AccessTokenInfo(
                token=token,
                createdOn=datetime.utcnow()),
            resource_id=token,
        ))


@router.delete("/access/tokens/{access_token}",
               description="Delete an access token",
               response_model=access.AccessTokenResponse,
               responses={
                   status_codes.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
               })
async def delete_access_token(access_token: access.TokenType) \
        -> access.AccessTokenResponse:
    raise RobotServerError(status_code=status_codes.HTTP_501_NOT_IMPLEMENTED,
                           error=Error(title="Not implemented"))


@router.get("/access/controls/{scope}",
            description="Get access token in control of robot scope",
            response_model=access.AccessTokenResponse,
            responses={
                status_codes.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
            })
async def get_control(scope: access.ControlScope) \
        -> access.AccessTokenResponse:
    raise RobotServerError(status_code=status_codes.HTTP_501_NOT_IMPLEMENTED,
                           error=Error(title="Not implemented"))


@router.post("/access/controls/{scope}",
             description="Try to take control of a robot scope.",
             response_model=access.AccessTokenResponse,
             responses={
                status_codes.HTTP_409_CONFLICT: {"model": ErrorResponse},
             })
async def post_control(scope: access.ControlScope,
                       access_token: access.AccessTokenRequest) \
        -> access.AccessTokenResponse:
    raise RobotServerError(status_code=status_codes.HTTP_501_NOT_IMPLEMENTED,
                           error=Error(title="Not implemented"))


@router.put("/access/controls/{scope}/{token}",
            description="Forcibly take control of a robot scope.",
            response_model=access.AccessTokenResponse,
            responses={
                status_codes.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
            })
async def put_control(scope: access.ControlScope,
                      token: access.TokenType) \
        -> access.AccessTokenResponse:
    raise RobotServerError(status_code=status_codes.HTTP_501_NOT_IMPLEMENTED,
                           error=Error(title="Not implemented"))


@router.delete("/access/controls/{scope}/{token}",
               description="Release control of a robot scope.",
               response_model=access.AccessTokenResponse,
               responses={
                   status_codes.HTTP_404_NOT_FOUND: {"model": ErrorResponse},
               })
async def release_control(scope: access.ControlScope,
                          token: access.TokenType) \
        -> access.AccessTokenResponse:
    raise RobotServerError(status_code=status_codes.HTTP_501_NOT_IMPLEMENTED,
                           error=Error(title="Not implemented"))
