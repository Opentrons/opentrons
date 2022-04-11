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
    server = DevServer(port=port)
    async with RobotClient.make(
        host="http://localhost", port=port, version="*"
    ) as robot_client:
        if await robot_client.alive():
            assert False, "A dev robot may NOT already be running when this test runs."
        server.start()
        assert await robot_client.wait_until_alive(
            6
        ), "Dev Robot never became available."
        protocols_to_create = 13
        for _ in range(protocols_to_create):
            with protocol(secrets.token_urlsafe(16)) as file:
                await robot_client.post_protocol([Path(file.name)])
        response = await robot_client.get_protocols()
        uploaded_ids_created_at = [
            (protocol["id"], protocol["createdAt"])
            for protocol in response.json()["data"]
        ]
        server.stop()
        assert await robot_client.wait_until_dead(12), "Dev Robot did not stop."
        server.start()
        assert await robot_client.wait_until_alive(
            6
        ), "Dev Robot never became available."
        response = await robot_client.get_protocols()
        restarted_ids_created_at = [
            (protocol["id"], protocol["createdAt"])
            for protocol in response.json()["data"]
        ]
        # The number of uploaded protocols prior to restart
        # equals the number of protocols in the get protocols response after restart.
        assert len(response.json()["data"]) == protocols_to_create
        # The set of (id,createdAt) after restart is the same as prior to restart.
        # The union of the sets accomplishes this order ignored comparison.
        assert (
            len(set(uploaded_ids_created_at) & set(restarted_ids_created_at))
            == protocols_to_create
        )
        server.stop()
