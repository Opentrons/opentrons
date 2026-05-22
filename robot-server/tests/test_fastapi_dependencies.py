"""Tests for ``robot_server.fastapi_dependencies``."""

import logging
from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import status

from server_utils.auth.resource_server.authorization_checker import (
    AlwaysAllowedAuthorizationChecker,
)
from server_utils.fastapi_utils.models.json_api import RequestModel

from robot_server.errors.error_responses import ApiError
from robot_server.fastapi_dependencies import (
    maybe_record_documented_interaction,
    maybe_record_documented_interaction_non_json,
)
from robot_server.runs.action_models import RunActionCreate, RunActionType

_RUN_ID = "run-abc"
_CREATED_AT = datetime(year=2024, month=1, day=1)
_PLAY_ACTION = RunActionCreate(actionType=RunActionType.PLAY)
_USER_NOTES = "User documented why they pressed play"
_AUDIT_LOGGER = "server_utils.auth.resource_server.authorization_checker"


@pytest.mark.asyncio
async def test_maybe_record_documented_interaction_records_audit_when_required(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Forwards request notes and data to the checker and writes an audit log entry."""
    checker = AlwaysAllowedAuthorizationChecker()
    body = RequestModel[RunActionCreate](
        data=_PLAY_ACTION,
        userNotes=f"  {_USER_NOTES}  ",
    )
    with (
        patch.object(
            checker,
            "get_require_reason_for_interaction_enabled",
            new=AsyncMock(return_value=True),
        ),
        caplog.at_level(logging.INFO, logger=_AUDIT_LOGGER),
    ):
        await maybe_record_documented_interaction(
            _RUN_ID,
            body,
            _CREATED_AT,
            authorization_checker=checker,
        )

    assert any(
        "Documented interaction" in record.message and _RUN_ID in record.message
        for record in caplog.records
    )


@pytest.mark.asyncio
async def test_maybe_record_documented_interaction_skips_audit_when_not_required(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """When auth-server does not require notes, no audit entry is recorded."""
    checker = AlwaysAllowedAuthorizationChecker()
    body = RequestModel[RunActionCreate](
        data=_PLAY_ACTION,
        userNotes=None,
    )
    with caplog.at_level(logging.INFO, logger=_AUDIT_LOGGER):
        await maybe_record_documented_interaction(
            _RUN_ID,
            body,
            _CREATED_AT,
            authorization_checker=checker,
        )

    assert not any(
        "Documented interaction" in record.message for record in caplog.records
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("action_type", [RunActionType.PLAY, RunActionType.PAUSE])
async def test_maybe_record_documented_interaction_raises_when_notes_required_but_missing(
    action_type: RunActionType,
) -> None:
    """Run actions without ``userNotes`` are rejected when auth-server requires them."""
    checker = AlwaysAllowedAuthorizationChecker()
    body = RequestModel[RunActionCreate](
        data=RunActionCreate(actionType=action_type),
        userNotes=None,
    )
    with (
        patch.object(
            checker,
            "get_require_reason_for_interaction_enabled",
            new=AsyncMock(return_value=True),
        ),
        pytest.raises(ApiError) as exc_info,
    ):
        await maybe_record_documented_interaction(
            _RUN_ID,
            body,
            _CREATED_AT,
            authorization_checker=checker,
        )
    assert exc_info.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_maybe_record_documented_interaction_non_json_records_audit_when_required(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Non-JSON routes forward supplied notes and request data to the checker."""
    checker = AlwaysAllowedAuthorizationChecker()
    request_data = {"protocolKind": "standard", "fileCount": 2}
    with (
        patch.object(
            checker,
            "get_require_reason_for_interaction_enabled",
            new=AsyncMock(return_value=True),
        ),
        caplog.at_level(logging.INFO, logger=_AUDIT_LOGGER),
    ):
        await maybe_record_documented_interaction_non_json(
            resource_id="protocol-1",
            request_data=request_data,
            user_notes=_USER_NOTES,
            created_at=_CREATED_AT,
            authorization_checker=checker,
        )

    assert any(
        "Documented interaction" in record.message and "protocol-1" in record.message
        for record in caplog.records
    )


@pytest.mark.asyncio
async def test_maybe_record_documented_interaction_non_json_skips_audit_when_not_required(
    caplog: pytest.LogCaptureFixture,
) -> None:
    checker = AlwaysAllowedAuthorizationChecker()
    with caplog.at_level(logging.INFO, logger=_AUDIT_LOGGER):
        await maybe_record_documented_interaction_non_json(
            resource_id="data-file-1",
            request_data={"filePath": "/data/foo.csv"},
            user_notes=None,
            created_at=_CREATED_AT,
            authorization_checker=checker,
        )

    assert not any(
        "Documented interaction" in record.message for record in caplog.records
    )


@pytest.mark.asyncio
async def test_maybe_record_documented_interaction_non_json_raises_when_notes_required_but_missing() -> (
    None
):
    checker = AlwaysAllowedAuthorizationChecker()
    with (
        patch.object(
            checker,
            "get_require_reason_for_interaction_enabled",
            new=AsyncMock(return_value=True),
        ),
        pytest.raises(ApiError) as exc_info,
    ):
        await maybe_record_documented_interaction_non_json(
            resource_id="data-file-1",
            request_data={"uploadedFileName": "foo.csv"},
            user_notes=None,
            created_at=_CREATED_AT,
            authorization_checker=checker,
        )
    assert exc_info.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
