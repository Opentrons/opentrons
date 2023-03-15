from aiohttp import ClientSession
from fastapi import Header, Depends, status
from typing import Union
from typing_extensions import Literal

from robot_server.errors import ErrorDetails
from robot_server.util import call_once
from robot_server.versioning import get_requested_version

_AUTH_TOKEN_MIN_VERSION = 5

_SYSTEM_SERVER_BASE_URL = "http://localhost:32950"


class AuthenticationFailed(ErrorDetails):
    """An error if authentication token appears invalid."""

    id: Literal["AuthenticationFailed"] = "AuthenticationFailed"
    title: str = "Authentication Bearer authentication failed."


class SystemServerConnectionError(ErrorDetails):
    """An error if the system server cannot be found, and is required."""

    id: Literal["SystemServerConnectionError"] = "SystemServerConnectionError"
    title: str = "System Server connection error, cannot authenticate."


@call_once
async def _get_system_server_client() -> ClientSession:
    """Get a singleton client connection to the system server."""
    try:
        return ClientSession()
    except Exception as e:
        raise SystemServerConnectionError(detail=str(e)).as_error(
            status.HTTP_403_FORBIDDEN
        )


async def check_auth_token_header(
    authenticationBearer: Union[str, None] = Header(
        None, description="Authentication token for the client."
    ),
    version: int = Depends(get_requested_version),
) -> None:
    """Get the request's auth token header and verify authenticity."""
    if version < _AUTH_TOKEN_MIN_VERSION:
        return

    if authenticationBearer is None:
        raise AuthenticationFailed(detail="No token provided.").as_error(
            status.HTTP_403_FORBIDDEN
        )

    # Don't get the client until checking the version header so we're sure that
    # the server should actually exist.
    connection = await _get_system_server_client()

    res = await connection.get(
        f"{_SYSTEM_SERVER_BASE_URL}/system/authorize",
        headers={"authenticationBearer": authenticationBearer},
    )

    if res.status != 200:
        raise AuthenticationFailed(detail="Authentication token invalid.").as_error(
            status.HTTP_403_FORBIDDEN
        )
