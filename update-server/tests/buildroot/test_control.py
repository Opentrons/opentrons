"""test the buildroot endpoints in otupdate.common.control """

import json
import os

from aiohttp.test_utils import TestClient


async def test_health(test_cli: TestClient):
    resp = await test_cli.get("/server/update/health")
    assert resp.status == 200
    version_dict = json.load(
        open(os.path.join(os.path.dirname(__file__), "version.json"))
    )
    body = await resp.json()
    assert body == {
        "name": "opentrons-test",
        "updateServerVersion": version_dict["update_server_version"],
        "apiServerVersion": version_dict["opentrons_api_version"],
        "smoothieVersion": "unimplemented",
        "systemVersion": version_dict["buildroot_version"],
        "bootId": "dummy-boot-id-abc123",
        "capabilities": {
            "buildrootUpdate": "/server/update/begin",
            "restart": "/server/restart",
        },
        "serialNumber": "unknown",
    }
