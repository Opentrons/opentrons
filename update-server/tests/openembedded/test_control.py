"""test the openembedded endpoints in otupdate.common.control """

from typing import Dict

from aiohttp.test_utils import TestClient


async def test_health(test_cli: TestClient, version_dict: Dict[str, str]):
    resp = await test_cli.get("/server/update/health")
    assert resp.status == 200
    body = await resp.json()
    assert body == {
        "name": "opentrons-test",
        "updateServerVersion": version_dict["update_server_version"],
        "apiServerVersion": version_dict["opentrons_api_version"],
        "systemVersion": version_dict["openembedded_version"],
        "bootId": "dummy-boot-id-abc123",
        "capabilities": {
            "openembeddedUpdate": "/server/update/begin",
            "restart": "/server/restart",
        },
        "serialNumber": "unknown",
    }
