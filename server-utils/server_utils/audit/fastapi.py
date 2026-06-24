"""FastAPI-specific helpers for submitting audit log messages to audit-server."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Annotated, AsyncGenerator

import fastapi

from .audit_server import Client, LocalHTTPClient, NoOpClient
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

_log = logging.getLogger(__name__)

_audit_client_accessor = AppStateAccessor[Client]("audit_client")


def install_audit_client(app_state: AppState, client: Client) -> None:
    """Store a singleton audit `Client` in global server state for later retrieval.

    This should be called once during server initialization.
    """
    _audit_client_accessor.set_on(app_state, client)


def get_audit_client(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> Client:
    """A FastAPI dependency to retrieve the server's singleton audit `Client`.

    Endpoints can take this as a dependency to submit audit log messages.
    """
    client = _audit_client_accessor.get_from(app_state)
    assert client is not None, (
        "Forgot to initialize audit client as part of server startup?"
    )
    return client


@asynccontextmanager
async def build_audit_client(
    *,
    audit_server_uds: str | None = None,
    audit_server_url: str | None = None,
) -> AsyncGenerator[Client, None]:
    """Build an audit `Client` appropriately configured for most servers.

    `audit_server_uds` (a path to a Unix domain socket) or `audit_server_url` (a URL
    like http://localhost:1234) describes how to connect to audit-server. These should
    typically be taken from CLI options or environment variables. If neither is
    specified, a `NoOpClient` is returned that logs messages locally without
    contacting any server.
    """
    if audit_server_uds is None and audit_server_url is None:
        _log.info(
            "Not configured to talk to audit-server."
            " Audit log messages will only be logged locally."
            " (This is normal when CRS is not enabled)."
        )
        yield NoOpClient()

    else:
        async with LocalHTTPClient(
            audit_server_uds=audit_server_uds, audit_server_url=audit_server_url
        ) as client:
            yield client
