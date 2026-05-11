"""Tests for ``robot_server.fastapi_dependencies``."""

from pydantic import BaseModel

from robot_server.fastapi_dependencies import get_run_action_body_has_user_notes
from robot_server.runs.action_models import (
    CreateRunActionRequest,
    RunActionCreate,
    RunActionType,
)


def test_get_run_action_body_has_user_notes() -> None:
    """Should return ``True`` when the body is a play run action with ``userNotes`` set."""
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
    assert get_run_action_body_has_user_notes(play_with_notes) is True
    assert get_run_action_body_has_user_notes(play_without) is False
    assert get_run_action_body_has_user_notes(pause) is False
    assert get_run_action_body_has_user_notes(pause_with_notes) is False


def test_get_run_action_body_has_user_notes_other_models() -> None:
    """Returns ``False`` for non-``CreateRunActionRequest`` bodies."""

    class _OtherBody(BaseModel):
        foo: str

    assert get_run_action_body_has_user_notes(_OtherBody(foo="x")) is False
