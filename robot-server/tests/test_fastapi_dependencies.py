"""Tests for ``robot_server.fastapi_dependencies``."""

from datetime import datetime

import pytest
from decoy import Decoy
from fastapi import status

from server_utils.auth.resource_server.authorization_checker import (
    AlwaysAllowedAuthorizationChecker,
)
from server_utils.fastapi_utils.models.json_api import RequestModel

from robot_server.errors.error_responses import ApiError
from robot_server.fastapi_dependencies import maybe_record_documented_interaction
from robot_server.runs.action_models import RunActionCreate, RunActionType


@pytest.mark.asyncio
@pytest.mark.parametrize("action_type", [RunActionType.PLAY, RunActionType.PAUSE])
async def test_action_without_notes_raises_when_auth_server_requires_them(
    decoy: Decoy,
    action_type: RunActionType,
) -> None:
    """Run actions without ``userNotes`` are rejected when auth-server requires them."""
    checker = decoy.mock(cls=AlwaysAllowedAuthorizationChecker)
    decoy.when(await checker.get_require_reason_for_interaction_enabled()).then_return(
        True
    )
    body = RequestModel[RunActionCreate](
        data=RunActionCreate(actionType=action_type),
        userNotes=None,
    )
    with pytest.raises(ApiError) as exc_info:
        await maybe_record_documented_interaction(
            "run-id",
            body,
            datetime(year=2024, month=1, day=1),
            authorization_checker=checker,
        )
    assert exc_info.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_action_without_notes_allowed_when_auth_server_does_not_require_them(
    decoy: Decoy,
) -> None:
    """When auth-server does not require notes, actions without ``userNotes`` are allowed."""
    checker = decoy.mock(cls=AlwaysAllowedAuthorizationChecker)
    decoy.when(await checker.get_require_reason_for_interaction_enabled()).then_return(
        False
    )
    body = RequestModel[RunActionCreate](
        data=RunActionCreate(actionType=RunActionType.PLAY),
        userNotes=None,
    )
    await maybe_record_documented_interaction(
        "run-id",
        body,
        datetime(year=2024, month=1, day=1),
        authorization_checker=checker,
    )
