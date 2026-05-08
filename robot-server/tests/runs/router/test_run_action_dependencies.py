"""Tests for run-action FastAPI dependencies."""

from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from pydantic import BaseModel

from server_utils.fastapi_utils.models.json_api import UserConfirmation

from robot_server.runs.action_models import (
    CreateRunActionRequest,
    RunActionCreate,
    RunActionType,
)
from robot_server.runs.router.run_action_dependencies import (
    get_body_needs_user_confirmation,
    run_action_has_user_confirmation,
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
def test_run_action_has_user_confirmation(
    action_type: RunActionType,
    user_confirmation: UserConfirmation | None,
    expected: bool,
) -> None:
    body = CreateRunActionRequest(
        data=RunActionCreate(actionType=action_type),
        userConfirmation=user_confirmation,
    )
    assert run_action_has_user_confirmation(body) is expected


def test_get_body_needs_user_confirmation_create_run_action_delegates() -> None:
    """``CreateRunActionRequest`` uses the same rules as ``run_action_has_user_confirmation``."""
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


def test_get_body_needs_user_confirmation_other_body_types_false() -> None:
    """Only ``CreateRunActionRequest`` is inspected; everything else is ``False``."""
    play_ok = MagicMock()
    play_ok.data.actionType = RunActionType.PLAY
    play_ok.userConfirmation = _UC
    assert get_body_needs_user_confirmation(play_ok) is False

    class _OtherBody(BaseModel):
        foo: str

    assert get_body_needs_user_confirmation(_OtherBody(foo="x")) is False
