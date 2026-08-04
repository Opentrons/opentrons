"""Tests for audit notes header extraction."""

from typing import Annotated

import pytest
from decoy import Decoy
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from server_utils.audit.audit_server import AuditSettingsResponseData, Client
from server_utils.audit.fastapi import (
    USER_NOTES_HEADER,
    get_supplied_user_notes,
    install_audit_client,
)


@pytest.fixture()
def mock_audit_client(decoy: Decoy) -> Client:
    return decoy.mock(cls=Client)


@pytest.fixture
def client(mock_audit_client: Client) -> TestClient:
    app = FastAPI()
    install_audit_client(app.state, mock_audit_client)

    @app.api_route("/notes", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
    async def read_notes(
        user_notes: Annotated[str | None, Depends(get_supplied_user_notes)],
    ) -> dict[str, str | None]:
        return {"userNotes": user_notes}

    return TestClient(app)


async def test_from_header(
    client: TestClient, decoy: Decoy, mock_audit_client: Client
) -> None:
    decoy.when(await mock_audit_client.get_settings()).then_return(
        AuditSettingsResponseData(
            requireReasonForInteraction=True, minLengthOfReasonForInteraction=None
        )
    )
    response = client.post(
        "/notes",
        headers={USER_NOTES_HEADER: "  audit note  "},
    )
    assert response.status_code == 200
    assert response.json() == {"userNotes": "audit note"}


async def test_from_header_on_delete(
    client: TestClient, decoy: Decoy, mock_audit_client: Client
) -> None:
    decoy.when(await mock_audit_client.get_settings()).then_return(
        AuditSettingsResponseData(
            requireReasonForInteraction=True, minLengthOfReasonForInteraction=None
        )
    )

    response = client.delete(
        "/notes",
        headers={USER_NOTES_HEADER: "delete reason"},
    )
    assert response.status_code == 200
    assert response.json() == {"userNotes": "delete reason"}


async def test_ignores_whitespace_only_header(
    client: TestClient, decoy: Decoy, mock_audit_client: Client
) -> None:
    decoy.when(await mock_audit_client.get_settings()).then_return(
        AuditSettingsResponseData(
            requireReasonForInteraction=True, minLengthOfReasonForInteraction=None
        )
    )
    response = client.post("/notes", headers={USER_NOTES_HEADER: "  "})
    assert response.status_code == 200
    assert response.json() == {"userNotes": None}


async def test_ignores_query_and_form(
    client: TestClient, decoy: Decoy, mock_audit_client: Client
) -> None:
    decoy.when(await mock_audit_client.get_settings()).then_return(
        AuditSettingsResponseData(
            requireReasonForInteraction=False, minLengthOfReasonForInteraction=None
        )
    )
    response = client.post(
        "/notes?userNotes=ignored",
        data={"userNotes": "ignored"},
    )
    assert response.status_code == 200
    assert response.json() == {"userNotes": None}


async def test_returns_none_for_get(
    client: TestClient, decoy: Decoy, mock_audit_client: Client
) -> None:
    decoy.when(await mock_audit_client.get_settings()).then_return(
        AuditSettingsResponseData(
            requireReasonForInteraction=True, minLengthOfReasonForInteraction=None
        )
    )
    response = client.get("/notes", headers={USER_NOTES_HEADER: "ignored"})
    assert response.status_code == 200
    assert response.json() == {"userNotes": None}


async def test_allows_missing_header_if_not_required(
    client: TestClient, decoy: Decoy, mock_audit_client: Client
) -> None:
    decoy.when(await mock_audit_client.get_settings()).then_return(
        AuditSettingsResponseData(
            requireReasonForInteraction=False, minLengthOfReasonForInteraction=None
        )
    )
    response = client.put("/notes", json={"data": "ignored"})
    assert response.status_code == 200
    assert response.json() == {"userNotes": None}


async def test_percent_encoding(
    client: TestClient, decoy: Decoy, mock_audit_client: Client
) -> None:
    """Clients percent-encode the header; the server must decode it."""
    decoy.when(await mock_audit_client.get_settings()).then_return(
        AuditSettingsResponseData(
            requireReasonForInteraction=True, minLengthOfReasonForInteraction=None
        )
    )
    response = client.post(
        "/notes",
        headers={USER_NOTES_HEADER: "line%201%0Aline%202%0A%F0%9F%A5%9F"},
    )
    assert response.status_code == 200
    assert response.json() == {"userNotes": "line 1\nline 2\n🥟"}


async def test_fails_if_missing_and_required(
    client: TestClient, decoy: Decoy, mock_audit_client: Client
) -> None:
    decoy.when(await mock_audit_client.get_settings()).then_return(
        AuditSettingsResponseData(
            requireReasonForInteraction=True, minLengthOfReasonForInteraction=None
        )
    )
    response = client.put("/notes", json={"data": "ignored"})
    assert response.status_code == 451


async def test_passes_if_length_required_and_met(
    client: TestClient, decoy: Decoy, mock_audit_client: Client
) -> None:
    decoy.when(await mock_audit_client.get_settings()).then_return(
        AuditSettingsResponseData(
            requireReasonForInteraction=True, minLengthOfReasonForInteraction=25
        )
    )
    response = client.get("/notes", headers={USER_NOTES_HEADER: "a" * 26})
    assert response.status_code == 200


async def test_fails_if_length_required_and_not_met(
    client: TestClient, decoy: Decoy, mock_audit_client: Client
) -> None:
    decoy.when(await mock_audit_client.get_settings()).then_return(
        AuditSettingsResponseData(
            requireReasonForInteraction=True, minLengthOfReasonForInteraction=25
        )
    )
    response = client.get("/notes", headers={USER_NOTES_HEADER: "a" * 24})
    assert response.status_code == 200
