import os

import pytest
import secrets
from typing import Callable, IO
from pathlib import Path

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient
from tests.integration.protocol_files import get_py_protocol, get_json_protocol


async def test_upload_protocols_and_reset_persistence_dir() -> None:
    """Test protocol and analysis persistence.

    Uploaded protocols and their completed analyses should remain constant across
    server restarts.
    """
    port = "15555"
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

            with get_py_protocol(secrets.token_urlsafe(16)) as file:
                await robot_client.post_protocol([Path(file.name)])

            with get_json_protocol(secrets.token_urlsafe(16)) as file:
                await robot_client.post_protocol([Path(file.name)])

            await robot_client.post_setting_reset_options({"runsHistory": True})

            result = await robot_client.get_protocols()

            assert result.json()["data"]
            assert os.listdir(f"{server.persistence_directory}/protocols/")

            server.stop()
            assert await robot_client.wait_until_dead(), "Dev Robot did not stop."

            server.start()

            assert (
                await robot_client.wait_until_alive()
            ), "Dev Robot never became available."

            result = await robot_client.get_protocols()

            assert result.json()["data"] == []
            assert os.listdir(f"{server.persistence_directory}/protocols/") == []

            server.stop()
