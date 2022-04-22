from pathlib import Path
import secrets
from typing import IO, Callable

import pytest
import robot_server
from tests.integration.commands import set_rail_lights

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient
from tests.integration.protocol_files import get_py_protocol, get_json_protocol


async def test_run_persistence() -> None:
    """Upload a python protocol and 2 custom labware files.

    Protocol and labware are persisted on server restart.
    """
    port = "15556"
    async with RobotClient.make(
        host="http://localhost", port=port, version="*"
    ) as robot_client:
        assert (
            await robot_client.wait_until_dead()
        ), "Dev Robot is running and must not be."
        with DevServer(port=port) as server:
            server.start()
            assert (
                await robot_client.wait_until_alive()
            ), "Dev Robot never became available."
            # create a run as a side effect of issuing a command
            # response = await robot_client.post_commands(set_rail_lights(True))
            # print(response.text)
            # assert response.status_code == 201
            response = await robot_client.post_runs()
            server.stop()
            assert await robot_client.wait_until_dead(), "Dev Robot did not stop."

            server.start()
            assert (
                await robot_client.wait_until_alive()
            ), "Dev Robot never became available."
            response = await robot_client.get_runs()
            server.stop()