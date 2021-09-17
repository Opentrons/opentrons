import pytest
from mock import MagicMock, patch
from http import HTTPStatus
from fastapi.testclient import TestClient
from typing import Dict, Iterator

from robot_server.constants import (
    API_VERSION_HEADER,
    MIN_API_VERSION_HEADER,
    API_VERSION,
    API_VERSION_LATEST,
    MIN_API_VERSION,
)


@pytest.mark.parametrize(
    argnames=["headers", "expected_version"],
    argvalues=[
        [
            {API_VERSION_HEADER: str(API_VERSION)},
            API_VERSION,
        ],
        [
            {API_VERSION_HEADER: str(API_VERSION + 3)},
            API_VERSION,
        ],
        [
            {API_VERSION_HEADER: str(API_VERSION_LATEST)},
            API_VERSION,
        ],
    ],
)
def test_api_versioning(
    api_client: TestClient,
    headers: Dict[str, str],
    expected_version: int,
) -> None:
    resp = api_client.get("/settings", headers=headers)
    assert resp.headers.get(API_VERSION_HEADER) == str(expected_version)
    assert resp.headers.get(MIN_API_VERSION_HEADER) == str(MIN_API_VERSION)


@pytest.fixture
def mock_log_control() -> Iterator[MagicMock]:
    with patch("opentrons.system.log_control.get_records_dumb") as p:
        p.return_value = b""
        yield p


@pytest.mark.parametrize(
    argnames="path",
    argvalues=[
        "/openapi.json",
        "/redoc",
        "/docs",
        "/logs/serial.log",
        "/logs/api.log",
        "/logs/some-random-journald-thing",
        "/",
    ],
)
def test_api_versioning_non_versions_endpoints(
    api_client: TestClient,
    path: str,
    mock_log_control: MagicMock,
) -> None:
    del api_client.headers["Opentrons-Version"]
    resp = api_client.get(path)
    assert resp.headers.get(API_VERSION_HEADER) == str(API_VERSION)
    assert resp.status_code != HTTPStatus.BAD_REQUEST


def test_api_version_too_low(api_client: TestClient) -> None:
    """It should reject any API version lower than 2."""
    resp = api_client.get("/settings", headers={API_VERSION_HEADER: "1"})

    assert resp.status_code == HTTPStatus.BAD_REQUEST
    assert resp.headers.get(API_VERSION_HEADER) == str(API_VERSION)
    assert resp.json()["errors"] == [
        {
            "id": "OutdatedAPIVersion",
            "title": "Requested HTTP API version no longer supported",
            "detail": (
                "HTTP API version 1 is no longer supported. Please upgrade "
                "your Opentrons App or other HTTP API client."
            ),
        }
    ]


@pytest.mark.parametrize(
    argnames="path",
    argvalues=[
        "/sessions",
        "/protocols",
        "/system/time",
        "/calibration/pipette_offset",
        "/calibration/tip_length",
    ],
)
def test_api_version_missing(api_client: TestClient, path: str) -> None:
    """It should reject any request without an version header."""
    del api_client.headers["Opentrons-Version"]
    resp = api_client.get(path)

    assert resp.status_code == HTTPStatus.UNPROCESSABLE_ENTITY
