"""Tests for RunDataManager."""
from typing import List

import pytest
from datetime import datetime
from decoy import Decoy, matchers

from opentrons.protocol_engine import (
    EngineStatus,
    ProtocolRunData,
    commands as pe_commands,
)
from opentrons.protocol_runner import PlayType, ProtocolRunResult

from robot_server.runs.action_models import RunAction, RunActionType
from robot_server.runs.engine_store import EngineStore, EngineConflictError
from robot_server.runs.run_data_manager import RunDataManager
from robot_server.runs.run_models import Run
from robot_server.runs.run_store import RunStore, RunResource
from robot_server.service.task_runner import TaskRunner


@pytest.fixture
def mock_engine_store(decoy: Decoy) -> EngineStore:
    """Get a mock EngineStore."""
    return decoy.mock(cls=EngineStore)


@pytest.fixture
def mock_run_store(decoy: Decoy) -> RunStore:
    """Get a mock RunStore."""
    return decoy.mock(cls=RunStore)


@pytest.fixture()
def mock_task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mock background TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture
def subject(
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    mock_task_runner: TaskRunner,
) -> RunDataManager:
    """Get a RunDataManager test subject."""
    return RunDataManager(
        engine_store=mock_engine_store,
        run_store=mock_run_store,
        task_runner=mock_task_runner,
    )


@pytest.fixture
def protocol_run_data() -> ProtocolRunData:
    """Get a ProtocolRunData value object."""
    return ProtocolRunData(
        status=EngineStatus.IDLE,
        errors=[],
        labware=[],
        labwareOffsets=[],
        pipettes=[],
        modules=[],
    )


@pytest.fixture
def protocol_commands() -> List[pe_commands.Command]:
    """Get a ProtocolRunData value object."""
    return [
        pe_commands.Pause.construct(  # type: ignore[call-arg]
            params=pe_commands.PauseParams(message="hello world")
        )
    ]


@pytest.fixture
def run_resource() -> RunResource:
    """Get a ProtocolRunData value object."""
    return RunResource(
        run_id="the other side",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2),
        actions=[],
        is_current=True,
    )


async def test_create_and_get_active(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    protocol_run_data: ProtocolRunData,
    run_resource: RunResource,
) -> None:
    """It should create an engine and a persisted run resource."""
    run_id = "hello from"
    created_at = datetime(year=2021, month=1, day=1)

    decoy.when(await mock_engine_store.create(run_id)).then_return(protocol_run_data)
    decoy.when(
        mock_run_store.insert(
            RunResource(
                run_id=run_id,
                protocol_id=None,
                created_at=created_at,
                actions=[],
                is_current=True,
            )
        )
    ).then_return(run_resource)

    result = await subject.create(
        run_id=run_id,
        created_at=created_at,
        labware_offsets=[],
        protocol=None,
    )

    assert result == Run(
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        current=run_resource.is_current,
        actions=run_resource.actions,
        status=protocol_run_data.status,
        errors=protocol_run_data.errors,
        labware=protocol_run_data.labware,
        labwareOffsets=protocol_run_data.labwareOffsets,
        pipettes=protocol_run_data.pipettes,
    )


async def test_create_engine_error(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should not create a resource if engine creation fails."""
    run_id = "hello from"
    created_at = datetime(year=2021, month=1, day=1)

    decoy.when(await mock_engine_store.create(run_id)).then_raise(
        EngineConflictError("oh no")
    )

    with pytest.raises(EngineConflictError):
        await subject.create(
            run_id=run_id,
            created_at=created_at,
            labware_offsets=[],
            protocol=None,
        )

    decoy.verify(mock_run_store.insert(matchers.Anything()), times=0)


async def test_get_current_run(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    protocol_run_data: ProtocolRunData,
    run_resource: RunResource,
) -> None:
    """It should get the current run from the engine."""
    run_id = "hello from"

    decoy.when(mock_run_store.get(run_id)).then_return(run_resource)
    decoy.when(mock_engine_store.engine.state_view.get_protocol_run_data()).then_return(
        protocol_run_data
    )
    decoy.when(mock_engine_store.current_run_id).then_return(run_id)

    result = subject.get(run_id)

    assert result == Run(
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        current=run_resource.is_current,
        actions=run_resource.actions,
        status=protocol_run_data.status,
        errors=protocol_run_data.errors,
        labware=protocol_run_data.labware,
        labwareOffsets=protocol_run_data.labwareOffsets,
        pipettes=protocol_run_data.pipettes,
    )


async def test_get_historical_run(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    protocol_run_data: ProtocolRunData,
    run_resource: RunResource,
) -> None:
    """It should get the current run from the engine."""
    run_id = "hello from"

    decoy.when(mock_run_store.get(run_id)).then_return(run_resource)
    decoy.when(mock_run_store.get_run_data(run_id)).then_return(protocol_run_data)
    decoy.when(mock_engine_store.current_run_id).then_return("some other id")

    result = subject.get(run_id)

    assert result == Run(
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        current=run_resource.is_current,
        actions=run_resource.actions,
        status=protocol_run_data.status,
        errors=protocol_run_data.errors,
        labware=protocol_run_data.labware,
        labwareOffsets=protocol_run_data.labwareOffsets,
        pipettes=protocol_run_data.pipettes,
    )


async def test_create_play_action_to_resume(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should resume a run."""
    run_id = "hello from"

    decoy.when(mock_engine_store.current_run_id).then_return(run_id)

    result = subject.create_action(
        run_id=run_id,
        action_id="some-action-id",
        action_type=RunActionType.PLAY,
        created_at=datetime(year=2021, month=1, day=1),
    )

    assert result == RunAction(
        id="some-action-id",
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2021, month=1, day=1),
    )

    decoy.verify(mock_engine_store.runner.play(), times=1)
    decoy.verify(await mock_engine_store.runner.run(), times=0)


async def test_create_play_action_to_start(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    mock_task_runner: TaskRunner,
    subject: RunDataManager,
    protocol_run_data: ProtocolRunData,
    protocol_commands: List[pe_commands.Command],
) -> None:
    """It should resume a run."""
    run_id = "hello from"

    decoy.when(mock_engine_store.current_run_id).then_return(run_id)
    decoy.when(mock_engine_store.runner.play()).then_return(PlayType.START)

    result = subject.create_action(
        run_id=run_id,
        action_id="some-action-id",
        action_type=RunActionType.PLAY,
        created_at=datetime(year=2021, month=1, day=1),
    )

    assert result == RunAction(
        id="some-action-id",
        actionType=RunActionType.PLAY,
        createdAt=datetime(year=2021, month=1, day=1),
    )

    background_task_captor = matchers.Captor()
    decoy.verify(mock_task_runner.run(background_task_captor, run_id=run_id))

    decoy.when(await mock_engine_store.runner.run()).then_return(
        ProtocolRunResult(
            commands=protocol_commands,
            data=protocol_run_data,
        )
    )

    await background_task_captor.value(run_id=run_id)
    decoy.verify(
        mock_run_store.update_run_state(
            run_id=run_id,
            run_data=protocol_run_data,
            commands=protocol_commands,
        ),
    )


# @pytest.fixture
# def task_runner(decoy: Decoy) -> TaskRunner:
#     """Get a mock background TaskRunner."""
#     return decoy.mock(cls=TaskRunner)


# @pytest.fixture
# def prev_run(decoy: Decoy, mock_run_store: RunStore) -> RunResource:
#     """Get an existing run resource that's in the store."""
#     run = RunResource(
#         run_id="run-id",
#         protocol_id=None,
#         created_at=datetime(year=2021, month=1, day=1),
#         actions=[],
#         is_current=True,
#     )

#     decoy.when(mock_run_store.get(run_id="run-id")).then_return(run)

#     return run


# async def test_create_play_action_to_start_run(
#     decoy: Decoy,
#     mock_run_data_manager: RunDataManager,
#     prev_run: Run,
#     task_runner: TaskRunner,
# ) -> None:
#     """It should handle a play action that start the runner."""
#     action = RunAction(
#         actionType=RunActionType.PLAY,
#         createdAt=datetime(year=2022, month=2, day=2),
#         id="action-id",
#     )

#     # decoy.when(mock_run_data_manager.runner.was_started()).then_return(False)
#     decoy.when(mock_run_data_manager.get("run-id")).then_return(prev_run)
#     result = await create_run_action(
#         runId="run-id",
#         request_body=RequestModel(data=RunActionCreate(actionType=RunActionType.PLAY)),
#         run_data_manager=mock_run_data_manager,
#         action_id="action-id",
#         created_at=datetime(year=2022, month=2, day=2),
#     )

#     assert result.content.data == action
#     assert result.status_code == 201

#     # run_handler_captor = matchers.Captor()
#     #
#     # decoy.verify(
#     #     task_runner.run(run_handler_captor),
#     #     mock_run_data_manager.insert_action(run_id=prev_run.run_id, action=action),
#     # )
#     #
#     # await run_handler_captor.value()
#     #
#     # decoy.verify(await mock_run_data_manager.runner.run(), times=1)


# async def test_create_play_action_to_resume_run(
#     decoy: Decoy,
#     mock_run_data_manager: RunDataManager,
#     prev_run: RunResource,
# ) -> None:
#     """It should handle a play action that resumes the runner."""
#     action = RunAction(
#         actionType=RunActionType.PLAY,
#         createdAt=datetime(year=2022, month=2, day=2),
#         id="action-id",
#     )

#     # decoy.when(mock_run_data_manager.runner.was_started()).then_return(True)

#     result = await create_run_action(
#         runId="run-id",
#         request_body=RequestModel(data=RunActionCreate(actionType=RunActionType.PLAY)),
#         run_data_manager=mock_run_data_manager,
#         action_id="action-id",
#         created_at=datetime(year=2022, month=2, day=2),
#     )

#     assert result.content.data == action
#     assert result.status_code == 201

#     # decoy.verify(
#     #     mock_run_data_manager.runner.play(),
#     #     mock_run_data_manager.insert_action(run_id=prev_run.run_id, action=action),
#     # )


# async def test_create_pause_action(
#     decoy: Decoy,
#     mock_run_data_manager: RunDataManager,
#     prev_run: RunResource,
# ) -> None:
#     """It should handle a pause action."""
#     action = RunAction(
#         actionType=RunActionType.PAUSE,
#         createdAt=datetime(year=2022, month=2, day=2),
#         id="action-id",
#     )

#     result = await create_run_action(
#         runId="run-id",
#         request_body=RequestModel(data=RunActionCreate(actionType=RunActionType.PAUSE)),
#         run_data_manager=mock_run_data_manager,
#         action_id="action-id",
#         created_at=datetime(year=2022, month=2, day=2),
#     )

#     assert result.content.data == action
#     assert result.status_code == 201

#     # decoy.verify(
#     #     mock_engine_store.runner.pause(),
#     #     mock_run_store.insert_action(run_id=prev_run.run_id, action=action),
#     # )


# async def test_create_stop_action(
#     decoy: Decoy,
#     mock_run_data_manager: RunDataManager,
#     prev_run: RunResource,
#     task_runner: TaskRunner,
# ) -> None:
#     """It should handle a stop action."""
#     action = RunAction(
#         actionType=RunActionType.STOP,
#         createdAt=datetime(year=2022, month=2, day=2),
#         id="action-id",
#     )

#     result = await create_run_action(
#         runId="run-id",
#         request_body=RequestModel(data=RunActionCreate(actionType=RunActionType.STOP)),
#         run_data_manager=mock_run_data_manager,
#         action_id="action-id",
#         created_at=datetime(year=2022, month=2, day=2),
#     )

#     assert result.content.data == action
#     assert result.status_code == 201

#     # decoy.verify(
#     #     task_runner.run(mock_engine_store.runner.stop),
#     #     mock_run_store.insert_action(run_id=prev_run.run_id, action=action),
#     # )
