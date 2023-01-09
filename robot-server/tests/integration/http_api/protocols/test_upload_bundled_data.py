import os

import secrets
from pathlib import Path

from tests.integration.dev_server import DevServer
from tests.integration.robot_client import RobotClient
from tests.integration.protocol_files import get_py_protocol, get_bundled_data


async def test_upload_protocols_with_bundled_data() -> None:
    """Test uploading data files with protocol."""
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

            with get_py_protocol(secrets.token_urlsafe(16)) as protocol:
                with get_bundled_data(".csv") as csv:
                    with get_bundled_data(".txt") as txt:
                        protocol_name = os.path.basename(protocol.name)
                        csv_name = os.path.basename(csv.name)
                        txt_name = os.path.basename(txt.name)
                        response = await robot_client.post_protocol(
                            [Path(protocol.name), Path(csv.name), Path(txt.name)]
                        )
            assert response.status_code == 201
            assert response.json()["data"]["files"] == [
                {"name": protocol_name, "role": "main"},
                {"name": csv_name, "role": "data"},
                {"name": txt_name, "role": "data"},
            ]

            result = await robot_client.get_protocols()
            assert result.json()["data"][0]["files"] == [
                {"name": protocol_name, "role": "main"},
                {"name": csv_name, "role": "data"},
                {"name": txt_name, "role": "data"},
            ]
