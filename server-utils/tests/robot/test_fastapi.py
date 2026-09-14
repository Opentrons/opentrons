"""Tests for the robot-server FastAPI integration."""

from __future__ import annotations

import fastapi
import pytest
from starlette.testclient import TestClient

from server_utils.robot.fastapi import (
    build_robot_client,
    get_robot_client,
    install_robot_server_client,
)
from server_utils.robot.robot_server import (
    Client,
    LocalHTTPClient,
    RobotCurrentRunLog,
    RobotNameandSerial,
)


async def test_build_robot_client_with_uds_yields_local_http_client(
    tmp_path_factory: pytest.TempPathFactory,
) -> None:
    """With a UDS configured, `build_robot_client` should yield a `LocalHTTPClient`."""
    socket_path = tmp_path_factory.mktemp("robot") / "sock"
    async with build_robot_client(robot_server_uds=str(socket_path)) as client:
        assert isinstance(client, LocalHTTPClient)


async def test_build_robot_client_with_url_yields_local_http_client() -> None:
    """With a URL configured, `build_robot_client` should yield a `LocalHTTPClient`."""
    async with build_robot_client(robot_server_url="http://localhost:1234") as client:
        assert isinstance(client, LocalHTTPClient)


async def test_build_robot_client_rejects_both_uds_and_url(
    tmp_path_factory: pytest.TempPathFactory,
) -> None:
    """Passing both UDS and URL to `build_robot_client` should raise `ValueError`."""
    socket_path = tmp_path_factory.mktemp("robot") / "sock"
    with pytest.raises(ValueError):
        async with build_robot_client(
            robot_server_uds=str(socket_path),
            robot_server_url="http://localhost:1234",
        ):
            pass


async def test_build_robot_client_rejects_no_args() -> None:
    """Passing neither UDS nor URL to `build_robot_client` should raise `ValueError`."""
    with pytest.raises(ValueError):
        async with build_robot_client():
            pass


def test_install_and_get_robot_client_via_dependency() -> None:
    """`install_robot_client` + `get_robot_client` should round-trip through FastAPI."""

    class StubClient(Client):
        async def get_name_and_serial(self) -> RobotNameandSerial:
            raise NotImplementedError

        async def get_current_run_log(self) -> RobotCurrentRunLog:
            raise NotImplementedError

    stub_client = StubClient()

    app = fastapi.FastAPI()
    install_robot_server_client(app.state, stub_client)

    seen: dict[str, Client] = {}

    @app.get("/check")
    def check(
        client: Client = fastapi.Depends(get_robot_client),  # noqa: B008
    ) -> dict[str, str]:
        seen["client"] = client
        return {"ok": "ok"}

    with TestClient(app) as test_client:
        response = test_client.get("/check")
        assert response.status_code == 200

    assert seen["client"] is stub_client


def test_get_robot_client_without_install_raises() -> None:
    """`get_robot_client` should assert if no client has been installed."""
    app = fastapi.FastAPI()

    @app.get("/check")
    def check(
        client: Client = fastapi.Depends(get_robot_client),  # noqa: B008
    ) -> dict[str, str]:  # pragma: no cover - dependency assertion fires first
        return {"ok": "ok"}

    with TestClient(app, raise_server_exceptions=True) as test_client:
        with pytest.raises(AssertionError):
            test_client.get("/check")
