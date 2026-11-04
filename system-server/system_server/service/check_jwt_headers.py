"""HTTP API registration token logic."""

import logging
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header, HTTPException, Request, status

from system_server.constants import AUTHORIZATION_AUDIENCE, REGISTRATION_AUDIENCE
from system_server.jwt import jwt_is_valid
from system_server.persistence import get_persistent_uuid

_log = logging.getLogger(__name__)


async def check_registration_token_header(
    request: Request,
    authenticationBearer: Annotated[
        str,
        Header(
            description="An authentication header bearing a token provided by the `/system/register` endpoint.",
        ),
    ],
    signing_key: Annotated[UUID, Depends(get_persistent_uuid)],
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


async def get_registration_token_header(
    request: Request,
    _check_token: Annotated[None, Depends(check_registration_token_header)],
) -> str:
    """Gets the registration token from a request."""
    assert isinstance(request.state.authentication_bearer, str), (
        "No authentication_bearer in request state; is endpoint properly configured?"
    )

    return request.state.authentication_bearer


async def check_authorization_token_header(
    request: Request,
    authenticationBearer: Annotated[
        str,
        Header(
            description="An authentication header bearing a token provided by the `/system/authorize` endpoint.",
        ),
    ],
    signing_key: Annotated[UUID, Depends(get_persistent_uuid)],
) -> None:
    """A header requirement that requests a authorization token from /system/authorize."""
    _log.info(f"Verifying authorization token: {authenticationBearer}")
    if not jwt_is_valid(
        signing_key=str(signing_key),
        token=authenticationBearer,
        audience=AUTHORIZATION_AUDIENCE,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authorization token invalid",
        )
    request.state.authorization_authentication_bearer = authenticationBearer


async def get_authorization_token_header(
    request: Request,
    _check_token: Annotated[None, Depends(check_authorization_token_header)],
) -> str:
    """Gets the authorization token from a request."""
    assert isinstance(request.state.authorization_authentication_bearer, str), (
        "No authorization_authentication_bearer in request state; is endpoint properly configured?"
    )

    return request.state.authorization_authentication_bearer
