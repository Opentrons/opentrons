from mock import patch
import pytest
from http import HTTPStatus

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
def test_api_versioning(api_client, headers, expected_version):
    resp = api_client.get("/settings", headers=headers)
    assert resp.headers.get(API_VERSION_HEADER) == str(expected_version)
    assert resp.headers.get(MIN_API_VERSION_HEADER) == str(MIN_API_VERSION)


@pytest.fixture
def mock_log_control():
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
def test_api_versioning_non_versions_endpoints(api_client, path, mock_log_control):
    del api_client.headers["Opentrons-Version"]
    resp = api_client.get(path)
    assert resp.headers.get(API_VERSION_HEADER) == str(API_VERSION)
    assert resp.status_code != HTTPStatus.BAD_REQUEST


def test_api_version_too_low(api_client):
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
def test_api_version_missing(api_client, path):
    """It should reject any request without an version header."""
    del api_client.headers["Opentrons-Version"]
    resp = api_client.get(path)

    assert resp.status_code == HTTPStatus.UNPROCESSABLE_ENTITY
