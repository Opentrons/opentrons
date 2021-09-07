"""Tests for the /health router."""
from mock import MagicMock
from starlette.testclient import TestClient

from opentrons import __version__
from opentrons.protocol_api import MAX_SUPPORTED_VERSION, MIN_SUPPORTED_VERSION


def test_get_health(api_client: TestClient, hardware: MagicMock) -> None:
    """Test GET /health."""
    hardware.fw_version = "FW111"
    hardware.board_revision = "BR2.1"

    expected = {
        "name": "opentrons-dev",
        "api_version": __version__,
        "fw_version": "FW111",
        "board_revision": "BR2.1",
        "logs": ["/logs/serial.log", "/logs/api.log", "/logs/server.log"],
        "system_version": "0.0.0",
        "minimum_protocol_api_version": list(MIN_SUPPORTED_VERSION),
        "maximum_protocol_api_version": list(MAX_SUPPORTED_VERSION),
        "links": {
            "apiLog": "/logs/api.log",
            "serialLog": "/logs/serial.log",
            "serverLog": "/logs/server.log",
            "apiSpec": "/openapi.json",
            "systemTime": "/system/time",
        },
    }

    resp = api_client.get("/health")
    text = resp.json()
    assert resp.status_code == 200
    assert text == expected
