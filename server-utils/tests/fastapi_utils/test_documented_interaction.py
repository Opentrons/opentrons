"""Tests for non–JSON:API ``userNotes`` extraction."""

from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from server_utils.fastapi_utils.documented_interaction import get_supplied_user_notes


def _build_client() -> TestClient:
    app = FastAPI()

    @app.api_route("/notes", methods=["GET", "POST", "PUT", "PATCH"])
    async def read_notes(
        user_notes: Annotated[str | None, Depends(get_supplied_user_notes)],
    ) -> dict[str, str | None]:
        return {"userNotes": user_notes}

    return TestClient(app)


def test_get_supplied_user_notes_from_query() -> None:
    client = _build_client()
    response = client.post("/notes?userNotes=audit%20note")
    assert response.status_code == 200
    assert response.json() == {"userNotes": "audit note"}


def test_get_supplied_user_notes_from_multipart_form() -> None:
    client = _build_client()
    response = client.post(
        "/notes",
        data={"userNotes": "  form note  "},
    )
    assert response.status_code == 200
    assert response.json() == {"userNotes": "form note"}


def test_get_supplied_user_notes_ignores_whitespace_only_query() -> None:
    client = _build_client()
    response = client.post("/notes?userNotes=%20%20")
    assert response.status_code == 200
    assert response.json() == {"userNotes": None}


def test_get_supplied_user_notes_returns_none_for_get() -> None:
    client = _build_client()
    response = client.get("/notes?userNotes=ignored")
    assert response.status_code == 200
    assert response.json() == {"userNotes": None}


def test_get_supplied_user_notes_returns_none_without_notes() -> None:
    client = _build_client()
    response = client.put("/notes", json={"data": "ignored"})
    assert response.status_code == 200
    assert response.json() == {"userNotes": None}
