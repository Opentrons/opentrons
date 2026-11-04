"""test the openembedded endpoints in otupdate.common.control"""

import asyncio
from typing import Dict
from unittest import mock

# Avoid pytest trying to collect TestClient because it begins with "Test".
from aiohttp.test_utils import TestClient as HTTPTestClient
from decoy import Decoy

from otupdate.common import control
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
            "systemUpdate": "/server/update/begin",
            "restart": "/server/restart",
            "shutdown": "/server/shutdown",
        },
        "serialNumber": "unknown",
        "robotModel": "OT-3 Standard",
    }


async def test_shutdown(test_cli: HTTPTestClient, monkeypatch) -> None:
    """It should shut down the robot"""
    shutdown_mock = mock.Mock()

    monkeypatch.setattr(control, "_do_shutdown", shutdown_mock)
    resp = await test_cli.post("/server/shutdown")

    assert resp.status == 200
    assert await resp.json() == {"message": "Shutting down in 1s"}
    assert not shutdown_mock.called
    await asyncio.sleep(1.01)
    assert shutdown_mock.called
