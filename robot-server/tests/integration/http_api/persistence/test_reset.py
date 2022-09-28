import os

import secrets
from pathlib import Path

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient
from tests.integration.protocol_files import get_py_protocol, get_json_protocol


async def test_upload_protocols_and_reset_persistence_dir(free_port: str) -> None:
    """Test resetting runs history.

    Immediately after resetting runs history, existing resources should remain
    available over HTTP.

    But after restarting the server, those resources should be gone.
    """
    port = free_port
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

            assert len(result.json()["data"]) == 2

            # TODO(mm, 2022-09-08): This can erroneously pass if something other than
            # our software creates a file in this directory, like if macOS creates
            # .DS_Store.
            assert os.listdir(f"{server.persistence_directory}/protocols/")

            server.stop()
            assert await robot_client.wait_until_dead(), "Dev Robot did not stop."

            server.start()

            assert (
                await robot_client.wait_until_alive()
            ), "Dev Robot never became available."

            # Now that we've reset and restarted, the protocols should be gone.
            # TODO(mm, 2022-09-08): We should also test that *runs* are cleared.
            result = await robot_client.get_protocols()
            assert result.json()["data"] == []
            assert os.listdir(f"{server.persistence_directory}/protocols/") == []

            server.stop()
