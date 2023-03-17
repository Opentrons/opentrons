"""HTTP API registration token logic."""
from fastapi import Header, Request, HTTPException, status, Depends
from uuid import UUID
import logging

from system_server.jwt import jwt_is_valid
from system_server.constants import REGISTRATION_AUDIENCE
from system_server.persistence import get_persistent_uuid

_log = logging.getLogger(__name__)


async def check_registration_token_header(
    request: Request,
    authenticationBearer: str = Header(
        ...,
        description="An authentication header bearing a token provided by the /system/register endpoint.",
    ),
    signing_key: UUID = Depends(get_persistent_uuid),
) -> None:
    """A header requirement that requests a registration token from /system/register."""
    _log.info(f"Verifying registration token: {authenticationBearer}")
    if not jwt_is_valid(
        signing_key=str(signing_key),
        token=authenticationBearer,
        audience=REGISTRATION_AUDIENCE,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Registration token invalid",
        )
    request.state.authentication_bearer = authenticationBearer


async def get_registration_token_header(request: Request) -> str:
    """Gets the registration token from a request."""
    assert isinstance(
        request.state.authentication_bearer, str
    ), "No authentication_bearer in request state; is endpoint properly configured?"

    return request.state.authentication_bearer
