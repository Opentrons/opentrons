"""FastAPI-specific helpers for talking to robot-server."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Annotated, AsyncGenerator

import fastapi

from .robot_server import Client, LocalHTTPClient
from server_utils.fastapi_utils.app_state import (
    AppState,
    AppStateAccessor,
    get_app_state,
)

_robot_server_client_accessor = AppStateAccessor[Client]("robot_server_client")


def install_robot_server_client(app_state: AppState, client: Client) -> None:
    """Store a singleton robot_server `Client` in global server state for later retrieval.

    This should be called once during server initialization.
    """
    _robot_server_client_accessor.set_on(app_state, client)


def get_robot_client(
    app_state: Annotated[AppState, fastapi.Depends(get_app_state)],
) -> Client:
    """A FastAPI dependency to retrieve the server's singleton robot-server `Client`.

    Endpoints can take this as a dependency to get robot health information.
    """
    client = _robot_server_client_accessor.get_from(app_state)
    assert client is not None, (
        "Forgot to initialize robot-server client as part of server startup?"
    )
    return client


@asynccontextmanager
async def build_robot_client(
    *,
    robot_server_uds: str | None = None,
    robot_server_url: str | None = None,
) -> AsyncGenerator[Client, None]:
    """Build a robot-server `Client` appropriately configured for most servers. """
    async with LocalHTTPClient(
        robot_server_uds=robot_server_uds, robot_server_url=robot_server_url
    ) as client:
        yield client
