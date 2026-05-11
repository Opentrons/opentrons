"""Tests for shared FastAPI dependencies (`robot_server.fastapi_dependencies`)."""

import pytest
from pydantic import BaseModel

from robot_server.fastapi_dependencies import (
    body_is_play_with_user_notes,
    get_body_has_user_notes,
)
from robot_server.runs.action_models import (
    CreateRunActionRequest,
    RunActionCreate,
    RunActionType,
)

_UN = "n"


@pytest.mark.parametrize(
    ("action_type", "user_notes", "expected"),
    [
        (RunActionType.PLAY, _UN, True),
        (RunActionType.PLAY, None, False),
        (RunActionType.PAUSE, None, False),
        (RunActionType.STOP, None, False),
    ],
)
def test_body_is_play_with_user_notes(
    action_type: RunActionType,
    user_notes: str | None,
    expected: bool,
) -> None:
    """Play + ``userNotes`` on create body is True; otherwise False."""
    body = CreateRunActionRequest(
        data=RunActionCreate(actionType=action_type),
        userNotes=user_notes,
    )
    assert body_is_play_with_user_notes(body) is expected


def test_get_body_has_user_notes_matches_run_action_bodies() -> None:
    """``RequestBodyUnion`` run-action instances mirror ``body_is_play_with_user_notes``."""
    play_with_notes = CreateRunActionRequest(
        data=RunActionCreate(actionType=RunActionType.PLAY),
        userNotes=_UN,
    )
    play_without = CreateRunActionRequest(
        data=RunActionCreate(actionType=RunActionType.PLAY),
        userNotes=None,
    )
    pause = CreateRunActionRequest(
        data=RunActionCreate(actionType=RunActionType.PAUSE),
        userNotes=None,
    )
    assert get_body_has_user_notes(play_with_notes) is True
    assert get_body_has_user_notes(play_without) is False
    assert get_body_has_user_notes(pause) is False


def test_get_body_has_user_notes_other_base_models() -> None:
    """Non-run-action ``BaseModel`` bodies yield ``False`` (extend ``RequestBodyUnion`` as needed)."""

    class _OtherBody(BaseModel):
        foo: str

    assert get_body_has_user_notes(_OtherBody(foo="x")) is False
