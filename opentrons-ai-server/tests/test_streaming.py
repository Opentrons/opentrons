"""Unit tests for streaming API endpoints."""

import json
from typing import Generator

import pytest
from api.handler.fast import app, auth
from api.models.user import User
from fastapi.testclient import TestClient


@pytest.fixture
def fake_user() -> User:
    """Minimal User for dependency override."""
    return User(
        aud="test",
        azp="test",
        exp=9999999999,
        iat=0,
        iss="https://test.example/",
        sub="test-user-id",
    )


@pytest.fixture
def client_with_auth(fake_user: User) -> Generator[TestClient, None, None]:
    """TestClient with auth overridden to return fake_user."""

    async def override_verify() -> User:
        return fake_user

    app.dependency_overrides[auth.verify] = override_verify
    try:
        with TestClient(app) as c:
            yield c
    finally:
        app.dependency_overrides.pop(auth.verify, None)


@pytest.mark.unit
def test_update_protocol_stream_accepts_fake_request(client_with_auth: TestClient) -> None:
    """Ensure update-protocol streaming endpoint is reachable and returns valid SSE for fake requests (no LLM)."""
    body = {
        "prompt": "Add a step",
        "protocol_text": "def run(protocol): pass",
        "regenerate": False,
        "update_type": "other",
        "update_details": "add step",
        "fake": True,
    }
    response = client_with_auth.post(
        "/api/chat/update-protocol/stream",
        json=body,
        headers={"Authorization": "Bearer test-token", "Content-Type": "application/json"},
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")
    text = response.text
    assert "data: " in text
    # Fake response is one event: data: {"delta": "...", "done": true}
    assert "delta" in text or "done" in text
    # Should be valid JSON in the event
    for line in text.strip().split("\n"):
        if line.startswith("data: "):
            payload = json.loads(line[6:])
            assert "delta" in payload or "done" in payload
            break


@pytest.mark.unit
def test_create_protocol_stream_accepts_fake_request(client_with_auth: TestClient) -> None:
    """Ensure create-protocol streaming endpoint is reachable and returns valid SSE for fake requests (no LLM)."""
    body = {
        "prompt": "Make a PCR protocol",
        "regenerate": False,
        "scientific_application_type": "pcr",
        "description": "PCR",
        "robots": "opentrons_flex",
        "mounts": ["left"],
        "flexGripper": False,
        "modules": [],
        "labware": [],
        "liquids": [],
        "steps": [],
        "fake": True,
    }
    response = client_with_auth.post(
        "/api/chat/create-protocol/stream",
        json=body,
        headers={"Authorization": "Bearer test-token", "Content-Type": "application/json"},
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")
    assert "data: " in response.text
    assert "delta" in response.text or "done" in response.text


@pytest.mark.unit
def test_completion_stream_accepts_fake_request(client_with_auth: TestClient) -> None:
    """Ensure completion streaming endpoint is reachable and returns valid SSE for fake requests (no LLM)."""
    body = {
        "message": "Hello",
        "history": None,
        "fake": True,
        "fake_key": None,
        "chat_options": "update",
        "protocol_format": "Python",
    }
    response = client_with_auth.post(
        "/api/chat/completion/stream",
        json=body,
        headers={"Authorization": "Bearer test-token", "Content-Type": "application/json"},
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")
    assert "data: " in response.text
    assert "delta" in response.text or "done" in response.text
