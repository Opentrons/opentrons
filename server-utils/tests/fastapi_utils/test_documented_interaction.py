"""Tests for audit notes header extraction."""

from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from server_utils.fastapi_utils.documented_interaction import (
    USER_NOTES_HEADER,
    get_supplied_user_notes,
)


def _build_client() -> TestClient:
    app = FastAPI()

    @app.api_route("/notes", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    async def read_notes(
        user_notes: Annotated[str | None, Depends(get_supplied_user_notes)],
    ) -> dict[str, str | None]:
        return {"userNotes": user_notes}

    return TestClient(app)


def test_get_supplied_user_notes_from_header() -> None:
    client = _build_client()
    response = client.post(
        "/notes",
        headers={USER_NOTES_HEADER: "  audit note  "},
    )
    assert response.status_code == 200
    assert response.json() == {"userNotes": "audit note"}


def test_get_supplied_user_notes_from_header_on_delete() -> None:
    client = _build_client()
    response = client.delete(
        "/notes",
        headers={USER_NOTES_HEADER: "delete reason"},
    )
    assert response.status_code == 200
    assert response.json() == {"userNotes": "delete reason"}


def test_get_supplied_user_notes_ignores_whitespace_only_header() -> None:
    client = _build_client()
    response = client.post("/notes", headers={USER_NOTES_HEADER: "  "})
    assert response.status_code == 200
    assert response.json() == {"userNotes": None}


def test_get_supplied_user_notes_ignores_query_and_form() -> None:
    client = _build_client()
    response = client.post(
        "/notes?userNotes=ignored",
        data={"userNotes": "ignored"},
    )
    assert response.status_code == 200
    assert response.json() == {"userNotes": None}


def test_get_supplied_user_notes_returns_none_for_get() -> None:
    client = _build_client()
    response = client.get("/notes", headers={USER_NOTES_HEADER: "ignored"})
    assert response.status_code == 200
    assert response.json() == {"userNotes": None}


def test_get_supplied_user_notes_returns_none_without_header() -> None:
    client = _build_client()
    response = client.put("/notes", json={"data": "ignored"})
    assert response.status_code == 200
    assert response.json() == {"userNotes": None}


def test_get_supplied_user_notes_percent_encoding() -> None:
    """Clients percent-encode the header; the server must decode it."""
    client = _build_client()
    response = client.post(
        "/notes",
        headers={USER_NOTES_HEADER: "line%201%0Aline%202%0A%F0%9F%A5%9F"},
    )
    assert response.status_code == 200
    assert response.json() == {"userNotes": "line 1\nline 2\n🥟"}
