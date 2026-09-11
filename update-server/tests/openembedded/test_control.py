"""test the openembedded endpoints in otupdate.common.control"""

import asyncio
from typing import Dict
from unittest import mock

from decoy import Decoy

from tests.http_client import UpdateServerClient

from otupdate.common.name_management import NameSynchronizer
from otupdate.common.update_actions import UpdateActionsInterface


async def test_health(
    test_cli: UpdateServerClient,
    version_dict: Dict[str, str],
    mock_name_synchronizer: NameSynchronizer,
    decoy: Decoy,
):
    decoy.when(await mock_name_synchronizer.get_name()).then_return("test name")
    resp = await test_cli.get("/server/update/health")
    assert resp.status_code == 200
    body = resp.json()
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
    assert resp.headers["Access-Control-Allow-Origin"] == "*"


async def test_shutdown(test_cli: UpdateServerClient, monkeypatch) -> None:
    """It should shut down the robot"""
    shutdown_mock = mock.Mock()
    actions_mock = mock.Mock(shutdown=shutdown_mock)

    monkeypatch.setattr(
        UpdateActionsInterface, "from_app_state", lambda app_state: actions_mock
    )
    resp = await test_cli.post("/server/shutdown")

    assert resp.status_code == 200
    assert resp.json() == {"message": "Shutting down in 1s"}
    assert not shutdown_mock.called
    await asyncio.sleep(1.01)
    assert shutdown_mock.called
