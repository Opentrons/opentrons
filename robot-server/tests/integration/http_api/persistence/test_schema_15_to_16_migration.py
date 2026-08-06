"""Integration test: persistence at DB schema 15 migrates cleanly to schema 16."""

from __future__ import annotations

from pathlib import Path
from shutil import copytree
from tempfile import TemporaryDirectory

import pytest

from tests.integration.dev_server import DevServer
from tests.integration.http_api.persistence.persistence_snapshots_dir import (
    PERSISTENCE_SNAPSHOTS_DIR,
)
from tests.integration.robot_client import RobotClient

pytestmark = [pytest.mark.slow, pytest.mark.integration]

_STARTUP_TIMEOUT = 60
_PORT = "15556"

_SNAPSHOT_VERSION = "schema_15_minimal_for_v16_migration"


def _snapshot_copy() -> Path:
    source = PERSISTENCE_SNAPSHOTS_DIR / _SNAPSHOT_VERSION
    assert source.is_dir(), f"Missing persistence snapshot at {source}"
    dest = Path(TemporaryDirectory().name) / _SNAPSHOT_VERSION
    copytree(src=source, dst=dest)
    return dest


@pytest.mark.asyncio
async def test_schema_15_persistence_migrates_boolean_settings_to_v16() -> None:
    """Boot robot-server against a schema-15 DB and verify extended boolean settings survive.

    Covers error recovery, access-control defaults for new schema-16 keys, and legacy
    GET /camera enablement flags (same rows in ``boolean_setting_extended``).
    """
    persistence_dir = _snapshot_copy()
    async with RobotClient.make(
        base_url=f"http://localhost:{_PORT}", version="*"
    ) as robot_client:
        assert await robot_client.dead(), "Dev Robot is running and must not be."
        with DevServer(port=_PORT, persistence_directory=persistence_dir) as server:
            server.start()
            await robot_client.wait_until_ready(_STARTUP_TIMEOUT)

            er = await robot_client.httpx_client.get(
                url=f"{robot_client.base_url}/errorRecovery/settings"
            )
            er.raise_for_status()
            assert er.json()["data"]["enabled"] is False

            ac = await robot_client.httpx_client.get(
                url=f"{robot_client.base_url}/accessControl/settings"
            )
            ac.raise_for_status()
            assert ac.json()["data"] == {
                "requireSignoffForProtocolLog": True,
                "requireLogsToBeSavedInApp": True,
                "deleteOverMaxOnDiskProtocols": True,
            }

            cam = await robot_client.httpx_client.get(
                url=f"{robot_client.base_url}/camera"
            )
            cam.raise_for_status()
            assert cam.json() == {
                "cameraEnabled": True,
                "liveStreamEnabled": False,
                "errorRecoveryCameraEnabled": True,
            }
