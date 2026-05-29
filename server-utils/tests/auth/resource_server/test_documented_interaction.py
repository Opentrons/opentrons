"""Tests for documented interaction audit handling on ``AuthorizationChecker``."""

import logging
from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from decoy import Decoy
from pydantic import BaseModel

from server_utils.auth.resource_server.auth_server import (
    AuthSettingsResponse,
    AuthSettingsResponseData,
    Client,
    RequireReasonForInteractionSettingsResponse,
    RequireReasonForInteractionSettingsResponseData,
)
from server_utils.auth.resource_server.authorization_checker import (
    AlwaysAllowedAuthorizationChecker,
    AuthServerAuthorizationChecker,
    DocumentedInteraction,
    MissingUserNotesError,
)
from server_utils.fastapi_utils.models.json_api import RequestModel


class _ExampleRequestData(BaseModel):
    action: str


@pytest.mark.asyncio
async def test_record_documented_interaction_uses_explicit_require_reason_flag(
    decoy: Decoy,
) -> None:
    """When ``require_reason_for_interaction`` is passed, settings are not queried."""
    mock_client = decoy.mock(cls=Client)
    subject = AuthServerAuthorizationChecker(mock_client)

    await subject.record_documented_interaction(
        DocumentedInteraction(
            user_notes="note", request_data=_ExampleRequestData(action="play")
        ),
        resource_id="run-1",
        recorded_at=datetime(year=2024, month=1, day=1),
        require_reason_for_interaction=False,
    )
    decoy.verify(
        await mock_client.get_require_reason_for_interaction_settings(), times=0
    )


@pytest.mark.asyncio
async def test_record_documented_interaction_skips_when_not_required() -> None:
    """No notes are required when require-reason-for-interaction is disabled."""
    subject = AlwaysAllowedAuthorizationChecker()
    await subject.record_documented_interaction(
        DocumentedInteraction(
            user_notes=None, request_data=_ExampleRequestData(action="play")
        ),
        resource_id="run-1",
        recorded_at=datetime(year=2024, month=1, day=1),
    )


@pytest.mark.asyncio
async def test_record_documented_interaction_raises_when_notes_missing(
    decoy: Decoy,
) -> None:
    """Missing user notes are rejected when require-reason-for-interaction is on."""
    mock_client = decoy.mock(cls=Client)
    subject = AuthServerAuthorizationChecker(mock_client)
    decoy.when(await mock_client.get_auth_settings()).then_return(
        AuthSettingsResponse(data=AuthSettingsResponseData(accessControlEnabled=True))
    )
    decoy.when(
        await mock_client.get_require_reason_for_interaction_settings()
    ).then_return(
        RequireReasonForInteractionSettingsResponse(
            data=RequireReasonForInteractionSettingsResponseData(
                requireReasonForInteraction=True
            )
        )
    )

    with pytest.raises(MissingUserNotesError):
        await subject.record_documented_interaction(
            DocumentedInteraction(
                user_notes=None, request_data=_ExampleRequestData(action="play")
            ),
            resource_id="run-1",
            recorded_at=datetime(year=2024, month=1, day=1),
        )


@pytest.mark.asyncio
async def test_record_documented_interaction_writes_audit_log(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """When notes are required and supplied, an audit log entry is emitted."""
    subject = AlwaysAllowedAuthorizationChecker()
    audit_logger = "server_utils.auth.resource_server.authorization_checker"
    with (
        patch.object(
            subject,
            "is_reason_for_interaction_required",
            new=AsyncMock(return_value=True),
        ),
        caplog.at_level(logging.INFO, logger=audit_logger),
    ):
        await subject.record_documented_interaction(
            DocumentedInteraction(
                user_notes="audit note",
                request_data=_ExampleRequestData(action="play"),
            ),
            resource_id="run-1",
            recorded_at=datetime(year=2024, month=1, day=1),
        )

    assert any(
        "Documented interaction" in record.message and "run-1" in record.message
        for record in caplog.records
    )


@pytest.mark.asyncio
async def test_record_documented_interaction_accepts_notes_from_request_model(
    decoy: Decoy,
) -> None:
    """``DocumentedInteraction.from_request_model`` records payload data and header notes."""
    mock_client = decoy.mock(cls=Client)
    subject = AuthServerAuthorizationChecker(mock_client)
    decoy.when(await mock_client.get_auth_settings()).then_return(
        AuthSettingsResponse(data=AuthSettingsResponseData(accessControlEnabled=True))
    )
    decoy.when(
        await mock_client.get_require_reason_for_interaction_settings()
    ).then_return(
        RequireReasonForInteractionSettingsResponse(
            data=RequireReasonForInteractionSettingsResponseData(
                requireReasonForInteraction=True
            )
        )
    )

    request = RequestModel[_ExampleRequestData](
        data=_ExampleRequestData(action="play"),
    )
    await subject.record_documented_interaction(
        DocumentedInteraction.from_request_model(
            request,
            user_notes="audit note",
        ),
        resource_id="run-1",
        recorded_at=datetime(year=2024, month=1, day=1),
    )
