"""Bindings to auth-server's HTTP API.

This is just the bare minimum required by resource servers.
"""

from __future__ import annotations

import contextlib
import typing

import aiohttp
import pydantic

SETTINGS_ENDPOINT_PATH = "auth/settings"
TOKEN_ENDPOINT_PATH = "auth/oauth2/token"
TOKEN_INTROSPECTION_ENDPOINT_PATH = "auth/oauth2/introspect"


_CLIENT_ID: ClientIDType = "opentrons_app"
"""The hard-coded client_id that auth-server expects in certain OAuth 2 requests.

todo(mm, 2026-02-19): It may be a bug in oauthlib, or auth-server's usage of oauthlib,
that the token introspection endpoint absolutely requires a client_id. If it is a bug,
we should find a fix or workaround contained to auth-server, and not provide a client_id
in our requests here. If it isn't, we should use a client_id separate from the
Opentrons App, like "opentrons_resource_server" or something.
"""
ClientIDType: typing.TypeAlias = typing.Literal["opentrons_app"]


class Client:
    """A client to interact with auth-server."""

    def __init__(
        self, *, auth_server_uds: str | None = None, auth_server_url: str | None = None
    ) -> None:
        """Construct the client.

        Params:
            auth_server_uds: e.g. `/path/to/socket`, to connect to auth-server via
                a Unix domain socket.
            auth_server_url: e.g. `http://localhost:1234`, to connect to auth-server via
                TCP.
        """
        if auth_server_uds is not None and auth_server_url is not None:
            raise ValueError("Specify only one of auth_server_uds or auth_server_url.")

        if auth_server_uds is not None:
            connector = aiohttp.UnixConnector(path=auth_server_uds)
            session = aiohttp.ClientSession(connector=connector)
        elif auth_server_url is not None:
            session = aiohttp.ClientSession(base_url=auth_server_url)
        else:
            raise ValueError("Specify auth_server_uds or auth_server_url.")

        self._session = session
        self._exit_stack = contextlib.AsyncExitStack()

    async def __aenter__(self) -> typing.Self:
        """When entered as a context manager, open the underlying connection."""
        await self._exit_stack.enter_async_context(self._session)
        return self

    async def __aexit__(
        self, exc_type: object, exc_value: object, traceback: object
    ) -> None:
        """When exited as a context manager, close the underlying connection."""
        await self._exit_stack.aclose()

    async def get_auth_settings(self) -> AuthSettingsResponse:
        """Ask the auth server what the current system-wide auth settings are."""
        async with self._session.get(SETTINGS_ENDPOINT_PATH) as response:
            response_bytes = await response.read()
        response.raise_for_status()
        parsed_response = AuthSettingsResponse.model_validate_json(response_bytes)
        return parsed_response

    async def introspect_token(self, token: str) -> TokenIntrospectionResponse:
        """Ask the auth server for information about an access token."""
        request_form_data: TokenIntrospectionRequestFormData = {
            "token": token,
            "client_id": _CLIENT_ID,
        }

        async with self._session.post(
            TOKEN_INTROSPECTION_ENDPOINT_PATH, data=request_form_data
        ) as response:
            response_bytes = await response.read()
        response.raise_for_status()
        parsed_response = TokenIntrospectionResponse.model_validate_json(response_bytes)
        return parsed_response


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class TokenIntrospectionResponse(_StrictBaseModel):
    """A response body from auth-server's token introspection endpoint.

    This is specified by https://datatracker.ietf.org/doc/html/rfc7662#section-2.2.
    """

    active: bool
    scope: str = ""


class TokenIntrospectionRequestFormData(typing.TypedDict):
    """Form data for a request to auth-server's token introspection endpoint.

    This is specified by https://datatracker.ietf.org/doc/html/rfc7662#section-2.1.
    """

    token: str

    client_id: ClientIDType


class AuthSettingsResponse(_StrictBaseModel):
    """A response body from auth-server's settings endpoint."""

    data: AuthSettingsResponseData


class AuthSettingsResponseData(_StrictBaseModel):
    """Response body data from auth-server's settings endpoint."""

    accessControlEnabled: bool
