"""Tests for ``robot_server.fastapi_dependencies``."""

from datetime import datetime

import pytest

from server_utils.auth.resource_server.auth_server import (
    RequireReasonForInteractionSettingsResponse,
    RequireReasonForInteractionSettingsResponseData,
)
from server_utils.fastapi_utils.models.json_api import RequestModel

from robot_server.fastapi_dependencies import (
    maybe_log_user_action_notes_when_setting_requires,
)
from robot_server.runs.action_models import RunActionCreate, RunActionType

_REQUIRE_REASON_ON = RequireReasonForInteractionSettingsResponse(
    data=RequireReasonForInteractionSettingsResponseData(
        requireReasonForInteraction=True
    )
)


@pytest.mark.asyncio
async def test_maybe_log_allows_play_without_notes_when_reason_required() -> None:
    """Until play-without-notes validation is implemented, the dependency only logs supplied notes."""
    body = RequestModel[RunActionCreate](
        data=RunActionCreate(actionType=RunActionType.PLAY),
        userNotes=None,
    )
    await maybe_log_user_action_notes_when_setting_requires(
        "run-id",
        body,
        datetime(year=2024, month=1, day=1),
        require_reason_settings=_REQUIRE_REASON_ON,
    )


@pytest.mark.asyncio
async def test_maybe_log_allows_pause_without_notes_when_reason_required() -> None:
    """Only ``play`` is required to carry notes; other actions are unchanged."""
    body = RequestModel[RunActionCreate](
        data=RunActionCreate(actionType=RunActionType.PAUSE),
        userNotes=None,
    )
    await maybe_log_user_action_notes_when_setting_requires(
        "run-id",
        body,
        datetime(year=2024, month=1, day=1),
        require_reason_settings=_REQUIRE_REASON_ON,
    )
