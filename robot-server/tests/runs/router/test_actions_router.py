"""Tests for the /runs router."""
import pytest
from datetime import datetime
from decoy import Decoy, matchers

from opentrons.protocol_engine.errors import ProtocolEngineStoppedError

from robot_server.errors import ApiError
from robot_server.service.json_api import RequestModel
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
    RunActionCreate,
)

from robot_server.runs.router.actions_router import create_run_action


@pytest.fixture
def prev_run(decoy: Decoy, run_store: RunStore) -> RunResource:
    """Get an existing run resource that's in the store."""
    run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=True,
    )

    decoy.when(run_store.get(run_id="run-id")).then_return(run)

    return run


async def test_create_play_action(
    decoy: Decoy,
    run_view: RunView,
    run_store: RunStore,
    engine_store: EngineStore,
    prev_run: RunResource,
) -> None:
    """It should handle a play action."""
    action = RunAction(
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2022, month=2, day=2),
        id="action-id",
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
            action_id="action-id",
            action_data=RunActionCreate(actionType=RunActionType.PLAY),
            created_at=datetime(year=2022, month=2, day=2),
        ),
    ).then_return((action, next_run))

    result = await create_run_action(
        runId="run-id",
        request_body=RequestModel(data=RunActionCreate(actionType=RunActionType.PLAY)),
        run_view=run_view,
        run_store=run_store,
        engine_store=engine_store,
        action_id="action-id",
        created_at=datetime(year=2022, month=2, day=2),
    )

    assert result.data == action
    decoy.verify(
        engine_store.runner.play(),
        run_store.upsert(run=next_run),
    )


async def test_create_play_action_with_missing_id(
    decoy: Decoy,
    run_store: RunStore,
) -> None:
    """It should 404 if the run ID does not exist."""
    not_found_error = RunNotFoundError(run_id="run-id")

    decoy.when(run_store.get(run_id="run-id")).then_raise(not_found_error)

    with pytest.raises(ApiError) as exc_info:
        await create_run_action(
            runId="run-id",
            request_body=RequestModel(
                data=RunActionCreate(actionType=RunActionType.PLAY)
            ),
            run_store=run_store,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_create_play_action_not_allowed(
    decoy: Decoy,
    run_view: RunView,
    run_store: RunStore,
    engine_store: EngineStore,
    prev_run: RunResource,
) -> None:
    """It should 409 if the runner is not able to handle the action."""
    actions = RunAction(
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2022, month=2, day=2),
        id="action-id",
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
            action_id="action-id",
            action_data=RunActionCreate(actionType=RunActionType.PLAY),
            created_at=datetime(year=2022, month=2, day=2),
        ),
    ).then_return((actions, next_run))

    decoy.when(engine_store.runner.play()).then_raise(
        ProtocolEngineStoppedError("oh no")
    )

    with pytest.raises(ApiError) as exc_info:
        await create_run_action(
            runId="run-id",
            request_body=RequestModel(
                data=RunActionCreate(actionType=RunActionType.PLAY)
            ),
            run_view=run_view,
            run_store=run_store,
            engine_store=engine_store,
            action_id="action-id",
            created_at=datetime(year=2022, month=2, day=2),
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunActionNotAllowed"

    decoy.verify(run_store.upsert(run=matchers.Anything()), times=0)


async def test_create_run_action_not_current(
    decoy: Decoy,
    run_view: RunView,
    run_store: RunStore,
    engine_store: EngineStore,
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

    with pytest.raises(ApiError) as exc_info:
        await create_run_action(
            runId="run-id",
            request_body=RequestModel(
                data=RunActionCreate(actionType=RunActionType.PLAY)
            ),
            run_store=run_store,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunStopped"

    decoy.verify(run_store.upsert(run=matchers.Anything()), times=0)


async def test_create_pause_action(
    decoy: Decoy,
    run_view: RunView,
    run_store: RunStore,
    engine_store: EngineStore,
    prev_run: RunResource,
) -> None:
    """It should handle a pause action."""
    action = RunAction(
        actionType=RunActionType.PAUSE,
        createdAt=datetime(year=2022, month=2, day=2),
        id="action-id",
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
            action_id="action-id",
            action_data=RunActionCreate(actionType=RunActionType.PAUSE),
            created_at=datetime(year=2022, month=2, day=2),
        ),
    ).then_return((action, next_run))

    result = await create_run_action(
        runId="run-id",
        request_body=RequestModel(data=RunActionCreate(actionType=RunActionType.PAUSE)),
        run_view=run_view,
        run_store=run_store,
        engine_store=engine_store,
        action_id="action-id",
        created_at=datetime(year=2022, month=2, day=2),
    )

    assert result.data == action
    decoy.verify(
        engine_store.runner.pause(),
        run_store.upsert(run=next_run),
    )


async def test_create_stop_action(
    decoy: Decoy,
    run_view: RunView,
    run_store: RunStore,
    engine_store: EngineStore,
    prev_run: RunResource,
) -> None:
    """It should handle a stop action."""
    action = RunAction(
        actionType=RunActionType.STOP,
        createdAt=datetime(year=2022, month=2, day=2),
        id="action-id",
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
            action_id="action-id",
            action_data=RunActionCreate(actionType=RunActionType.STOP),
            created_at=datetime(year=2022, month=2, day=2),
        ),
    ).then_return((action, next_run))

    result = await create_run_action(
        runId="run-id",
        request_body=RequestModel(data=RunActionCreate(actionType=RunActionType.STOP)),
        run_view=run_view,
        run_store=run_store,
        engine_store=engine_store,
        action_id="action-id",
        created_at=datetime(year=2022, month=2, day=2),
    )

    assert result.data == action
    decoy.verify(
        await engine_store.runner.stop(),
        run_store.upsert(run=next_run),
    )
