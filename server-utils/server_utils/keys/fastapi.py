"""FastAPI-specific helpers for talking to key-server."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Annotated, AsyncGenerator

import fastapi

from .key_server import Client, LocalHTTPClient
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

_key_client_accessor = AppStateAccessor[Client]("key_client")


def install_key_client(app_state: AppState, client: Client) -> None:
    """Store a singleton key-server `Client` in global server state for later retrieval.

    This should be called once during server initialization.
    """
    _key_client_accessor.set_on(app_state, client)


def get_key_client(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> Client:
    """A FastAPI dependency to retrieve the server's singleton key-server `Client`.

    Endpoints can take this as a dependency to sign log messages.
    """
    client = _key_client_accessor.get_from(app_state)
    assert client is not None, (
        "Forgot to initialize key client as part of server startup?"
    )
    return client


@asynccontextmanager
async def build_key_client(
    *,
    key_server_uds: str | None = None,
    key_server_url: str | None = None,
) -> AsyncGenerator[Client, None]:
    """Build a key-server `Client` appropriately configured for most servers.

    `key_server_uds` (a path to a Unix domain socket) or `key_server_url` (a URL
    like http://localhost:1234) describes how to connect to key-server. These should
    typically be taken from CLI options or environment variables. Exactly one of
    them must be specified; unlike the audit-server client there is no no-op
    fallback, because callers that rely on signed log messages must fail loudly
    rather than silently dropping signatures.
    """
    async with LocalHTTPClient(
        key_server_uds=key_server_uds, key_server_url=key_server_url
    ) as client:
        yield client
