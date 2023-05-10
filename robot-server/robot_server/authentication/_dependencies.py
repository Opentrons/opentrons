from aiohttp.client import ClientSession
from aiohttp.client_exceptions import ClientConnectionError
from fastapi import Header, Depends, status, Request
from typing import Union
from typing_extensions import Literal

from robot_server.errors import ErrorDetails
from robot_server.settings import get_settings
from server_utils.util import call_once
from robot_server.versioning import get_requested_version

_AUTH_TOKEN_MIN_VERSION = 5


class AuthenticationFailed(ErrorDetails):
    """An error if authentication token appears invalid."""

    id: Literal["AuthenticationFailed"] = "AuthenticationFailed"
    title: str = "Authentication Bearer authentication failed."


@call_once
async def _get_system_server_client() -> ClientSession:
    """Get a singleton client connection to the system server."""
    try:
        # TODO: The version of aiohttp we are using lacks type annotations,
        # so we have to ignore mypy complaining about the initializer of this
        # class.
        return ClientSession()  # type: ignore
    except Exception as e:
        raise AuthenticationFailed(detail=str(e)).as_error(status.HTTP_502_BAD_GATEWAY)


@call_once
async def _get_system_server_address() -> str:
    """Dependency to get the system server address from the settings file."""
    return get_settings().system_server_address

def _should_check_auth(request: Request) -> bool:
    """Filters whether an auth token actually needs to be checked based on the endpoint."""
    if request.method == 'GET':
        return False
    return True
    

async def check_auth_token_header(
    request: Request,
    authenticationBearer: Union[str, None] = Header(
        None, description="Authentication token for the client."
    ),
    version: int = Depends(get_requested_version),
) -> None:
    """Get the request's auth token header and verify authenticity."""
    if version < _AUTH_TOKEN_MIN_VERSION:
        return
    
    if not _should_check_auth(request):
        return

    if authenticationBearer is None:
        raise AuthenticationFailed(detail="No authentication token provided.").as_error(
            status.HTTP_403_FORBIDDEN
        )
    system_server_addr = await _get_system_server_address()

    # Don't get the client until checking the version header so we're sure that
    # the server should actually exist.
    connection = await _get_system_server_client()

    try:
        res = await connection.get(
            f"{system_server_addr}/system/authorize",
            headers={"authenticationBearer": authenticationBearer},
        )

        if res.status != 200:
            raise AuthenticationFailed(detail="Authentication token invalid.").as_error(
                status.HTTP_403_FORBIDDEN
            )
    except ClientConnectionError as e:
        raise AuthenticationFailed(detail=str(e)).as_error(status.HTTP_403_FORBIDDEN)
