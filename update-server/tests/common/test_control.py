"""test the endpoints in otupdate.common.control"""

import asyncio
from typing import Tuple
from unittest import mock

# Avoid pytest trying to collect TestClient because it begins with "Test".
from aiohttp.test_utils import TestClient as HTTPTestClient

from otupdate.common.update_actions import UpdateActionsInterface


async def test_restart(test_cli: Tuple[HTTPTestClient, str], monkeypatch) -> None:
    """It should restart the robot"""
    restart_mock = mock.Mock()
    actions_mock = mock.Mock(restart=restart_mock)

    monkeypatch.setattr(
        UpdateActionsInterface, "from_request", lambda request: actions_mock
    )
    resp = await test_cli[0].post("/server/restart")

    assert resp.status == 200
    assert await resp.json() == {"message": "Restarting in 1s"}
    assert not restart_mock.called
    await asyncio.sleep(1.01)
    assert restart_mock.called
