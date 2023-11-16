"""Tests for RunController."""
from typing import List

import pytest
from datetime import datetime
from decoy import Decoy, matchers

from opentrons.protocol_engine import (
    EngineStatus,
    StateSummary,
    commands as pe_commands,
    errors as pe_errors,
)
from opentrons.protocol_runner import RunResult, JsonRunner, PythonAndLegacyRunner

from robot_server.service.task_runner import TaskRunner
from robot_server.runs.action_models import RunAction, RunActionType
from robot_server.runs.engine_store import EngineStore
from robot_server.runs.run_store import RunStore
from robot_server.runs.run_controller import RunController, RunActionNotAllowedError


@pytest.fixture
def mock_engine_store(decoy: Decoy, run_id: str) -> EngineStore:
    """Get a mock EngineStore."""
    mock = decoy.mock(cls=EngineStore)
    decoy.when(mock.current_run_id).then_return(run_id)
    return mock


@pytest.fixture
def mock_run_store(decoy: Decoy) -> RunStore:
    """Get a mock RunStore."""
    return decoy.mock(cls=RunStore)


@pytest.fixture
def mock_task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mock background TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture
def run_id() -> str:
    """A run identifier value."""
    return "hello world"


@pytest.fixture
def engine_state_summary() -> StateSummary:
    """Get a StateSummary value object."""
    return StateSummary(
        status=EngineStatus.IDLE,
        errors=[],
        labware=[],
        labwareOffsets=[],
        pipettes=[],
        modules=[],
        liquids=[],
    )


@pytest.fixture
def protocol_commands() -> List[pe_commands.Command]:
    """Get a StateSummary value object."""
    return [
        pe_commands.WaitForResume.construct(  # type: ignore[call-arg]
            params=pe_commands.WaitForResumeParams(message="hello world")
        )
    ]


@pytest.fixture
def subject(
    run_id: str,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    mock_task_runner: TaskRunner,
) -> RunController:
    """Get a RunController test subject."""
    return RunController(
        run_id=run_id,
        engine_store=mock_engine_store,
        run_store=mock_run_store,
        task_runner=mock_task_runner,
    )


async def test_create_play_action_to_resume(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    run_id: str,
    subject: RunController,
) -> None:
    """It should resume a run."""
    mock_json_runner = decoy.mock(cls=JsonRunner)
    decoy.when(mock_engine_store.runner).then_return(mock_json_runner)
    decoy.when(mock_json_runner.was_started()).then_return(True)

    result = subject.create_action(
        action_id="some-action-id",
        action_type=RunActionType.PLAY,
        created_at=datetime(year=2021, month=1, day=1),
        action_payload=[],
    )

    assert result == RunAction(
        id="some-action-id",
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2021, month=1, day=1),
    )

    decoy.verify(mock_run_store.insert_action(run_id, result), times=1)
    decoy.verify(mock_json_runner.play(), times=1)
    decoy.verify(await mock_json_runner.run(deck_configuration=[]), times=0)


async def test_create_play_action_to_start(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    mock_task_runner: TaskRunner,
    engine_state_summary: StateSummary,
    protocol_commands: List[pe_commands.Command],
    run_id: str,
    subject: RunController,
) -> None:
    """It should start a run."""
    mock_python_runner = decoy.mock(cls=PythonAndLegacyRunner)
    decoy.when(mock_engine_store.runner).then_return(mock_python_runner)
    decoy.when(mock_python_runner.was_started()).then_return(False)

    result = subject.create_action(
        action_id="some-action-id",
        action_type=RunActionType.PLAY,
        created_at=datetime(year=2021, month=1, day=1),
        action_payload=[],
    )

    assert result == RunAction(
        id="some-action-id",
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2021, month=1, day=1),
    )

    decoy.verify(mock_run_store.insert_action(run_id, result), times=1)

    background_task_captor = matchers.Captor()
    decoy.verify(mock_task_runner.run(background_task_captor, deck_configuration=[]))

    decoy.when(await mock_python_runner.run(deck_configuration=[])).then_return(
        RunResult(
            commands=protocol_commands,
            state_summary=engine_state_summary,
        )
    )

    await background_task_captor.value(deck_configuration=[])

    decoy.verify(
        mock_run_store.update_run_state(
            run_id=run_id,
            summary=engine_state_summary,
            commands=protocol_commands,
        ),
        times=1,
    )


async def test_create_pause_action(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    run_id: str,
    subject: RunController,
) -> None:
    """It should resume a run."""
    result = subject.create_action(
        action_id="some-action-id",
        action_type=RunActionType.PAUSE,
        created_at=datetime(year=2021, month=1, day=1),
        action_payload=[],
    )

    assert result == RunAction(
        id="some-action-id",
        actionType=RunActionType.PAUSE,
        createdAt=datetime(year=2021, month=1, day=1),
    )

    decoy.verify(mock_run_store.insert_action(run_id, result), times=1)
    decoy.verify(mock_engine_store.runner.pause(), times=1)


async def test_create_stop_action(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    mock_task_runner: TaskRunner,
    run_id: str,
    subject: RunController,
) -> None:
    """It should resume a run."""
    result = subject.create_action(
        action_id="some-action-id",
        action_type=RunActionType.STOP,
        created_at=datetime(year=2021, month=1, day=1),
        action_payload=[],
    )

    assert result == RunAction(
        id="some-action-id",
        actionType=RunActionType.STOP,
        createdAt=datetime(year=2021, month=1, day=1),
    )

    decoy.verify(mock_run_store.insert_action(run_id, result), times=1)
    decoy.verify(mock_task_runner.run(mock_engine_store.runner.stop), times=1)


@pytest.mark.parametrize(
    ("action_type", "exception"),
    [
        (RunActionType.PLAY, pe_errors.RobotDoorOpenError("oh no")),
        (RunActionType.PLAY, pe_errors.RunStoppedError("oh no")),
        (RunActionType.PAUSE, pe_errors.RunStoppedError("oh no")),
    ],
)
async def test_action_not_allowed(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    mock_task_runner: TaskRunner,
    run_id: str,
    subject: RunController,
    action_type: RunActionType,
    exception: Exception,
) -> None:
    """It should raise a RunActionNotAllowedError if a play/pause action is rejected."""
    decoy.when(mock_engine_store.runner.was_started()).then_return(True)
    decoy.when(mock_engine_store.runner.play()).then_raise(exception)
    decoy.when(mock_engine_store.runner.pause()).then_raise(exception)

    with pytest.raises(RunActionNotAllowedError, match="oh no"):
        subject.create_action(
            action_id="whatever",
            action_type=action_type,
            created_at=datetime(year=2021, month=1, day=1),
            action_payload=[],
        )
