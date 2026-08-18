"""Bindings to auth-server's HTTP API.

This is just the bare minimum required by resource servers.
"""

from __future__ import annotations

import contextlib
import typing
from abc import ABC, abstractmethod

import aiohttp

from .types import (
    AdminCredsSettingsResponse,
    AuthSettingsResponse,
    ClientIDType,
    TokenIntrospectionRequestFormData,
    TokenIntrospectionResponse,
)

SETTINGS_ENDPOINT_PATH = "auth/settings/accessControlEnabled"
ALL_AUTH_SETTINGS_ENDPOINT_PATH = "auth/settings"
TOKEN_ENDPOINT_PATH = "auth/oauth2/token"
TOKEN_INTROSPECTION_ENDPOINT_PATH = "auth/oauth2/introspect"


# The hard-coded client_id that auth-server expects in certain OAuth 2 requests.
#
# todo(mm, 2026-02-19): It may be a bug in oauthlib, or auth-server's usage of oa uthlib,
# that the token introspection endpoint absolutely requires a client_id. If it is a bug,
# we should find a fix or workaround contained to auth-server, and not provide a client_id
# in our requests here. If it isn't, we should use a client_id separate from the
# Opentrons App, like "opentrons_resource_server" or something.
CLIENT_ID: ClientIDType = "opentrons_app"


class Client(ABC):
    """An interface for a resource server to query the Opentrons auth-server."""

    @abstractmethod
    async def get_auth_settings(self) -> AuthSettingsResponse:
        """Ask the Opentrons auth-server what the current system-wide auth settings are.

        If there's an internal error (e.g. the auth server is unconnectable),
        the implementation should raise it as an exception.
        """
        pass

    @abstractmethod
    async def get_admin_creds_settings(self) -> AdminCredsSettingsResponse:
        """Ask the Opentrons auth-server for the requireAdminCreds* flags.

        If there's an internal error (e.g. the auth server is unconnectable),
        the implementation should raise it as an exception.
        """
        pass

    @abstractmethod
    async def introspect_token(self, token: str) -> TokenIntrospectionResponse:
        """Ask the Opentrons auth-server for information about an access token.

        If there's an internal error (e.g. the auth server is unconnectable),
        the implementation should raise it as an exception.
        """
        pass


class LocalHTTPClient(Client):
    """A client implementation that talks to auth-server over a local HTTP connection."""

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
            session = aiohttp.ClientSession(
                connector=connector,
                # We're connecting over a Unix socket, so this URL is nonsensical,
                # but aiohttp seems to require it as a placeholder.
                # https://github.com/aio-libs/aiohttp/issues/11324.
                base_url="http://localhost",
            )
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

    @typing.override
    async def get_auth_settings(self) -> AuthSettingsResponse:
        async with self._session.get(SETTINGS_ENDPOINT_PATH) as response:
            response_bytes = await response.read()
        response.raise_for_status()
        parsed_response = AuthSettingsResponse.model_validate_json(response_bytes)
        return parsed_response

    @typing.override
    async def get_admin_creds_settings(self) -> AdminCredsSettingsResponse:
        async with self._session.get(ALL_AUTH_SETTINGS_ENDPOINT_PATH) as response:
            response_bytes = await response.read()
        response.raise_for_status()
        return AdminCredsSettingsResponse.model_validate_json(response_bytes)

    @typing.override
    async def introspect_token(self, token: str) -> TokenIntrospectionResponse:
        request_form_data: TokenIntrospectionRequestFormData = {
            "token": token,
            "client_id": CLIENT_ID,
        }

        async with self._session.post(
            TOKEN_INTROSPECTION_ENDPOINT_PATH, data=request_form_data
        ) as response:
            response_bytes = await response.read()
        response.raise_for_status()
        parsed_response = TokenIntrospectionResponse.model_validate_json(response_bytes)
        return parsed_response
