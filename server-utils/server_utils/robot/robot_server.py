"""Bindings to robot server's HTTP API."""

from __future__ import annotations

import contextlib
import json
import logging
import typing
from abc import ABC, abstractmethod
from dataclasses import dataclass

import aiohttp
import pydantic

HEALTH_ENDPOINT_PATH = "health"
RUNS_ENDPOINT_PATH = "runs"

_log = logging.getLogger(__name__)


class Client(ABC):
    """An interface for a dependent server to get health information via robot-server."""

    @abstractmethod
    async def get_name_and_serial(self) -> RobotNameandSerial:
        """Get the name and serial number of the robot via the health endpoint."""
        pass

    @abstractmethod
    async def get_current_run_log(self) -> RobotCurrentRunLog:
        """If there is a current run, get it's run log data, else return with None."""
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

    @typing.override
    async def get_current_run_log(self) -> RobotCurrentRunLog:
        async with self._session.get(RUNS_ENDPOINT_PATH) as response:
            response_json = await response.json()
        response.raise_for_status()
        if response_json["links"]:
            current_run_path = response_json["links"]["current"]["href"]
            try:
                run_data = next(
                    (run for run in response_json["data"] if run["current"])
                )
            except StopIteration:
                raise NoRunFoundError(
                    f"Could not find a current run even though {current_run_path}"
                    " is provided in current run links"
                )
            async with self._session.get(current_run_path + "/commands") as response:
                response_json = await response.json()
            response.raise_for_status()
            run_details = {"data": run_data, "commands": response_json}
            serialized_log = json.dumps(run_details)
        else:
            serialized_log = None
        return RobotCurrentRunLog(serialized_log=serialized_log)


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class RobotNameandSerial(_StrictBaseModel):
    """Robot name and serial number received via the health endpoint."""

    name: str
    serial: typing.Optional[str]


@dataclass
class RobotCurrentRunLog:
    """The serialized run log, if there is a current and active run."""

    serialized_log: str | None


class NoRunFoundError(BaseException):
    """Error raised if there is supposed to be a current run but none can be found."""
