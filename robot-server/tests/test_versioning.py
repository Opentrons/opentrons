"""Tests for API versioning logic.

These tests are to ensure API versioning plays nicely with FastAPI. Header
and response tests are in `tests/integration/test_version_headers.tavern.yaml`.
"""
import pytest
from fastapi import FastAPI, APIRouter, Request, Depends
from fastapi.testclient import TestClient
from typing import Dict

from robot_server.errors import exception_handlers
from robot_server.versioning import API_VERSION, check_version_header


@pytest.fixture
def app() -> FastAPI:
    """Get a FastAPI application."""
    return FastAPI(exception_handlers=exception_handlers)


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    """Get a TestClient for the FastAPI application fixture."""
    return TestClient(app)


def test_check_version_headers(app: FastAPI, client: TestClient) -> None:
    """It should put Opentrons-Version header in request state."""

    @app.get("/foobar")
    def _get_foobar(
        request: Request,
        _: None = Depends(check_version_header),
    ) -> Dict[str, str]:
        assert request.state.api_version == 2
        return {"hello": "world"}

    result = client.get("/foobar", headers={"Opentrons-Version": "2"})
    assert result.status_code == 200


def test_set_version_headers_on_route(app: FastAPI, client: TestClient) -> None:
    """It should set version state with a route dependency."""
    router = APIRouter(dependencies=[Depends(check_version_header)])

    @router.get("/foobar")
    def _get_foobar(request: Request) -> Dict[str, str]:
        assert request.state.api_version == 2
        return {"hello": "world"}

    app.include_router(router)

    result = client.get("/foobar", headers={"Opentrons-Version": "2"})
    assert result.status_code == 200


def test_uses_latest_available_version(app: FastAPI, client: TestClient) -> None:
    """It should set state according to the latest available version.

    A client may request a later version than is available, and the server
    should let that client know it's responding with an earlier version.
    """

    @app.get("/foobar")
    def _get_foobar(
        request: Request,
        _: None = Depends(check_version_header),
    ) -> Dict[str, str]:
        assert request.state.api_version == API_VERSION
        return {"hello": "world"}

    result = client.get("/foobar", headers={"Opentrons-Version": "1337"})
    assert result.status_code == 200
