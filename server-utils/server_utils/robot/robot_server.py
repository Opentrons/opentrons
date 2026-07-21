"""Bindings to robot server's HTTP API."""

from __future__ import annotations

import contextlib
import logging
import typing
from abc import ABC, abstractmethod

import aiohttp
import pydantic

HEALTH_ENDPOINT_PATH = "health"

_log = logging.getLogger(__name__)


class Client(ABC):
    """An interface for a dependent server to get health information via robot-server."""

    @abstractmethod
    async def get_name_and_serial(self) -> RobotNameandSerial:
        """Get the name and serial number of the robot via the health endpoint."""
        pass


class LocalHTTPClient(Client):
    """A client implementation that talks to robot-server over a local HTTP connection."""

    def __init__(
        self,
        *,
        robot_server_uds: str | None = None,
        robot_server_url: str | None = None,
    ) -> None:
        """Construct the client.

        Params:
            robot_server_uds: e.g. `/path/to/socket`, to connect to robot-server via
                a Unix domain socket.
            robot_server_url: e.g. `http://localhost:1234`, to connect to robot-server
                via TCP.
        """
        if robot_server_uds is not None and robot_server_url is not None:
            raise ValueError(
                "Specify only one of robot_server_uds or robot_server_url."
            )

        if robot_server_uds is not None:
            connector = aiohttp.UnixConnector(path=robot_server_uds)
            session = aiohttp.ClientSession(
                connector=connector,
                # We're connecting over a Unix socket, so this URL is nonsensical,
                # but aiohttp seems to require it as a placeholder.
                # https://github.com/aio-libs/aiohttp/issues/11324.
                base_url="http://localhost",
                headers={"Opentrons-Version": "2"},
            )
        elif robot_server_url is not None:
            session = aiohttp.ClientSession(
                base_url=robot_server_url, headers={"Opentrons-Version": "2"}
            )
        else:
            raise ValueError("Specify robot_server_uds or robot_server_url.")

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
    async def get_name_and_serial(self) -> RobotNameandSerial:
        async with self._session.get(HEALTH_ENDPOINT_PATH) as response:
            response_json = await response.json()
        response.raise_for_status()
        return RobotNameandSerial(
            name=response_json["name"],
            serial=response_json["robot_serial"],
        )


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class RobotNameandSerial(_StrictBaseModel):
    """Robot name and serial number received via the health endpoint."""

    name: str
    serial: typing.Optional[str]
