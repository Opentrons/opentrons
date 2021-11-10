"""Tests for the /runs router."""
import pytest
from datetime import datetime
from decoy import Decoy
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import AsyncClient

from tests.helpers import verify_response
from opentrons.protocol_engine.errors import ProtocolEngineStoppedError

from robot_server.runs.run_view import RunView
from robot_server.runs.engine_store import EngineStore
from robot_server.runs.run_store import (
    RunStore,
    RunNotFoundError,
    RunResource,
)

from robot_server.runs.action_models import (
    RunAction,
    RunActionType,
    RunActionCreateData,
)

from robot_server.runs.router.base_router import RunNotFound, RunStopped

from robot_server.runs.router.actions_router import (
    actions_router,
    RunActionNotAllowed,
)


prev_run = RunResource(
    run_id="run-id",
    protocol_id=None,
    created_at=datetime(year=2021, month=1, day=1),
    actions=[],
    is_current=True,
)


@pytest.fixture(autouse=True)
def setup_app(app: FastAPI) -> None:
    """Configure the FastAPI app with actions routes."""
    app.include_router(actions_router)


@pytest.fixture(autouse=True)
def setup_run_store(decoy: Decoy, run_store: RunStore) -> None:
    """Configure the mock RunStore to return a RunResource."""
    decoy.when(run_store.get(run_id="run-id")).then_return(prev_run)


def test_create_play_action(
    decoy: Decoy,
    run_view: RunView,
    run_store: RunStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should handle a play action."""
    action = RunAction(
        actionType=RunActionType.PLAY,
        createdAt=current_time,
        id=unique_id,
    )

    next_run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[action],
        is_current=True,
    )

    decoy.when(
        run_view.with_action(
            run=prev_run,
            action_id=unique_id,
            action_data=RunActionCreateData(actionType=RunActionType.PLAY),
            created_at=current_time,
        ),
    ).then_return((action, next_run))

    response = client.post(
        "/runs/run-id/actions",
        json={"data": {"actionType": "play"}},
    )

    verify_response(response, expected_status=201, expected_data=action)
    decoy.verify(engine_store.runner.play())


def test_create_run_action_with_missing_id(
    decoy: Decoy,
    run_store: RunStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should 404 if the run ID does not exist."""
    not_found_error = RunNotFoundError(run_id="run-id")

    decoy.when(run_store.get(run_id="run-id")).then_raise(not_found_error)

    response = client.post(
        "/runs/run-id/actions",
        json={"data": {"actionType": "play"}},
    )

    verify_response(
        response,
        expected_status=404,
        expected_errors=RunNotFound(detail=str(not_found_error)),
    )


def test_create_run_action_without_runner(
    decoy: Decoy,
    run_view: RunView,
    run_store: RunStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should 409 if the runner is not able to handle the action."""
    actions = RunAction(
        actionType=RunActionType.PLAY,
        createdAt=current_time,
        id=unique_id,
    )

    next_run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[actions],
        is_current=True,
    )

    decoy.when(
        run_view.with_action(
            run=prev_run,
            action_id=unique_id,
            action_data=RunActionCreateData(actionType=RunActionType.PLAY),
            created_at=current_time,
        ),
    ).then_return((actions, next_run))

    decoy.when(engine_store.runner.play()).then_raise(
        ProtocolEngineStoppedError("oh no")
    )

    response = client.post(
        "/runs/run-id/actions",
        json={"data": {"actionType": "play"}},
    )

    verify_response(
        response,
        expected_status=409,
        expected_errors=RunActionNotAllowed(detail="oh no"),
    )


def test_create_run_action_not_current(
    decoy: Decoy,
    run_view: RunView,
    run_store: RunStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should 409 if the run is not current."""
    prev_run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=False,
    )

    decoy.when(run_store.get(run_id="run-id")).then_return(prev_run)

    response = client.post(
        "/runs/run-id/actions",
        json={"data": {"actionType": "play"}},
    )

    verify_response(
        response,
        expected_status=409,
        expected_errors=RunStopped(detail="Run run-id is not the current run"),
    )


def test_create_pause_action(
    decoy: Decoy,
    run_view: RunView,
    run_store: RunStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    client: TestClient,
) -> None:
    """It should handle a pause action."""
    action = RunAction(
        actionType=RunActionType.PAUSE,
        createdAt=current_time,
        id=unique_id,
    )

    next_run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[action],
        is_current=True,
    )

    decoy.when(
        run_view.with_action(
            run=prev_run,
            action_id=unique_id,
            action_data=RunActionCreateData(actionType=RunActionType.PAUSE),
            created_at=current_time,
        ),
    ).then_return((action, next_run))

    response = client.post(
        "/runs/run-id/actions",
        json={"data": {"actionType": "pause"}},
    )

    verify_response(response, expected_status=201, expected_data=action)
    decoy.verify(engine_store.runner.pause())


async def test_create_stop_action(
    decoy: Decoy,
    run_view: RunView,
    run_store: RunStore,
    engine_store: EngineStore,
    unique_id: str,
    current_time: datetime,
    async_client: AsyncClient,
) -> None:
    """It should handle a stop action."""
    action = RunAction(
        actionType=RunActionType.STOP,
        createdAt=current_time,
        id=unique_id,
    )

    next_run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[action],
        is_current=True,
    )

    decoy.when(
        run_view.with_action(
            run=prev_run,
            action_id=unique_id,
            action_data=RunActionCreateData(actionType=RunActionType.STOP),
            created_at=current_time,
        ),
    ).then_return((action, next_run))

    response = await async_client.post(
        "/runs/run-id/actions",
        json={"data": {"actionType": "stop"}},
    )

    verify_response(response, expected_status=201, expected_data=action)
    decoy.verify(await engine_store.runner.stop())
