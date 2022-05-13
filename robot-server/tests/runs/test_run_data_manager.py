"""Tests for RunDataManager."""
import pytest
from datetime import datetime
from decoy import Decoy, matchers

from opentrons.protocol_engine import EngineStatus, ProtocolRunData, commands

from robot_server.runs.engine_store import EngineStore, EngineConflictError
from robot_server.runs.run_data_manager import RunDataManager, RunNotCurrentError
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
def run_resource() -> RunResource:
    """Get a ProtocolRunData value object."""
    return RunResource(
        run_id="hello from the other side",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2),
        actions=[],
    )


@pytest.fixture
def run_command() -> commands.Command:
    """Get a ProtocolEngine Command value object."""
    return commands.Pause(
        id="command-id",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=commands.CommandStatus.SUCCEEDED,
        params=commands.PauseParams(message="Hello"),
    )


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


async def test_create_and_get_active(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    protocol_run_data: ProtocolRunData,
    run_resource: RunResource,
) -> None:
    """It should create an engine and a persisted run resource."""
    run_id = "hello world"
    created_at = datetime(year=2021, month=1, day=1)

    decoy.when(await mock_engine_store.create(run_id)).then_return(protocol_run_data)
    decoy.when(
        mock_run_store.insert(
            run_id=run_id,
            protocol_id=None,
            created_at=created_at,
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
        current=True,
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
    run_id = "hello world"
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

    decoy.verify(
        mock_run_store.insert(
            run_id=run_id,
            created_at=matchers.Anything(),
            protocol_id=matchers.Anything(),
        ),
        times=0,
    )


async def test_get_current_run(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    protocol_run_data: ProtocolRunData,
    run_resource: RunResource,
) -> None:
    """It should get the current run from the engine."""
    run_id = "hello world"

    decoy.when(mock_run_store.get(run_id)).then_return(run_resource)
    decoy.when(mock_engine_store.current_run_id).then_return(run_id)
    decoy.when(mock_engine_store.engine.state_view.get_protocol_run_data()).then_return(
        protocol_run_data
    )

    result = subject.get(run_id)

    assert result == Run(
        current=True,
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=protocol_run_data.status,
        errors=protocol_run_data.errors,
        labware=protocol_run_data.labware,
        labwareOffsets=protocol_run_data.labwareOffsets,
        pipettes=protocol_run_data.pipettes,
    )
    assert subject.current_run_id == run_id


async def test_get_historical_run(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    protocol_run_data: ProtocolRunData,
    run_resource: RunResource,
) -> None:
    """It should get a historical run from the store."""
    run_id = "hello world"

    decoy.when(mock_run_store.get(run_id)).then_return(run_resource)
    decoy.when(mock_run_store.get_run_data(run_id)).then_return(protocol_run_data)
    decoy.when(mock_engine_store.current_run_id).then_return("some other id")

    result = subject.get(run_id)

    assert result == Run(
        current=False,
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=protocol_run_data.status,
        errors=protocol_run_data.errors,
        labware=protocol_run_data.labware,
        labwareOffsets=protocol_run_data.labwareOffsets,
        pipettes=protocol_run_data.pipettes,
    )


async def test_get_historical_run_no_data(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    run_resource: RunResource,
) -> None:
    """It should get a historical run from the store."""
    run_id = "hello world"

    decoy.when(mock_run_store.get(run_id)).then_return(run_resource)
    decoy.when(mock_run_store.get_run_data(run_id)).then_return(None)
    decoy.when(mock_engine_store.current_run_id).then_return("some other id")

    result = subject.get(run_id)

    assert result == Run(
        current=False,
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=EngineStatus.STOPPED,
        errors=[],
        labware=[],
        labwareOffsets=[],
        pipettes=[],
    )


async def test_get_all_runs(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should get all runs, including current and historical."""
    current_run_data = ProtocolRunData(
        status=EngineStatus.IDLE,
        errors=[],
        labware=[],
        labwareOffsets=[],
        pipettes=[],
        modules=[],
    )

    historical_run_data = ProtocolRunData(
        status=EngineStatus.STOPPED,
        errors=[],
        labware=[],
        labwareOffsets=[],
        pipettes=[],
        modules=[],
    )

    current_run_resource = RunResource(
        run_id="current-run",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2),
        actions=[],
    )

    historical_run_resource = RunResource(
        run_id="historical-run",
        protocol_id=None,
        created_at=datetime(year=2023, month=3, day=3),
        actions=[],
    )

    decoy.when(mock_engine_store.current_run_id).then_return("current-run")
    decoy.when(mock_engine_store.engine.state_view.get_protocol_run_data()).then_return(
        current_run_data
    )
    decoy.when(mock_run_store.get_run_data("historical-run")).then_return(
        historical_run_data
    )
    decoy.when(mock_run_store.get_all()).then_return(
        [historical_run_resource, current_run_resource]
    )

    result = subject.get_all()

    assert result == [
        Run(
            current=False,
            id=historical_run_resource.run_id,
            protocolId=historical_run_resource.protocol_id,
            createdAt=historical_run_resource.created_at,
            actions=historical_run_resource.actions,
            status=historical_run_data.status,
            errors=historical_run_data.errors,
            labware=historical_run_data.labware,
            labwareOffsets=historical_run_data.labwareOffsets,
            pipettes=historical_run_data.pipettes,
        ),
        Run(
            current=True,
            id=current_run_resource.run_id,
            protocolId=current_run_resource.protocol_id,
            createdAt=current_run_resource.created_at,
            actions=current_run_resource.actions,
            status=current_run_data.status,
            errors=current_run_data.errors,
            labware=current_run_data.labware,
            labwareOffsets=current_run_data.labwareOffsets,
            pipettes=current_run_data.pipettes,
        ),
    ]


async def test_delete_current_run(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should delete the current run from the engine."""
    run_id = "hello world"
    decoy.when(mock_engine_store.current_run_id).then_return(run_id)

    await subject.delete(run_id)

    decoy.verify(await mock_engine_store.clear(), times=1)
    decoy.verify(mock_run_store.remove(run_id), times=0)


async def test_delete_historical_run(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should delete a historical run from the store."""
    run_id = "hello world"
    decoy.when(mock_engine_store.current_run_id).then_return("some other id")

    await subject.delete(run_id)

    decoy.verify(await mock_engine_store.clear(), times=0)
    decoy.verify(mock_run_store.remove(run_id), times=1)


async def test_update_current(
    decoy: Decoy,
    protocol_run_data: ProtocolRunData,
    run_resource: RunResource,
    run_command: commands.Command,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should persist the current run and clear the engine on current=false."""
    run_id = "hello world"
    decoy.when(mock_engine_store.current_run_id).then_return(run_id)
    decoy.when(mock_engine_store.engine.state_view.get_protocol_run_data()).then_return(
        protocol_run_data
    )
    decoy.when(mock_engine_store.engine.state_view.commands.get_all()).then_return(
        [run_command]
    )
    decoy.when(
        mock_run_store.update_run_state(
            run_id=run_id, run_data=protocol_run_data, commands=[run_command]
        )
    ).then_return(run_resource)

    result = await subject.update(run_id=run_id, current=False)

    decoy.verify(
        await mock_engine_store.clear(),
    )

    assert result == Run(
        current=False,
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=protocol_run_data.status,
        errors=protocol_run_data.errors,
        labware=protocol_run_data.labware,
        labwareOffsets=protocol_run_data.labwareOffsets,
        pipettes=protocol_run_data.pipettes,
    )


async def test_update_current_noop(
    decoy: Decoy,
    protocol_run_data: ProtocolRunData,
    run_resource: RunResource,
    run_command: commands.Command,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should noop on current=None."""
    run_id = "hello world"
    decoy.when(mock_engine_store.current_run_id).then_return(run_id)
    decoy.when(mock_engine_store.engine.state_view.get_protocol_run_data()).then_return(
        protocol_run_data
    )
    decoy.when(mock_run_store.get(run_id)).then_return(run_resource)

    result = await subject.update(run_id=run_id, current=None)

    decoy.verify(await mock_engine_store.clear(), times=0)
    decoy.verify(
        mock_run_store.update_run_state(
            run_id=run_id,
            run_data=matchers.Anything(),
            commands=matchers.Anything(),
        ),
        times=0,
    )

    assert result == Run(
        current=True,
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=protocol_run_data.status,
        errors=protocol_run_data.errors,
        labware=protocol_run_data.labware,
        labwareOffsets=protocol_run_data.labwareOffsets,
        pipettes=protocol_run_data.pipettes,
    )


async def test_update_current_not_allowed(
    decoy: Decoy,
    protocol_run_data: ProtocolRunData,
    run_resource: RunResource,
    run_command: commands.Command,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should noop on current=None."""
    run_id = "hello world"
    decoy.when(mock_engine_store.current_run_id).then_return("some other id")

    with pytest.raises(RunNotCurrentError):
        await subject.update(run_id=run_id, current=False)
