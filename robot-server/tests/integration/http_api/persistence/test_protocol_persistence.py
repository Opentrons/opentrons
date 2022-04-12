from pathlib import Path
import secrets
from typing import IO, Callable

import pytest

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient
from tests.integration.protocol_files import get_py_protocol, get_json_protocol


@pytest.mark.parametrize("protocol", [(get_py_protocol), (get_json_protocol)])
async def test_protocols_persist(protocol: Callable[[str], IO[bytes]]) -> None:
    """Test that json and python protocols are persisted through dev server restart."""
    port = "15555"
    async with RobotClient.make(
        host="http://localhost", port=port, version="*"
    ) as robot_client:
        assert await robot_client.wait_until_dead(
            12
        ), "Dev Robot is running and must not be."
        with DevServer(port=port) as server:
            server.start()
            assert await robot_client.wait_until_alive(
                10
            ), "Dev Robot never became available."

            protocols_to_create = 13
            for _ in range(protocols_to_create):
                with protocol(secrets.token_urlsafe(16)) as file:
                    await robot_client.post_protocol([Path(file.name)])

            response = await robot_client.get_protocols()
            uploaded_protocols = response.json()["data"]

            server.stop()
            assert await robot_client.wait_until_dead(12), "Dev Robot did not stop."

            server.start()
            assert await robot_client.wait_until_alive(
                10
            ), "Dev Robot never became available."

            response = await robot_client.get_protocols()
            restarted_protocols = response.json()["data"]


            # The number of uploaded protocols prior to restart equals the number
            # of protocols in the get protocols response after restart.
            assert len(restarted_protocols) == protocols_to_create

            # The protocols after restart are the same as prior to restart,
            # except we don't care about analyses,
            # and we don't care about order.
            for p in uploaded_protocols:
                del p["analyses"]
            for p in restarted_protocols:
                del p["analyses"]
            uploaded_protocols.sort(key=lambda p: p["id"])
            restarted_protocols.sort(key=lambda p: p["id"])

            server.stop()
