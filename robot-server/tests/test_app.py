"""Tests for FastAPI application object of the robot server."""

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from robot_server.versioning import API_VERSION, API_VERSION_HEADER


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
) -> None:
    """It should not enforce versioning requirements on some endpoints."""
    del api_client.headers["Opentrons-Version"]
    resp = api_client.get(path, follow_redirects=False)
    assert resp.status_code != status.HTTP_422_UNPROCESSABLE_ENTITY
    assert resp.headers.get(API_VERSION_HEADER) == str(API_VERSION)
