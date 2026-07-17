"""Tests for ``robot_server.fastapi_dependencies``."""

import logging
from collections.abc import AsyncGenerator
from datetime import datetime

import pytest
from starlette.requests import Request

from server_utils.audit.audit_logger import AuditLogger as AuditServerLogger
from server_utils.audit.audit_server import NoOpClient

from robot_server.fastapi_dependencies import AuditLogger, get_audit_logger
from robot_server.runs.action_models import RunActionCreate, RunActionType

_RUN_ID = "run-abc"
_CREATED_AT = datetime(year=2024, month=1, day=1)
_PLAY_ACTION = RunActionCreate(actionType=RunActionType.PLAY)
_USER_NOTES = "User documented why they pressed play"
_AUDIT_LOGGER = "robot_server.fastapi_dependencies"


def _request(method: str = "POST") -> Request:
    return Request({"type": "http", "method": method, "path": "/", "headers": []})


@pytest.mark.asyncio
async def test_audit_logger_log_records_when_required(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Records the interaction when required."""
    client = NoOpClient()
    audit_logger = AuditLogger(
        user_notes=_USER_NOTES,
        created_at=_CREATED_AT,
        audit_server_logger=AuditServerLogger(audit_client=client),
    )
    with (
        caplog.at_level(logging.INFO, logger=_AUDIT_LOGGER),
    ):
        await audit_logger.log(
            resource_id="protocol-1",
            request_data={"uploadedFileNames": ["a.py"]},
        )

    assert audit_logger.did_log is True
    assert any(
        "Audit log:" in record.message and "protocol-1" in record.message
        for record in caplog.records
    )


@pytest.mark.asyncio
async def test_get_audit_logger_raises_when_required_but_forgot_to_log() -> None:
    """Raises when the endpoint forgot to send anything to the audit log."""
    client = NoOpClient()
    generator: AsyncGenerator[AuditLogger, None] = get_audit_logger(
        _request("POST"),
        user_notes=_USER_NOTES,
        created_at=_CREATED_AT,
        audit_client=client,
    )
    await generator.__anext__()
    with pytest.raises(RuntimeError, match="forgot to send anything to the audit log"):
        await generator.__anext__()


@pytest.mark.asyncio
async def test_get_audit_logger_skips_enforcement_for_get() -> None:
    """Skips enforcement for GET requests."""
    client = NoOpClient()
    generator = get_audit_logger(
        _request("GET"), user_notes=None, created_at=_CREATED_AT, audit_client=client
    )
    await generator.__anext__()
    with pytest.raises(StopAsyncIteration):
        await generator.__anext__()


@pytest.mark.asyncio
async def test_audit_logger_log_records_run_action(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Run-action audit uses the same AuditLogger.log path as protocol routes."""
    client = NoOpClient()
    audit_logger = AuditLogger(
        user_notes=_USER_NOTES,
        created_at=_CREATED_AT,
        audit_server_logger=AuditServerLogger(audit_client=client),
    )
    with (
        caplog.at_level(logging.INFO, logger=_AUDIT_LOGGER),
    ):
        await audit_logger.log(resource_id=_RUN_ID, request_data=_PLAY_ACTION)

    assert audit_logger.did_log is True
    assert any(
        "Audit log:" in record.message and _RUN_ID in record.message
        for record in caplog.records
    )
