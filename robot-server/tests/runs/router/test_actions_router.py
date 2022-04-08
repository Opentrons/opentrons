"""Tests for the /runs router."""
import pytest
from datetime import datetime
from decoy import Decoy, matchers

from opentrons.protocol_engine.errors import ProtocolEngineStoppedError

from robot_server.errors import ApiError
from robot_server.service.json_api import RequestModel
from robot_server.service.task_runner import TaskRunner
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
from sqlalchemy.engine import Engine as SQLEngine
from robot_server.db import create_in_memory_db
from robot_server.data_access.data_access import add_tables_to_db
from typing import Generator


@pytest.fixture
def in_memory_sql_engine() -> Generator[SQLEngine, None, None]:
    """Return a set-up in-memory database to back the store."""
    with create_in_memory_db() as sql_engine:
        add_tables_to_db(sql_engine)
        yield sql_engine


@pytest.fixture
def subject(in_memory_sql_engine: SQLEngine) -> RunStore:
    """Get a RunStore test subject."""
    return RunStore(sql_engine=in_memory_sql_engine)


@pytest.fixture
def task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mock background TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture
def prev_run(decoy: Decoy, subject: RunStore) -> RunResource:
    """Get an existing run resource that's in the store."""
    run = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=True,
    )
    inserted_run = subject.insert(run=run)
    # decoy.when(subject.get(run_id="run-id")).then_return(run)

    return inserted_run


async def test_create_play_action_to_start_run(
    decoy: Decoy,
    run_view: RunView,
    subject: RunStore,
    engine_store: EngineStore,
    prev_run: RunResource,
    task_runner: TaskRunner,
) -> None:
    """It should handle a play action that start the runner."""
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

    decoy.when(engine_store.runner.was_started()).then_return(False)

    result = await create_run_action(
        runId="run-id",
        request_body=RequestModel(data=RunActionCreate(actionType=RunActionType.PLAY)),
        run_view=run_view,
        run_store=subject,
        engine_store=engine_store,
        action_id="action-id",
        created_at=datetime(year=2022, month=2, day=2),
        task_runner=task_runner,
    )

    assert result.content.data == action
    assert result.status_code == 201

    assert isinstance(subject.update(run=next_run), RunResource)

    decoy.verify(
        task_runner.run(engine_store.runner.run),
        subject.update(run=next_run),
    )


async def test_create_play_action_to_resume_run(
    decoy: Decoy,
    run_view: RunView,
    subject: RunStore,
    engine_store: EngineStore,
    prev_run: RunResource,
) -> None:
    """It should handle a play action that resumes the runner."""
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

    decoy.when(engine_store.runner.was_started()).then_return(True)

    result = await create_run_action(
        runId="run-id",
        request_body=RequestModel(data=RunActionCreate(actionType=RunActionType.PLAY)),
        run_view=run_view,
        run_store=subject,
        engine_store=engine_store,
        action_id="action-id",
        created_at=datetime(year=2022, month=2, day=2),
    )

    assert result.content.data == action
    assert result.status_code == 201

    decoy.verify(
        engine_store.runner.play(),
        subject.update(run=next_run),
    )


async def test_create_play_action_with_missing_id(
    decoy: Decoy,
    subject: RunStore,
) -> None:
    """It should 404 if the run ID does not exist."""
    not_found_error = RunNotFoundError(run_id="run-id")

    decoy.when(subject.get(run_id="run-id")).then_raise(not_found_error)

    with pytest.raises(ApiError) as exc_info:
        await create_run_action(
            runId="run-id",
            request_body=RequestModel(
                data=RunActionCreate(actionType=RunActionType.PLAY)
            ),
            run_store=subject,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["id"] == "RunNotFound"


async def test_create_play_action_not_allowed(
    decoy: Decoy,
    run_view: RunView,
    subject: RunStore,
    engine_store: EngineStore,
    prev_run: RunResource,
    task_runner: TaskRunner,
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

    decoy.when(engine_store.runner.was_started()).then_return(True)

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
            run_store=subject,
            engine_store=engine_store,
            task_runner=task_runner,
            action_id="action-id",
            created_at=datetime(year=2022, month=2, day=2),
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunActionNotAllowed"

    decoy.verify(subject.update(run=matchers.Anything()), times=0)


async def test_create_run_action_not_current(
    decoy: Decoy,
    run_view: RunView,
    subject: RunStore,
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

    decoy.when(subject.get(run_id="run-id")).then_return(prev_run)

    with pytest.raises(ApiError) as exc_info:
        await create_run_action(
            runId="run-id",
            request_body=RequestModel(
                data=RunActionCreate(actionType=RunActionType.PLAY)
            ),
            run_store=subject,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.content["errors"][0]["id"] == "RunStopped"

    decoy.verify(subject.update(run=matchers.Anything()), times=0)


async def test_create_pause_action(
    decoy: Decoy,
    run_view: RunView,
    subject: RunStore,
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
        run_store=subject,
        engine_store=engine_store,
        action_id="action-id",
        created_at=datetime(year=2022, month=2, day=2),
    )

    assert result.content.data == action
    assert result.status_code == 201

    decoy.verify(
        engine_store.runner.pause(),
        subject.insert(run=next_run),
    )


async def test_create_stop_action(
    decoy: Decoy,
    run_view: RunView,
    subject: RunStore,
    engine_store: EngineStore,
    prev_run: RunResource,
    task_runner: TaskRunner,
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
        run_store=subject,
        engine_store=engine_store,
        task_runner=task_runner,
        action_id="action-id",
        created_at=datetime(year=2022, month=2, day=2),
    )

    assert result.content.data == action
    assert result.status_code == 201

    decoy.verify(
        task_runner.run(engine_store.runner.stop),
        subject.update(run=next_run),
    )
