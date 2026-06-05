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

from robot_server.fastapi_dependencies import AuditLogger, get_audit_logger
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
    """Records the interaction when required."""
    checker = AlwaysAllowedAuthorizationChecker()
    audit_logger = AuditLogger(
        user_notes=_USER_NOTES,
        created_at=_CREATED_AT,
        authorization_checker=checker,
    )
    with (
        patch.object(
            checker,
            "is_reason_for_interaction_required",
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
    """Raises when the endpoint forgot to send anything to the audit log."""
    checker = AlwaysAllowedAuthorizationChecker()
    with patch.object(
        checker,
        "is_reason_for_interaction_required",
        new=AsyncMock(return_value=True),
    ):
        generator: AsyncGenerator[AuditLogger, None] = get_audit_logger(
            _request("POST"),
            user_notes=_USER_NOTES,
            created_at=_CREATED_AT,
            authorization_checker=checker,
        )
        await generator.__anext__()
        with pytest.raises(
            RuntimeError, match="forgot to send anything to the audit log"
        ):
            await generator.__anext__()


@pytest.mark.asyncio
async def test_get_audit_logger_ok_when_audit_not_required_and_forgot_to_log() -> None:
    """Skips enforcement for non-mutating requests."""
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
    """Skips enforcement for GET requests."""
    checker = AlwaysAllowedAuthorizationChecker()
    with patch.object(
        checker,
        "is_reason_for_interaction_required",
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
async def test_audit_logger_log_records_run_action_when_required(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Run-action audit uses the same AuditLogger.log path as protocol routes."""
    checker = AlwaysAllowedAuthorizationChecker()
    audit_logger = AuditLogger(
        user_notes=_USER_NOTES,
        created_at=_CREATED_AT,
        authorization_checker=checker,
    )
    with (
        patch.object(
            checker,
            "is_reason_for_interaction_required",
            new=AsyncMock(return_value=True),
        ),
        caplog.at_level(logging.INFO, logger=_AUDIT_LOGGER),
    ):
        await audit_logger.log(resource_id=_RUN_ID, request_data=_PLAY_ACTION)

    assert audit_logger.did_log is True
    assert any(
        "Documented interaction" in record.message and _RUN_ID in record.message
        for record in caplog.records
    )


@pytest.mark.asyncio
async def test_audit_logger_log_skips_run_action_when_not_required(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """When auth-server does not require notes, run-action audit is a no-op."""
    checker = AlwaysAllowedAuthorizationChecker()
    audit_logger = AuditLogger(
        user_notes=None,
        created_at=_CREATED_AT,
        authorization_checker=checker,
    )
    with caplog.at_level(logging.INFO, logger=_AUDIT_LOGGER):
        await audit_logger.log(resource_id=_RUN_ID, request_data=_PLAY_ACTION)

    assert audit_logger.did_log is True
    assert not any(
        "Documented interaction" in record.message for record in caplog.records
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("action_type", [RunActionType.PLAY, RunActionType.PAUSE])
async def test_audit_logger_log_raises_when_notes_required_but_missing(
    action_type: RunActionType,
) -> None:
    """Run actions without audit notes header are rejected when auth-server requires them."""
    checker = AlwaysAllowedAuthorizationChecker()
    audit_logger = AuditLogger(
        user_notes=None,
        created_at=_CREATED_AT,
        authorization_checker=checker,
    )
    with (
        patch.object(
            checker,
            "is_reason_for_interaction_required",
            new=AsyncMock(return_value=True),
        ),
        pytest.raises(MissingUserNotesError),
    ):
        await audit_logger.log(
            resource_id=_RUN_ID,
            request_data=RunActionCreate(actionType=action_type),
        )
