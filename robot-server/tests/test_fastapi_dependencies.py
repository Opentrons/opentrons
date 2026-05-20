"""Tests for ``robot_server.fastapi_dependencies``."""

from datetime import datetime

import pytest
from fastapi import status

from server_utils.auth.resource_server.auth_server import (
    RequireReasonForInteractionSettingsResponse,
    RequireReasonForInteractionSettingsResponseData,
)
from server_utils.fastapi_utils.models.json_api import RequestModel

from robot_server.errors.error_responses import ApiError
from robot_server.fastapi_dependencies import (
    maybe_log_user_action_notes_when_setting_requires,
)
from robot_server.runs.action_models import RunActionCreate, RunActionType

_REQUIRE_REASON_ON = RequireReasonForInteractionSettingsResponse(
    data=RequireReasonForInteractionSettingsResponseData(
        requireReasonForInteraction=True
    )
)
_REQUIRE_REASON_OFF = RequireReasonForInteractionSettingsResponse(
    data=RequireReasonForInteractionSettingsResponseData(
        requireReasonForInteraction=False
    )
)


@pytest.mark.asyncio
@pytest.mark.parametrize("action_type", [RunActionType.PLAY, RunActionType.PAUSE])
async def test_action_without_notes_raises_when_reason_required(
    action_type: RunActionType,
) -> None:
    """Run actions without ``userNotes`` are rejected when require-reason is on."""
    body = RequestModel[RunActionCreate](
        data=RunActionCreate(actionType=action_type),
        userNotes=None,
    )
    with pytest.raises(ApiError) as exc_info:
        await maybe_log_user_action_notes_when_setting_requires(
            "run-id",
            body,
            datetime(year=2024, month=1, day=1),
            require_reason_settings=_REQUIRE_REASON_ON,
        )
    assert exc_info.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_action_without_notes_allowed_when_reason_not_required() -> None:
    """When require-reason is off, actions without ``userNotes`` are not validated here."""
    body = RequestModel[RunActionCreate](
        data=RunActionCreate(actionType=RunActionType.PLAY),
        userNotes=None,
    )
    await maybe_log_user_action_notes_when_setting_requires(
        "run-id",
        body,
        datetime(year=2024, month=1, day=1),
        require_reason_settings=_REQUIRE_REASON_OFF,
    )
