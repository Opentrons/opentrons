"""test the openembedded endpoints in otupdate.common.control """

from typing import Dict

# Avoid pytest trying to collect TestClient because it begins with "Test".
from aiohttp.test_utils import TestClient as HTTPTestClient

from decoy import Decoy

from otupdate.common.name_management import NameSynchronizer


async def test_health(
    test_cli: HTTPTestClient,
    version_dict: Dict[str, str],
    mock_name_synchronizer: NameSynchronizer,
    decoy: Decoy,
):
    decoy.when(await mock_name_synchronizer.get_name()).then_return("test name")
    resp = await test_cli.get("/server/update/health")
    assert resp.status == 200
    body = await resp.json()
    assert body == {
        "name": "test name",
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
