"""Tests for the /runs router."""

from datetime import datetime

import pytest
from decoy import Decoy

from robot_server.deck_configuration.store import DeckConfigurationStore
from robot_server.errors.error_responses import ApiError
from robot_server.fastapi_dependencies import (
    log_run_action_play_user_notes,
    request_body_has_supplied_user_notes,
)
from robot_server.maintenance_runs.maintenance_run_orchestrator_store import (
    MaintenanceRunOrchestratorStore,
)
from robot_server.runs.action_models import (
    CreateRunActionRequest,
    RunAction,
    RunActionCreate,
    RunActionType,
)
from robot_server.runs.router.actions_router import create_run_action
from robot_server.runs.run_controller import RunActionNotAllowedError, RunController
from robot_server.runs.run_models import RunNotFoundError

_PLAY_USER_NOTES = "pytest play documentation"


@pytest.fixture
def mock_run_controller(decoy: Decoy) -> RunController:
    """Get a fake RunController dependency."""
    return decoy.mock(cls=RunController)


async def test_create_run_action(
    decoy: Decoy,
    mock_run_controller: RunController,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    mock_deck_configuration_store: DeckConfigurationStore,
) -> None:
    """It should create a run action."""
    run_id = "some-run-id"
    action_id = "some-action-id"
    created_at = datetime(year=2021, month=1, day=1)
    action_type = RunActionType.PLAY
    request_body = CreateRunActionRequest(
        data=RunActionCreate(actionType=action_type),
        userNotes=_PLAY_USER_NOTES,
    )
    expected_result = RunAction(
        id="some-action-id",
        createdAt=created_at,
        actionType=RunActionType.PLAY,
    )
    decoy.when(
        await mock_deck_configuration_store.get_deck_configuration()
    ).then_return([])
    decoy.when(mock_maintenance_run_orchestrator_store.current_run_id).then_return(None)
    decoy.when(
        mock_run_controller.create_action(
            action_id=action_id,
            action_type=action_type,
            created_at=created_at,
            action_payload=[],
        )
    ).then_return(expected_result)

    body_has_user_notes = request_body_has_supplied_user_notes(request_body)
    log_run_action_play_user_notes(
        run_id,
        request_body,
        created_at,
        body_has_user_notes=body_has_user_notes,
    )
    result = await create_run_action(
        runId=run_id,
        request_body=request_body,
        run_controller=mock_run_controller,
        action_id=action_id,
        created_at=created_at,
        maintenance_run_orchestrator_store=mock_maintenance_run_orchestrator_store,
        deck_configuration_store=mock_deck_configuration_store,
        check_estop=True,
        _maybe_audit_run_action_play_user_notes=None,
    )

    assert result.content.data == expected_result
    assert result.status_code == 201


async def test_play_action_clears_maintenance_run(
    decoy: Decoy,
    mock_run_controller: RunController,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    mock_deck_configuration_store: DeckConfigurationStore,
) -> None:
    """It should clear an existing maintenance run before issuing play action."""
    run_id = "some-run-id"
    action_id = "some-action-id"
    created_at = datetime(year=2021, month=1, day=1)
    action_type = RunActionType.PLAY
    request_body = CreateRunActionRequest(
        data=RunActionCreate(actionType=action_type),
        userNotes=_PLAY_USER_NOTES,
    )
    expected_result = RunAction(
        id="some-action-id",
        createdAt=created_at,
        actionType=RunActionType.PLAY,
    )
    decoy.when(
        await mock_deck_configuration_store.get_deck_configuration()
    ).then_return([])
    decoy.when(mock_maintenance_run_orchestrator_store.current_run_id).then_return(
        "some-id"
    )
    decoy.when(
        mock_run_controller.create_action(
            action_id=action_id,
            action_type=action_type,
            created_at=created_at,
            action_payload=[],
        )
    ).then_return(expected_result)

    body_has_user_notes = request_body_has_supplied_user_notes(request_body)
    log_run_action_play_user_notes(
        run_id,
        request_body,
        created_at,
        body_has_user_notes=body_has_user_notes,
    )
    result = await create_run_action(
        runId=run_id,
        request_body=request_body,
        run_controller=mock_run_controller,
        action_id=action_id,
        created_at=created_at,
        maintenance_run_orchestrator_store=mock_maintenance_run_orchestrator_store,
        deck_configuration_store=mock_deck_configuration_store,
        check_estop=True,
        _maybe_audit_run_action_play_user_notes=None,
    )

    decoy.verify(await mock_maintenance_run_orchestrator_store.clear(), times=1)
    assert result.content.data == expected_result
    assert result.status_code == 201


@pytest.mark.parametrize(
    ("exception", "expected_error_id", "expected_status_code"),
    [
        (RunActionNotAllowedError(message="oh no"), "RunActionNotAllowed", 409),
        (RunNotFoundError("oh no"), "RunNotFound", 404),
    ],
)
async def test_create_play_action_not_allowed(
    decoy: Decoy,
    mock_run_controller: RunController,
    exception: Exception,
    expected_error_id: str,
    expected_status_code: int,
    mock_maintenance_run_orchestrator_store: MaintenanceRunOrchestratorStore,
    mock_deck_configuration_store: DeckConfigurationStore,
) -> None:
    """It should 409 if the runner is not able to handle the action."""
    run_id = "some-run-id"
    action_id = "some-action-id"
    created_at = datetime(year=2021, month=1, day=1)
    action_type = RunActionType.PLAY
    request_body = CreateRunActionRequest(
        data=RunActionCreate(actionType=action_type),
        userNotes=_PLAY_USER_NOTES,
    )

    decoy.when(
        await mock_deck_configuration_store.get_deck_configuration()
    ).then_return([])
    decoy.when(mock_maintenance_run_orchestrator_store.current_run_id).then_return(None)
    decoy.when(
        mock_run_controller.create_action(
            action_id=action_id,
            action_type=action_type,
            created_at=created_at,
            action_payload=[],
        )
    ).then_raise(exception)

    body_has_user_notes = request_body_has_supplied_user_notes(request_body)
    log_run_action_play_user_notes(
        run_id,
        request_body,
        created_at,
        body_has_user_notes=body_has_user_notes,
    )
    with pytest.raises(ApiError) as exc_info:
        await create_run_action(
            runId=run_id,
            request_body=request_body,
            run_controller=mock_run_controller,
            action_id=action_id,
            created_at=created_at,
            maintenance_run_orchestrator_store=mock_maintenance_run_orchestrator_store,
            deck_configuration_store=mock_deck_configuration_store,
            check_estop=True,
            _maybe_audit_run_action_play_user_notes=None,
        )

    assert exc_info.value.status_code == expected_status_code
    assert exc_info.value.content["errors"][0]["id"] == expected_error_id
