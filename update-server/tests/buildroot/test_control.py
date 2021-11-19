""" test the endpoints in otupdate.buildroot.control """

import asyncio
import json
import os
from unittest import mock

from otupdate.buildroot import control


async def test_health(test_cli):
    resp = await test_cli.get("/server/update/health")
    assert resp.status == 200
    body = await resp.json()
    assert body["name"] == "opentrons-test"
    version_dict = json.load(
        open(os.path.join(os.path.dirname(__file__), "version.json"))
    )
    assert body["updateServerVersion"] == version_dict["update_server_version"]
    assert body["apiServerVersion"] == version_dict["opentrons_api_version"]
    assert body["smoothieVersion"] == "unimplemented"
    assert body["systemVersion"] == version_dict["buildroot_version"]
    assert body["bootId"] == "dummy-boot-id-abc123"


async def test_restart(test_cli, monkeypatch):
    restart_mock = mock.Mock()
    monkeypatch.setattr(control, "_do_restart", restart_mock)
    resp = await test_cli.post("/server/restart")
    assert resp.status == 200
    assert not restart_mock.called
    await asyncio.sleep(1.01)
    assert restart_mock.called
