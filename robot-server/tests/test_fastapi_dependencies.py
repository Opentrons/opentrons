"""Tests for ``robot_server.fastapi_dependencies``."""

from datetime import datetime

import pytest
from pydantic import BaseModel

from server_utils.fastapi_utils.models.json_api import RequestModel

from robot_server.errors.error_responses import ApiError
from robot_server.fastapi_dependencies import (
    get_require_reason_for_interaction_enabled,
    maybe_log_user_action_notes_when_setting_requires,
    request_body_has_supplied_user_notes,
)
from robot_server.runs.action_models import (
    CreateRunActionRequest,
    RunActionCreate,
    RunActionType,
)


def test_request_body_has_supplied_user_notes_run_action_shapes() -> None:
    """Non-empty ``userNotes`` counts as supplied documentation for any action type."""
    play_with_notes = CreateRunActionRequest(
        data=RunActionCreate(actionType=RunActionType.PLAY),
        userNotes="n",
    )
    play_without = CreateRunActionRequest(
        data=RunActionCreate(actionType=RunActionType.PLAY),
        userNotes=None,
    )
    pause = CreateRunActionRequest(
        data=RunActionCreate(actionType=RunActionType.PAUSE),
        userNotes=None,
    )
    pause_with_notes = CreateRunActionRequest(
        data=RunActionCreate(actionType=RunActionType.PAUSE),
        userNotes="n",
    )
    assert request_body_has_supplied_user_notes(play_with_notes) is True
    assert request_body_has_supplied_user_notes(play_without) is False
    assert request_body_has_supplied_user_notes(pause) is False
    assert request_body_has_supplied_user_notes(pause_with_notes) is True


def test_request_body_has_supplied_user_notes_other_request_models() -> None:
    """The helper applies to any ``RequestModel`` subtype (``userNotes`` on the envelope)."""

    class _Payload(BaseModel):
        x: int = 0

    class _OtherRequest(RequestModel[_Payload]):
        pass

    assert (
        request_body_has_supplied_user_notes(
            _OtherRequest(data=_Payload(), userNotes="x")
        )
        is True
    )
    assert (
        request_body_has_supplied_user_notes(
            _OtherRequest(data=_Payload(), userNotes=None)
        )
        is False
    )
    assert (
        request_body_has_supplied_user_notes(
            _OtherRequest(data=_Payload(), userNotes="   ")
        )
        is False
    )


def test_whitespace_only_user_notes_is_false() -> None:
    """Whitespace-only ``userNotes`` is not considered supplied documentation."""
    play = CreateRunActionRequest(
        data=RunActionCreate(actionType=RunActionType.PLAY),
        userNotes="  \t  ",
    )
    assert request_body_has_supplied_user_notes(play) is False


async def test_get_require_reason_for_interaction_enabled_without_auth_client() -> None:
    """When there is no auth-server client, the setting is treated as off."""
    assert await get_require_reason_for_interaction_enabled(None) is False


@pytest.mark.asyncio
async def test_maybe_log_rejects_play_without_notes_when_reason_required() -> None:
    """``play`` without ``userNotes`` is rejected when require-reason-for-interaction is on."""
    body = CreateRunActionRequest(
        data=RunActionCreate(actionType=RunActionType.PLAY),
        userNotes=None,
    )
    with pytest.raises(ApiError) as exc_info:
        await maybe_log_user_action_notes_when_setting_requires(
            "run-id",
            body,
            datetime(year=2024, month=1, day=1),
            require_reason_for_interaction=True,
        )
    assert exc_info.value.status_code == 422


@pytest.mark.asyncio
async def test_maybe_log_allows_pause_without_notes_when_reason_required() -> None:
    """Only ``play`` is required to carry notes; other actions are unchanged."""
    body = CreateRunActionRequest(
        data=RunActionCreate(actionType=RunActionType.PAUSE),
        userNotes=None,
    )
    await maybe_log_user_action_notes_when_setting_requires(
        "run-id",
        body,
        datetime(year=2024, month=1, day=1),
        require_reason_for_interaction=True,
    )
