"""Tests for ``robot_server.fastapi_dependencies``."""

from pydantic import BaseModel

from server_utils.fastapi_utils.models.json_api import RequestModel

from robot_server.fastapi_dependencies import (
    get_require_reason_for_interaction_enabled,
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
    """When there is no auth-server client, use the same default as an unset setting row."""
    assert await get_require_reason_for_interaction_enabled(None) is True
