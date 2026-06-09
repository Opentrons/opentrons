"""Unit tests for the `/audit/internal/logMessage` route."""

from __future__ import annotations

import datetime
import json
from typing import Generator

import aiohttp
import pytest
from fastapi import FastAPI
from starlette.testclient import TestClient

from server_utils.keys.fastapi import install_key_client
from server_utils.keys.key_server import (
    Client as KeyClient,
)
from server_utils.keys.key_server import (
    SignedMessageData,
    SignMessageData,
)

from audit_server.log_ingest.router import router as ingest_router

_ENDPOINT_PATH = "/audit/internal/logMessage"

_CANNED_SIGNED_MESSAGE = SignedMessageData(
    message="<placeholder>",
    messageHash="sha256:ZmFrZQ==",
    messageSignature="ed25519:ZmFrZQ==",
    signatureVersion=1,
)


class StubKeyClient(KeyClient):
    """A hand-rolled mock of the key-server `Client`.

    Captures every call to `sign_message` in `calls` and, by default, returns
    `_CANNED_SIGNED_MESSAGE`. Setting `raise_on_sign` to an exception makes
    the next call raise that exception instead, simulating a key-server that's
    unreachable or otherwise broken.
    """

    def __init__(self) -> None:
        self.calls: list[SignMessageData] = []
        self.response: SignedMessageData = _CANNED_SIGNED_MESSAGE
        self.raise_on_sign: Exception | None = None

    async def sign_message(self, message: SignMessageData) -> SignedMessageData:
        self.calls.append(message)
        if self.raise_on_sign is not None:
            raise self.raise_on_sign
        return self.response


@pytest.fixture
def stub_key_client() -> StubKeyClient:
    """A fresh `StubKeyClient` for each test."""
    return StubKeyClient()


@pytest.fixture
def app(stub_key_client: StubKeyClient) -> FastAPI:
    """A minimal FastAPI app wired up with the log-ingest router and a stub key client."""
    app = FastAPI()
    install_key_client(app.state, stub_key_client)
    app.include_router(ingest_router)
    return app


@pytest.fixture
def client(app: FastAPI) -> Generator[TestClient, None, None]:
    """A starlette `TestClient` for the FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client


def _assert_loggedat_is_recent_utc_iso(value: object) -> datetime.datetime:
    """Assert ``value`` is an ISO-8601 UTC datetime near the current wall clock."""
    assert isinstance(value, str)
    parsed = datetime.datetime.fromisoformat(value)
    assert parsed.tzinfo is not None, f"loggedAt {value!r} must include tz info"
    assert parsed.utcoffset() == datetime.timedelta(0), (
        f"loggedAt {value!r} must be UTC"
    )
    # The route stamps loggedAt at request handling time; allow a generous skew so
    # the test isn't flaky on slow CI.
    now = datetime.datetime.now(datetime.timezone.utc)
    assert abs((now - parsed).total_seconds()) < 60, (
        f"loggedAt {value!r} is too far from now {now.isoformat()}"
    )
    return parsed


def test_full_request_body_forwarded_to_key_server(
    client: TestClient,
    stub_key_client: StubKeyClient,
) -> None:
    """The full request body must be serialized to JSON and forwarded to
    ``key_client.sign_message`` (along with the server-stamped ``loggedAt``)."""
    request_body = {
        "data": {
            "action": "run.start",
            "accountName": "alice",
            "legalName": "Alice Anderson",
            "message": "Started run abc-123",
            "reason": "Routine experiment",
        },
    }
    response = client.post(_ENDPOINT_PATH, json=request_body)

    assert response.status_code == 201, response.text

    assert len(stub_key_client.calls) == 1
    forwarded_arg = stub_key_client.calls[0]
    assert forwarded_arg.previousHash is None

    forwarded_payload = json.loads(forwarded_arg.message)
    # Every field from the request body must round-trip into what we ask the
    # key-server to sign.
    for key, value in request_body["data"].items():
        assert forwarded_payload[key] == value
    # The server also adds an ingest timestamp; verify it's a sensible value.
    _assert_loggedat_is_recent_utc_iso(forwarded_payload["loggedAt"])
    # Make sure nothing extra got smuggled in.
    assert set(forwarded_payload) == set(request_body["data"]) | {"loggedAt"}


def test_full_request_body_forwarded_with_null_reason(
    client: TestClient,
    stub_key_client: StubKeyClient,
) -> None:
    """A `reason: null` request body must round-trip through to the key-server
    payload as JSON `null` (not omitted)."""
    request_body = {
        "data": {
            "action": "run.start",
            "accountName": "alice",
            "legalName": "Alice Anderson",
            "message": "Started run abc-123",
            "reason": None,
        },
    }
    response = client.post(_ENDPOINT_PATH, json=request_body)

    assert response.status_code == 201, response.text

    assert len(stub_key_client.calls) == 1
    forwarded_payload = json.loads(stub_key_client.calls[0].message)
    assert "reason" in forwarded_payload
    assert forwarded_payload["reason"] is None


def test_non_ascii_utf8_message_forwarded_verbatim(
    client: TestClient,
    stub_key_client: StubKeyClient,
) -> None:
    """Non-ASCII characters that round-trip cleanly through UTF-8 must reach
    the key-server with their code points intact."""
    # Includes Latin diacritics, CJK ideographs, a zero-width joiner emoji
    # sequence, and a high-plane emoji to cover BMP + supplementary planes.
    non_ascii_message = "Démarrage du protocole №1: 实验开始 — 🧬👩‍🔬🚀 (β=½)"
    request_body = {
        "data": {
            "action": "run.start",
            "accountName": "élise",
            "legalName": "Élise Müller-中野",
            "message": non_ascii_message,
            "reason": "experimentación",
        },
    }
    response = client.post(_ENDPOINT_PATH, json=request_body)

    assert response.status_code == 201, response.text

    assert len(stub_key_client.calls) == 1
    forwarded_arg = stub_key_client.calls[0]
    forwarded_payload = json.loads(forwarded_arg.message)
    assert forwarded_payload["message"] == non_ascii_message
    assert forwarded_payload["accountName"] == "élise"
    assert forwarded_payload["legalName"] == "Élise Müller-中野"
    assert forwarded_payload["reason"] == "experimentación"
    # The serialized JSON we pass to the key-server must itself round-trip
    # losslessly through UTF-8, since the key-server hashes UTF-8 bytes.
    assert (
        forwarded_arg.message.encode("utf-8").decode("utf-8") == forwarded_arg.message
    )
    assert non_ascii_message in forwarded_arg.message


def test_returns_503_when_key_server_unavailable(
    client: TestClient,
    stub_key_client: StubKeyClient,
) -> None:
    """If the key-server cannot be contacted, the endpoint must return a
    well-formed HTTP 503 instead of crashing with a 500."""
    stub_key_client.raise_on_sign = aiohttp.ClientConnectionError("connection refused")

    request_body = {
        "data": {
            "action": "run.start",
            "accountName": "alice",
            "legalName": "Alice Anderson",
            "message": "Started run abc-123",
            "reason": None,
        },
    }
    response = client.post(_ENDPOINT_PATH, json=request_body)

    assert response.status_code == 503
    assert response.headers["content-type"].startswith("application/json")
    body = response.json()
    assert isinstance(body, dict)
    # FastAPI's standard error envelope: {"detail": "..."}.
    assert "detail" in body
    assert isinstance(body["detail"], str) and body["detail"]
    # The error message should clearly identify key-server as the cause so
    # the operator knows what to fix.
    assert "key-server" in body["detail"].lower()
    # And the stub really was called — proving we did try to reach the key
    # server before returning 503.
    assert len(stub_key_client.calls) == 1
