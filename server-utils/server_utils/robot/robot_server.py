"""Bindings to robot server's HTTP API."""

from __future__ import annotations

import contextlib
import json
import logging
import typing
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import aiohttp
import pydantic

HEALTH_ENDPOINT_PATH = "health"
PROTOCOLS_ENDPOINT_PATH = "protocols"
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
        # If there is a current run we will see it in the links section of the response
        if response_json["links"]:
            current_run_path = response_json["links"]["current"]["href"]
            # Get the run data, there should be no circumstance where we have a link to a
            # current run but don't find one, but we'll handle it here
            try:
                run_data = next(
                    (run for run in response_json["data"] if run["current"])
                )
            except StopIteration:
                raise ActiveCurrentRunNotFoundError(
                    f"Could not find a current run even though {current_run_path}"
                    " is provided in current run links"
                )
            # Get the commands json
            async with self._session.get(current_run_path + "/commands") as response:
                commands_json = await response.json()
            response.raise_for_status()

            # Attempt to build a file name with the protocol name, defaulting back to protocol ID
            # and then run ID if we can't find any of them
            protocol_id = run_data.get("protocolId")
            if protocol_id is not None:
                async with self._session.get(
                    f"{PROTOCOLS_ENDPOINT_PATH}/{protocol_id}"
                ) as response:
                    response_json = await response.json()
                response.raise_for_status()
                try:
                    protocol_name = Path(response_json["data"]["files"][0]["name"]).stem
                except (IndexError, KeyError):
                    protocol_name = None
            else:
                protocol_name = None
            run_log_filename = _get_run_log_file_name(
                run_id=run_data["id"],
                protocol_id=protocol_id,
                protocol_name=protocol_name,
                timestamp_str=run_data["createdAt"],
            )

            run_details = {"data": run_data, "commands": commands_json}
            serialized_log = SerializedLog(
                serialized_json=json.dumps(run_details),
                filename=run_log_filename,
            )
        else:
            serialized_log = None
        return RobotCurrentRunLog(serialized_log=serialized_log)


def _get_run_log_file_name(
    run_id: str,
    protocol_id: str | None,
    protocol_name: str | None,
    timestamp_str: str,
) -> str:
    if protocol_name is not None:
        file_base_name = _sanitize_filename_component(protocol_name)
    elif protocol_id is not None:
        file_base_name = _sanitize_filename_component(protocol_id)
    else:
        file_base_name = _sanitize_filename_component(run_id)

    # In order to get the time stamp the same format as the robot server, we need
    # to change it back to an ISO format string, recreate it with 'milliseconds', and
    # then do the same sanitizing to the string.
    formatted_timestamp = (
        datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
        .replace(":", "_")
    )

    return f"{file_base_name}_{formatted_timestamp}.json"


def _sanitize_filename_component(input_str: str) -> str:
    """Ensure that the input string contains only filesystem-safe characters."""
    return "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in input_str)


class _StrictBaseModel(pydantic.BaseModel):
    model_config = {"strict": True}


class RobotNameandSerial(_StrictBaseModel):
    """Robot name and serial number received via the health endpoint."""

    name: str
    serial: typing.Optional[str]


@dataclass
class RobotCurrentRunLog:
    """The serialized run log data, if there is a current and active run."""

    serialized_log: SerializedLog | None


@dataclass
class SerializedLog:
    """The serialized run log and its filename if one could be resolved."""

    serialized_json: str
    filename: str


class ActiveCurrentRunNotFoundError(BaseException):
    """Error raised if there is supposed to be a current run but none can be found."""
