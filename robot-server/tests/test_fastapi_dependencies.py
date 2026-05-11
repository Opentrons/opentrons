"""Tests for shared FastAPI dependencies (`robot_server.fastapi_dependencies`)."""

from datetime import datetime, timezone

import pytest
from pydantic import BaseModel

from server_utils.fastapi_utils.models.json_api import UserConfirmation

from robot_server.fastapi_dependencies import (
    body_is_run_action_with_user_confirmation,
    get_body_needs_user_confirmation,
)
from robot_server.runs.action_models import (
    CreateRunActionRequest,
    RunActionCreate,
    RunActionType,
)

_UC = UserConfirmation(
    note="n",
    confirmedAt=datetime(2026, 5, 1, tzinfo=timezone.utc),
    username="u",
)


@pytest.mark.parametrize(
    ("action_type", "user_confirmation", "expected"),
    [
        (RunActionType.PLAY, _UC, True),
        (RunActionType.PLAY, None, False),
        (RunActionType.PAUSE, None, False),
        (RunActionType.STOP, None, False),
    ],
)
def test_body_is_run_action_with_user_confirmation(
    action_type: RunActionType,
    user_confirmation: UserConfirmation | None,
    expected: bool,
) -> None:
    """Play + ``userConfirmation`` on create body is True; otherwise False."""
    body = CreateRunActionRequest(
        data=RunActionCreate(actionType=action_type),
        userConfirmation=user_confirmation,
    )
    assert body_is_run_action_with_user_confirmation(body) is expected


def test_get_body_needs_user_confirmation_matches_run_action_bodies() -> None:
    """``RequestBodyUnion`` run-action instances mirror ``body_is_run_action_with_user_confirmation``."""
    play_with_uc = CreateRunActionRequest(
        data=RunActionCreate(actionType=RunActionType.PLAY),
        userConfirmation=_UC,
    )
    play_without = CreateRunActionRequest(
        data=RunActionCreate(actionType=RunActionType.PLAY),
        userConfirmation=None,
    )
    pause = CreateRunActionRequest(
        data=RunActionCreate(actionType=RunActionType.PAUSE),
        userConfirmation=None,
    )
    assert get_body_needs_user_confirmation(play_with_uc) is True
    assert get_body_needs_user_confirmation(play_without) is False
    assert get_body_needs_user_confirmation(pause) is False


def test_get_body_needs_user_confirmation_other_base_models() -> None:
    """Non-run-action ``BaseModel`` bodies yield ``False`` (extend ``RequestBodyUnion`` as needed)."""

    class _OtherBody(BaseModel):
        foo: str

    assert get_body_needs_user_confirmation(_OtherBody(foo="x")) is False
