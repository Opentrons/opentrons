"""Tests for the audit-server FastAPI integration."""

from __future__ import annotations

import fastapi
import pytest
from starlette.testclient import TestClient

from server_utils.audit.audit_server import (
    AuditSettingsResponseData,
    Client,
    LocalHTTPClient,
    NoOpClient,
    SubmitAuditLogMessageData,
    SubmitAuditLogSuccessData,
)
from server_utils.audit.fastapi import (
    build_audit_client,
    get_audit_client,
    install_audit_client,
)


async def test_build_audit_client_no_config_yields_noop() -> None:
    """With no UDS or URL configured, `build_audit_client` should yield a `NoOpClient`."""
    async with build_audit_client() as client:
        assert isinstance(client, NoOpClient)


async def test_build_audit_client_with_uds_yields_local_http_client(
    tmp_path_factory: pytest.TempPathFactory,
) -> None:
    """With a UDS configured, `build_audit_client` should yield a `LocalHTTPClient`."""
    socket_path = tmp_path_factory.mktemp("audit") / "sock"
    async with build_audit_client(audit_server_uds=str(socket_path)) as client:
        assert isinstance(client, LocalHTTPClient)


async def test_build_audit_client_with_url_yields_local_http_client() -> None:
    """With a URL configured, `build_audit_client` should yield a `LocalHTTPClient`."""
    async with build_audit_client(audit_server_url="http://localhost:1234") as client:
        assert isinstance(client, LocalHTTPClient)


async def test_build_audit_client_rejects_both_uds_and_url(
    tmp_path_factory: pytest.TempPathFactory,
) -> None:
    """Passing both UDS and URL to `build_audit_client` should raise `ValueError`."""
    socket_path = tmp_path_factory.mktemp("audit") / "sock"
    with pytest.raises(ValueError):
        async with build_audit_client(
            audit_server_uds=str(socket_path),
            audit_server_url="http://localhost:1234",
        ):
            pass


def test_install_and_get_audit_client_via_dependency() -> None:
    """`install_audit_client` + `get_audit_client` should round-trip through FastAPI."""

    class StubClient(Client):
        async def submit_log_message(
            self, message: SubmitAuditLogMessageData
        ) -> SubmitAuditLogSuccessData:
            raise NotImplementedError()

        async def get_settings(self) -> AuditSettingsResponseData:
            raise NotImplementedError()

    stub_client = StubClient()

    app = fastapi.FastAPI()
    install_audit_client(app.state, stub_client)

    seen: dict[str, Client] = {}

    @app.get("/check")
    def check(
        client: Client = fastapi.Depends(get_audit_client),  # noqa: B008
    ) -> dict[str, str]:
        seen["client"] = client
        return {"ok": "ok"}

    with TestClient(app) as test_client:
        response = test_client.get("/check")
        assert response.status_code == 200

    assert seen["client"] is stub_client


def test_get_audit_client_without_install_raises() -> None:
    """`get_audit_client` should assert if no client has been installed."""
    app = fastapi.FastAPI()

    @app.get("/check")
    def check(
        client: Client = fastapi.Depends(get_audit_client),  # noqa: B008
    ) -> dict[str, str]:  # pragma: no cover - dependency assertion fires first
        return {"ok": "ok"}

    with TestClient(app, raise_server_exceptions=True) as test_client:
        with pytest.raises(AssertionError):
            test_client.get("/check")
