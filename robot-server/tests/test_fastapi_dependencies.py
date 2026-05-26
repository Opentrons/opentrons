"""Tests for ``robot_server.fastapi_dependencies``."""

import logging
from collections.abc import AsyncGenerator
from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from starlette.requests import Request

from server_utils.auth.resource_server.authorization_checker import (
    AlwaysAllowedAuthorizationChecker,
    MissingUserNotesError,
)
from server_utils.fastapi_utils.models.json_api import RequestModel
from robot_server.fastapi_dependencies import (
    AuditLogger,
    get_audit_logger,
    maybe_record_documented_interaction,
)
from robot_server.runs.action_models import RunActionCreate, RunActionType

_RUN_ID = "run-abc"
_CREATED_AT = datetime(year=2024, month=1, day=1)
_PLAY_ACTION = RunActionCreate(actionType=RunActionType.PLAY)
_USER_NOTES = "User documented why they pressed play"
_AUDIT_LOGGER = "server_utils.auth.resource_server.authorization_checker"


def _request(method: str = "POST") -> Request:
    return Request({"type": "http", "method": method, "path": "/", "headers": []})


@pytest.mark.asyncio
async def test_audit_logger_log_records_when_required(
    caplog: pytest.LogCaptureFixture,
) -> None:
    checker = AlwaysAllowedAuthorizationChecker()
    audit_logger = AuditLogger(
        user_notes=_USER_NOTES,
        created_at=_CREATED_AT,
        authorization_checker=checker,
    )
    with (
        patch.object(
            checker,
            "get_require_reason_for_interaction_enabled",
            new=AsyncMock(return_value=True),
        ),
        caplog.at_level(logging.INFO, logger=_AUDIT_LOGGER),
    ):
        await audit_logger.log(
            resource_id="protocol-1",
            request_data={"uploadedFileNames": ["a.py"]},
        )

    assert audit_logger.did_log is True
    assert any(
        "Documented interaction" in record.message and "protocol-1" in record.message
        for record in caplog.records
    )


@pytest.mark.asyncio
async def test_get_audit_logger_raises_when_required_but_forgot_to_log() -> None:
    checker = AlwaysAllowedAuthorizationChecker()
    with patch.object(
        checker,
        "get_require_reason_for_interaction_enabled",
        new=AsyncMock(return_value=True),
    ):
        generator: AsyncGenerator[AuditLogger, None] = get_audit_logger(
            _request("POST"),
            user_notes=_USER_NOTES,
            created_at=_CREATED_AT,
            authorization_checker=checker,
        )
        audit_logger = await generator.__anext__()
        with pytest.raises(RuntimeError, match="forgot to send anything to the audit log"):
            await generator.__anext__()


@pytest.mark.asyncio
async def test_get_audit_logger_ok_when_audit_not_required_and_forgot_to_log() -> None:
    checker = AlwaysAllowedAuthorizationChecker()
    generator = get_audit_logger(
        _request("POST"),
        user_notes=None,
        created_at=_CREATED_AT,
        authorization_checker=checker,
    )
    await generator.__anext__()
    with pytest.raises(StopAsyncIteration):
        await generator.__anext__()


@pytest.mark.asyncio
async def test_get_audit_logger_skips_enforcement_for_get() -> None:
    checker = AlwaysAllowedAuthorizationChecker()
    with patch.object(
        checker,
        "get_require_reason_for_interaction_enabled",
        new=AsyncMock(return_value=True),
    ):
        generator = get_audit_logger(
            _request("GET"),
            user_notes=None,
            created_at=_CREATED_AT,
            authorization_checker=checker,
        )
        await generator.__anext__()
        with pytest.raises(StopAsyncIteration):
            await generator.__anext__()


@pytest.mark.asyncio
async def test_maybe_record_documented_interaction_records_audit_when_required(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Forwards request notes and data to the checker and writes an audit log entry."""
    checker = AlwaysAllowedAuthorizationChecker()
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
            RequestModel(data=_PLAY_ACTION),
            f"  {_USER_NOTES}  ",
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
    with caplog.at_level(logging.INFO, logger=_AUDIT_LOGGER):
        await maybe_record_documented_interaction(
            _RUN_ID,
            RequestModel(data=_PLAY_ACTION),
            None,
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
    """Run actions without audit notes header are rejected when auth-server requires them."""
    checker = AlwaysAllowedAuthorizationChecker()
    with (
        patch.object(
            checker,
            "get_require_reason_for_interaction_enabled",
            new=AsyncMock(return_value=True),
        ),
        pytest.raises(MissingUserNotesError),
    ):
        await maybe_record_documented_interaction(
            _RUN_ID,
            RequestModel(data=RunActionCreate(actionType=action_type)),
            None,
            _CREATED_AT,
            authorization_checker=checker,
        )


@pytest.mark.asyncio
async def test_maybe_record_documented_interaction_records_protocol_upload_audit(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Forwards header notes and request data to the checker."""
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
        await maybe_record_documented_interaction(
            "protocol-1",
            RequestModel(data=request_data),
            _USER_NOTES,
            _CREATED_AT,
            authorization_checker=checker,
        )

    assert any(
        "Documented interaction" in record.message and "protocol-1" in record.message
        for record in caplog.records
    )
