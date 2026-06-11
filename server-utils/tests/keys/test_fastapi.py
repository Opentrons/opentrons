"""Tests for the key-server FastAPI integration."""

from __future__ import annotations

import fastapi
import pytest
from starlette.testclient import TestClient

from server_utils.keys.fastapi import (
    build_key_client,
    get_key_client,
    install_key_client,
)
from server_utils.keys.key_server import (
    Client,
    LocalHTTPClient,
    SignedMessageData,
    SignMessageData,
)


async def test_build_key_client_with_uds_yields_local_http_client(
    tmp_path_factory: pytest.TempPathFactory,
) -> None:
    """With a UDS configured, `build_key_client` should yield a `LocalHTTPClient`."""
    socket_path = tmp_path_factory.mktemp("keys") / "sock"
    async with build_key_client(key_server_uds=str(socket_path)) as client:
        assert isinstance(client, LocalHTTPClient)


async def test_build_key_client_with_url_yields_local_http_client() -> None:
    """With a URL configured, `build_key_client` should yield a `LocalHTTPClient`."""
    async with build_key_client(key_server_url="http://localhost:1234") as client:
        assert isinstance(client, LocalHTTPClient)


async def test_build_key_client_rejects_both_uds_and_url(
    tmp_path_factory: pytest.TempPathFactory,
) -> None:
    """Passing both UDS and URL to `build_key_client` should raise `ValueError`."""
    socket_path = tmp_path_factory.mktemp("keys") / "sock"
    with pytest.raises(ValueError):
        async with build_key_client(
            key_server_uds=str(socket_path),
            key_server_url="http://localhost:1234",
        ):
            pass


async def test_build_key_client_rejects_no_args() -> None:
    """Passing neither UDS nor URL to `build_key_client` should raise `ValueError`.

    Unlike the audit-server client there is no no-op fallback, so calling
    ``build_key_client()`` with no transport configured must fail loudly.
    """
    with pytest.raises(ValueError):
        async with build_key_client():
            pass


def test_install_and_get_key_client_via_dependency() -> None:
    """`install_key_client` + `get_key_client` should round-trip through FastAPI."""

    class StubClient(Client):
        async def sign_message(
            self, message: SignMessageData
        ) -> SignedMessageData:  # pragma: no cover - not exercised here
            raise NotImplementedError

    stub_client = StubClient()

    app = fastapi.FastAPI()
    install_key_client(app.state, stub_client)

    seen: dict[str, Client] = {}

    @app.get("/check")
    def check(
        client: Client = fastapi.Depends(get_key_client),  # noqa: B008
    ) -> dict[str, str]:
        seen["client"] = client
        return {"ok": "ok"}

    with TestClient(app) as test_client:
        response = test_client.get("/check")
        assert response.status_code == 200

    assert seen["client"] is stub_client


def test_get_key_client_without_install_raises() -> None:
    """`get_key_client` should assert if no client has been installed."""
    app = fastapi.FastAPI()

    @app.get("/check")
    def check(
        client: Client = fastapi.Depends(get_key_client),  # noqa: B008
    ) -> dict[str, str]:  # pragma: no cover - dependency assertion fires first
        return {"ok": "ok"}

    with TestClient(app, raise_server_exceptions=True) as test_client:
        with pytest.raises(AssertionError):
            test_client.get("/check")
