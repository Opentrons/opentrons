# TODO(mm, 2023-01-11): Port this to a Tavern test once
# https://github.com/taverntesting/tavern/issues/833 is resolved. We need to upload
# multiple files into the `files` field of the `POST /protocols` endpoint.


import os

import secrets
from pathlib import Path

from tests.integration.robot_client import RobotClient
from tests.integration.protocol_files import get_py_protocol, get_bundled_data


async def test_upload_protocols_with_bundled_data(
    ot2_server_base_url: str,
) -> None:
    """Test uploading data files with protocol."""
    async with RobotClient.make(
        base_url=ot2_server_base_url, version="*"
    ) as robot_client:
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
        response_data = response.json()["data"]
        assert response_data["files"] == [
            {"name": protocol_name, "role": "main"},
            {"name": csv_name, "role": "data"},
            {"name": txt_name, "role": "data"},
        ]
        protocol_id = response_data["id"]

        result = await robot_client.get_protocol(protocol_id=protocol_id)
        assert result.json()["data"]["files"] == [
            {"name": protocol_name, "role": "main"},
            {"name": csv_name, "role": "data"},
            {"name": txt_name, "role": "data"},
        ]
