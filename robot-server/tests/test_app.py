"""Tests for FastAPI application object of the robot server."""
import pytest
from mock import MagicMock, patch
from fastapi import status
from fastapi.testclient import TestClient
from typing import Iterator

from robot_server.versioning import API_VERSION_HEADER, API_VERSION


@pytest.fixture
def mock_log_control() -> Iterator[MagicMock]:
    """Patch out the log retrieval logic."""
    with patch("opentrons.system.log_control.get_records_dumb") as p:
        p.return_value = b""
        yield p


@pytest.mark.parametrize(
    argnames="path",
    argvalues=[
        "/logs/serial.log",
        "/logs/api.log",
        "/logs/server.log",
        "/logs/combined_api_server.log",
        "/",
    ],
)
def test_api_versioning_non_versions_endpoints(
    api_client: TestClient,
    path: str,
    mock_log_control: MagicMock,
) -> None:
    """It should not enforce versioning requirements on some endpoints."""
    del api_client.headers["Opentrons-Version"]
    resp = api_client.get(path)
    assert resp.status_code != status.HTTP_422_UNPROCESSABLE_ENTITY
    assert resp.headers.get(API_VERSION_HEADER) == str(API_VERSION)
