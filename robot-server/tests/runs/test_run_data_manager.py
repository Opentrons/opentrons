"""Tests for RunDataManager."""
from typing import Optional, List

import pytest
from datetime import datetime
from decoy import Decoy, matchers

from opentrons.types import DeckSlotName
from opentrons.protocol_runner import RunResult
from opentrons.protocol_engine import (
    EngineStatus,
    StateSummary,
    commands,
    types as pe_types,
    CommandSlice,
    CommandPointer,
    ErrorOccurrence,
    LoadedLabware,
    LoadedPipette,
    LoadedModule,
    LabwareOffset,
)

from robot_server.protocols.protocol_store import ProtocolResource
from robot_server.runs.engine_store import EngineStore, EngineConflictError
from robot_server.runs.run_data_manager import (
    RunDataManager,
    RunNotCurrentError,
    PreSerializedCommandsNotAvailableError,
)
from robot_server.runs.run_models import Run, BadRun, RunNotFoundError, RunDataError
from robot_server.runs.run_store import (
    RunStore,
    RunResource,
    CommandNotFoundError,
    BadStateSummary,
)
from robot_server.service.task_runner import TaskRunner
from robot_server.service.notifications import RunsPublisher

from opentrons.protocol_engine import Liquid

from opentrons_shared_data.labware.labware_definition import LabwareDefinition
from opentrons_shared_data.errors.exceptions import InvalidStoredData


def mock_notify_publishers() -> None:
    """A mock notify_publishers."""
    return None


@pytest.fixture
def mock_engine_store(decoy: Decoy) -> EngineStore:
    """Get a mock EngineStore."""
    mock = decoy.mock(cls=EngineStore)
    decoy.when(mock.current_run_id).then_return(None)
    return mock


@pytest.fixture
def mock_run_store(decoy: Decoy) -> RunStore:
    """Get a mock RunStore."""
    return decoy.mock(cls=RunStore)


@pytest.fixture()
def mock_task_runner(decoy: Decoy) -> TaskRunner:
    """Get a mock background TaskRunner."""
    return decoy.mock(cls=TaskRunner)


@pytest.fixture()
def mock_runs_publisher(decoy: Decoy) -> RunsPublisher:
    """Get a mock RunsPublisher."""
    return decoy.mock(cls=RunsPublisher)


@pytest.fixture
def engine_state_summary() -> StateSummary:
    """Get a StateSummary value object."""
    return StateSummary(
        status=EngineStatus.IDLE,
        errors=[ErrorOccurrence.construct(id="some-error-id")],  # type: ignore[call-arg]
        labware=[LoadedLabware.construct(id="some-labware-id")],  # type: ignore[call-arg]
        labwareOffsets=[LabwareOffset.construct(id="some-labware-offset-id")],  # type: ignore[call-arg]
        pipettes=[LoadedPipette.construct(id="some-pipette-id")],  # type: ignore[call-arg]
        modules=[LoadedModule.construct(id="some-module-id")],  # type: ignore[call-arg]
        liquids=[Liquid(id="some-liquid-id", displayName="liquid", description="desc")],
    )


@pytest.fixture()
def run_time_parameters() -> List[pe_types.RunTimeParameter]:
    """Get a RunTimeParameter list."""
    return [
        pe_types.BooleanParameter(
            displayName="Display Name",
            variableName="variable_name",
            value=False,
            default=True,
        )
    ]


@pytest.fixture
def run_resource() -> RunResource:
    """Get a StateSummary value object."""
    return RunResource(
        ok=True,
        run_id="hello from the other side",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2),
        actions=[],
    )


@pytest.fixture
def run_command() -> commands.Command:
    """Get a ProtocolEngine Command value object."""
    return commands.WaitForResume(
        id="command-id",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=commands.CommandStatus.SUCCEEDED,
        params=commands.WaitForResumeParams(message="Hello"),
    )


@pytest.fixture
def subject(
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    mock_task_runner: TaskRunner,
    mock_runs_publisher: RunsPublisher,
) -> RunDataManager:
    """Get a RunDataManager test subject."""
    return RunDataManager(
        engine_store=mock_engine_store,
        run_store=mock_run_store,
        task_runner=mock_task_runner,
        runs_publisher=mock_runs_publisher,
    )


async def test_create(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    engine_state_summary: StateSummary,
    run_resource: RunResource,
) -> None:
    """It should create an engine and a persisted run resource."""
    run_id = "hello world"
    created_at = datetime(year=2021, month=1, day=1)

    decoy.when(
        await mock_engine_store.create(
            run_id=run_id,
            labware_offsets=[],
            protocol=None,
            deck_configuration=[],
            run_time_param_values=None,
            notify_publishers=mock_notify_publishers,
        )
    ).then_return(engine_state_summary)
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
        deck_configuration=[],
        run_time_param_values=None,
        notify_publishers=mock_notify_publishers,
    )

    assert result == Run(
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        current=True,
        actions=run_resource.actions,
        status=engine_state_summary.status,
        errors=engine_state_summary.errors,
        labware=engine_state_summary.labware,
        labwareOffsets=engine_state_summary.labwareOffsets,
        pipettes=engine_state_summary.pipettes,
        modules=engine_state_summary.modules,
        liquids=engine_state_summary.liquids,
    )


async def test_create_with_options(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    engine_state_summary: StateSummary,
    run_resource: RunResource,
) -> None:
    """It should handle creation with a protocol, labware offsets and parameters."""
    run_id = "hello world"
    created_at = datetime(year=2021, month=1, day=1)

    protocol = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2022, month=2, day=2),
        source=None,  # type: ignore[arg-type]
        protocol_key=None,
        protocol_kind="standard",
    )

    labware_offset = pe_types.LabwareOffsetCreate(
        definitionUri="namespace/load_name/version",
        location=pe_types.LabwareOffsetLocation(slotName=DeckSlotName.SLOT_5),
        vector=pe_types.LabwareOffsetVector(x=1, y=2, z=3),
    )

    decoy.when(
        await mock_engine_store.create(
            run_id=run_id,
            labware_offsets=[labware_offset],
            protocol=protocol,
            deck_configuration=[],
            run_time_param_values={"foo": "bar"},
            notify_publishers=mock_notify_publishers,
        )
    ).then_return(engine_state_summary)

    decoy.when(
        mock_run_store.insert(
            run_id=run_id,
            protocol_id="protocol-id",
            created_at=created_at,
        )
    ).then_return(run_resource)

    result = await subject.create(
        run_id=run_id,
        created_at=created_at,
        labware_offsets=[labware_offset],
        protocol=protocol,
        deck_configuration=[],
        run_time_param_values={"foo": "bar"},
        notify_publishers=mock_notify_publishers,
    )

    assert result == Run(
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        current=True,
        actions=run_resource.actions,
        status=engine_state_summary.status,
        errors=engine_state_summary.errors,
        labware=engine_state_summary.labware,
        labwareOffsets=engine_state_summary.labwareOffsets,
        pipettes=engine_state_summary.pipettes,
        modules=engine_state_summary.modules,
        liquids=engine_state_summary.liquids,
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

    decoy.when(
        await mock_engine_store.create(
            run_id,
            labware_offsets=[],
            protocol=None,
            deck_configuration=[],
            run_time_param_values=None,
            notify_publishers=mock_notify_publishers,
        )
    ).then_raise(EngineConflictError("oh no"))

    with pytest.raises(EngineConflictError):
        await subject.create(
            run_id=run_id,
            created_at=created_at,
            labware_offsets=[],
            protocol=None,
            deck_configuration=[],
            run_time_param_values=None,
            notify_publishers=mock_notify_publishers,
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
    engine_state_summary: StateSummary,
    run_time_parameters: List[pe_types.RunTimeParameter],
    run_resource: RunResource,
) -> None:
    """It should get the current run from the engine."""
    run_id = "hello world"

    decoy.when(mock_run_store.get(run_id=run_id)).then_return(run_resource)
    decoy.when(mock_engine_store.current_run_id).then_return(run_id)
    decoy.when(mock_engine_store.get_state_summary()).then_return(engine_state_summary)
    decoy.when(mock_engine_store.get_run_time_parameters()).then_return(
        run_time_parameters
    )

    result = subject.get(run_id=run_id)

    assert result == Run(
        current=True,
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=engine_state_summary.status,
        errors=engine_state_summary.errors,
        labware=engine_state_summary.labware,
        labwareOffsets=engine_state_summary.labwareOffsets,
        pipettes=engine_state_summary.pipettes,
        modules=engine_state_summary.modules,
        liquids=engine_state_summary.liquids,
        runTimeParameters=run_time_parameters,
    )
    assert subject.current_run_id == run_id


async def test_get_historical_run(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    engine_state_summary: StateSummary,
    run_time_parameters: List[pe_types.RunTimeParameter],
    run_resource: RunResource,
) -> None:
    """It should get a historical run from the store."""
    run_id = "hello world"

    decoy.when(mock_run_store.get(run_id=run_id)).then_return(run_resource)
    decoy.when(mock_run_store.get_state_summary(run_id=run_id)).then_return(
        engine_state_summary
    )
    decoy.when(mock_run_store.get_run_time_parameters(run_id=run_id)).then_return(
        run_time_parameters
    )
    decoy.when(mock_engine_store.current_run_id).then_return("some other id")

    result = subject.get(run_id=run_id)

    assert result == Run(
        current=False,
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=engine_state_summary.status,
        errors=engine_state_summary.errors,
        labware=engine_state_summary.labware,
        labwareOffsets=engine_state_summary.labwareOffsets,
        pipettes=engine_state_summary.pipettes,
        modules=engine_state_summary.modules,
        liquids=engine_state_summary.liquids,
        runTimeParameters=run_time_parameters,
    )


async def test_get_historical_run_no_data(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
    run_resource: RunResource,
    run_time_parameters: List[pe_types.RunTimeParameter],
) -> None:
    """It should get a historical run from the store."""
    run_id = "hello world"

    state_exc = InvalidStoredData("Oh no!")
    run_error = RunDataError.from_exc(state_exc)
    decoy.when(mock_run_store.get(run_id=run_id)).then_return(run_resource)
    decoy.when(mock_run_store.get_state_summary(run_id=run_id)).then_return(
        BadStateSummary(dataError=state_exc)
    )
    decoy.when(mock_run_store.get_run_time_parameters(run_id=run_id)).then_return(
        run_time_parameters
    )
    decoy.when(mock_engine_store.current_run_id).then_return("some other id")

    result = subject.get(run_id=run_id)

    assert result == BadRun(
        dataError=run_error,
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
        modules=[],
        liquids=[],
        runTimeParameters=run_time_parameters,
    )


async def test_get_all_runs(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should get all runs, including current and historical."""
    current_run_data = StateSummary(
        status=EngineStatus.IDLE,
        errors=[ErrorOccurrence.construct(id="current-error-id")],  # type: ignore[call-arg]
        labware=[LoadedLabware.construct(id="current-labware-id")],  # type: ignore[call-arg]
        labwareOffsets=[LabwareOffset.construct(id="current-labware-offset-id")],  # type: ignore[call-arg]
        pipettes=[LoadedPipette.construct(id="current-pipette-id")],  # type: ignore[call-arg]
        modules=[LoadedModule.construct(id="current-module-id")],  # type: ignore[call-arg]
        liquids=[Liquid(id="some-liquid-id", displayName="liquid", description="desc")],
    )
    current_run_time_parameters: List[pe_types.RunTimeParameter] = [
        pe_types.BooleanParameter(
            displayName="Current Bool",
            variableName="current bool",
            value=False,
            default=True,
        )
    ]

    historical_run_data = StateSummary(
        status=EngineStatus.STOPPED,
        errors=[ErrorOccurrence.construct(id="old-error-id")],  # type: ignore[call-arg]
        labware=[LoadedLabware.construct(id="old-labware-id")],  # type: ignore[call-arg]
        labwareOffsets=[LabwareOffset.construct(id="old-labware-offset-id")],  # type: ignore[call-arg]
        pipettes=[LoadedPipette.construct(id="old-pipette-id")],  # type: ignore[call-arg]
        modules=[LoadedModule.construct(id="old-module-id")],  # type: ignore[call-arg]
        liquids=[],
    )
    historical_run_time_parameters: List[pe_types.RunTimeParameter] = [
        pe_types.BooleanParameter(
            displayName="Old Bool",
            variableName="Old bool",
            value=True,
            default=False,
        )
    ]

    current_run_resource = RunResource(
        ok=True,
        run_id="current-run",
        protocol_id=None,
        created_at=datetime(year=2022, month=2, day=2),
        actions=[],
    )

    historical_run_resource = RunResource(
        ok=True,
        run_id="historical-run",
        protocol_id=None,
        created_at=datetime(year=2023, month=3, day=3),
        actions=[],
    )

    decoy.when(mock_engine_store.current_run_id).then_return("current-run")
    decoy.when(mock_engine_store.get_state_summary()).then_return(current_run_data)
    decoy.when(mock_engine_store.get_run_time_parameters()).then_return(
        current_run_time_parameters
    )
    decoy.when(mock_run_store.get_state_summary("historical-run")).then_return(
        historical_run_data
    )
    decoy.when(mock_run_store.get_run_time_parameters("historical-run")).then_return(
        historical_run_time_parameters
    )
    decoy.when(mock_run_store.get_all(length=20)).then_return(
        [historical_run_resource, current_run_resource]
    )

    result = subject.get_all(length=20)

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
            modules=historical_run_data.modules,
            liquids=historical_run_data.liquids,
            runTimeParameters=historical_run_time_parameters,
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
            modules=current_run_data.modules,
            liquids=current_run_data.liquids,
            runTimeParameters=current_run_time_parameters,
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

    await subject.delete(run_id=run_id)

    decoy.verify(
        await mock_engine_store.clear(),
        mock_run_store.remove(run_id=run_id),
    )


async def test_delete_historical_run(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should delete a historical run from the store."""
    run_id = "hello world"
    decoy.when(mock_engine_store.current_run_id).then_return("some other id")

    await subject.delete(run_id=run_id)

    decoy.verify(await mock_engine_store.clear(), times=0)
    decoy.verify(mock_run_store.remove(run_id=run_id), times=1)


async def test_update_current(
    decoy: Decoy,
    engine_state_summary: StateSummary,
    run_time_parameters: List[pe_types.RunTimeParameter],
    run_resource: RunResource,
    run_command: commands.Command,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    mock_runs_publisher: RunsPublisher,
    subject: RunDataManager,
) -> None:
    """It should persist the current run and clear the engine on current=false."""
    run_id = "hello world"
    decoy.when(mock_engine_store.current_run_id).then_return(run_id)
    decoy.when(await mock_engine_store.clear()).then_return(
        RunResult(
            commands=[run_command],
            state_summary=engine_state_summary,
            parameters=run_time_parameters,
        )
    )

    decoy.when(
        mock_run_store.update_run_state(
            run_id=run_id,
            summary=engine_state_summary,
            commands=[run_command],
            run_time_parameters=run_time_parameters,
        )
    ).then_return(run_resource)

    result = await subject.update(run_id=run_id, current=False)

    decoy.verify(
        await mock_runs_publisher.publish_pre_serialized_commands_notification(run_id),
        times=1,
    )
    assert result == Run(
        current=False,
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=engine_state_summary.status,
        errors=engine_state_summary.errors,
        labware=engine_state_summary.labware,
        labwareOffsets=engine_state_summary.labwareOffsets,
        pipettes=engine_state_summary.pipettes,
        modules=engine_state_summary.modules,
        liquids=engine_state_summary.liquids,
        runTimeParameters=run_time_parameters,
    )


@pytest.mark.parametrize("current", [None, True])
async def test_update_current_noop(
    decoy: Decoy,
    engine_state_summary: StateSummary,
    run_time_parameters: List[pe_types.RunTimeParameter],
    run_resource: RunResource,
    run_command: commands.Command,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    mock_runs_publisher: RunsPublisher,
    subject: RunDataManager,
    current: Optional[bool],
) -> None:
    """It should noop on current=None and current=True."""
    run_id = "hello world"
    decoy.when(mock_engine_store.current_run_id).then_return(run_id)
    decoy.when(mock_engine_store.get_state_summary()).then_return(engine_state_summary)
    decoy.when(mock_engine_store.get_run_time_parameters()).then_return(
        run_time_parameters
    )
    decoy.when(mock_run_store.get(run_id=run_id)).then_return(run_resource)

    result = await subject.update(run_id=run_id, current=current)

    decoy.verify(await mock_engine_store.clear(), times=0)
    decoy.verify(
        mock_run_store.update_run_state(
            run_id=run_id,
            summary=matchers.Anything(),
            commands=matchers.Anything(),
            run_time_parameters=matchers.Anything(),
        ),
        await mock_runs_publisher.publish_pre_serialized_commands_notification(run_id),
        times=0,
    )

    assert result == Run(
        current=True,
        id=run_resource.run_id,
        protocolId=run_resource.protocol_id,
        createdAt=run_resource.created_at,
        actions=run_resource.actions,
        status=engine_state_summary.status,
        errors=engine_state_summary.errors,
        labware=engine_state_summary.labware,
        labwareOffsets=engine_state_summary.labwareOffsets,
        pipettes=engine_state_summary.pipettes,
        modules=engine_state_summary.modules,
        liquids=engine_state_summary.liquids,
        runTimeParameters=run_time_parameters,
    )


async def test_update_current_not_allowed(
    decoy: Decoy,
    engine_state_summary: StateSummary,
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


async def test_create_archives_existing(
    decoy: Decoy,
    engine_state_summary: StateSummary,
    run_time_parameters: List[pe_types.RunTimeParameter],
    run_resource: RunResource,
    run_command: commands.Command,
    mock_engine_store: EngineStore,
    mock_run_store: RunStore,
    subject: RunDataManager,
) -> None:
    """It should persist the previously current run when a new run is created."""
    run_id_old = "hello world"
    run_id_new = "hello is it me you're looking for"

    decoy.when(mock_engine_store.current_run_id).then_return(run_id_old)
    decoy.when(await mock_engine_store.clear()).then_return(
        RunResult(
            commands=[run_command],
            state_summary=engine_state_summary,
            parameters=run_time_parameters,
        )
    )

    decoy.when(
        await mock_engine_store.create(
            run_id=run_id_new,
            labware_offsets=[],
            protocol=None,
            deck_configuration=[],
            run_time_param_values=None,
            notify_publishers=mock_notify_publishers,
        )
    ).then_return(engine_state_summary)

    decoy.when(
        mock_run_store.insert(
            run_id=run_id_new,
            created_at=datetime(year=2021, month=1, day=1),
            protocol_id=None,
        )
    ).then_return(run_resource)

    await subject.create(
        run_id=run_id_new,
        created_at=datetime(year=2021, month=1, day=1),
        labware_offsets=[],
        protocol=None,
        deck_configuration=[],
        run_time_param_values=None,
        notify_publishers=mock_notify_publishers,
    )

    decoy.verify(
        mock_run_store.update_run_state(
            run_id=run_id_old,
            summary=engine_state_summary,
            commands=[run_command],
            run_time_parameters=run_time_parameters,
        )
    )


def test_get_commands_slice_from_db(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    run_command: commands.Command,
) -> None:
    """Should get a sliced command list from run store."""
    expected_commands_result = [
        commands.WaitForResume(
            id="command-id-2",
            key="command-key",
            createdAt=datetime(year=2021, month=1, day=1),
            status=commands.CommandStatus.SUCCEEDED,
            params=commands.WaitForResumeParams(message="Hello"),
        ),
        run_command,
    ]

    expected_command_slice = CommandSlice(
        commands=expected_commands_result, cursor=1, total_length=3
    )

    decoy.when(
        mock_run_store.get_commands_slice(run_id="run_id", cursor=1, length=2)
    ).then_return(expected_command_slice)
    result = subject.get_commands_slice(run_id="run_id", cursor=1, length=2)

    assert expected_command_slice == result


def test_get_commands_slice_current_run(
    decoy: Decoy,
    subject: RunDataManager,
    mock_engine_store: EngineStore,
    run_command: commands.Command,
) -> None:
    """Should get a sliced command list from engine store."""
    expected_commands_result = [
        commands.WaitForResume(
            id="command-id-2",
            key="command-key",
            createdAt=datetime(year=2021, month=1, day=1),
            status=commands.CommandStatus.SUCCEEDED,
            params=commands.WaitForResumeParams(message="Hello"),
        ),
        run_command,
    ]

    expected_command_slice = CommandSlice(
        commands=expected_commands_result, cursor=1, total_length=3
    )
    decoy.when(mock_engine_store.current_run_id).then_return("run-id")
    decoy.when(mock_engine_store.get_command_slice(1, 2)).then_return(
        expected_command_slice
    )

    result = subject.get_commands_slice("run-id", 1, 2)

    assert expected_command_slice == result


def test_get_commands_slice_from_db_run_not_found(
    decoy: Decoy, subject: RunDataManager, mock_run_store: RunStore
) -> None:
    """Should get a sliced command list from run store."""
    decoy.when(
        mock_run_store.get_commands_slice(run_id="run-id", cursor=1, length=2)
    ).then_raise(RunNotFoundError(run_id="run-id"))
    with pytest.raises(RunNotFoundError):
        subject.get_commands_slice(run_id="run-id", cursor=1, length=2)


def test_get_current_command(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_engine_store: EngineStore,
    run_command: commands.Command,
) -> None:
    """Should get current command from engine store."""
    expected_current = CommandPointer(
        command_id=run_command.id,
        command_key=run_command.key,
        created_at=run_command.createdAt,
        index=0,
    )
    decoy.when(mock_engine_store.current_run_id).then_return("run-id")
    decoy.when(mock_engine_store.get_current_command()).then_return(expected_current)
    result = subject.get_current_command("run-id")

    assert result == expected_current


def test_get_current_command_not_current_run(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_engine_store: EngineStore,
) -> None:
    """Should return None because the run is not current."""
    decoy.when(mock_engine_store.current_run_id).then_return("not-run-id")
    result = subject.get_current_command("run-id")

    assert result is None


def test_get_command_from_engine(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_engine_store: EngineStore,
    run_command: commands.Command,
) -> None:
    """Should get command by id from engine store."""
    decoy.when(mock_engine_store.current_run_id).then_return("run-id")
    decoy.when(mock_engine_store.get_command("command-id")).then_return(run_command)
    result = subject.get_command("run-id", "command-id")

    assert result == run_command


def test_get_command_from_db(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_engine_store: EngineStore,
    run_command: commands.Command,
) -> None:
    """Should get command by id from engine store."""
    decoy.when(mock_engine_store.current_run_id).then_return("not-run-id")
    decoy.when(
        mock_run_store.get_command(run_id="run-id", command_id="command-id")
    ).then_return(run_command)
    result = subject.get_command("run-id", "command-id")

    assert result == run_command


def test_get_command_from_db_run_not_found(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_engine_store: EngineStore,
    run_command: commands.Command,
) -> None:
    """Should get command by id from engine store."""
    decoy.when(mock_engine_store.current_run_id).then_return("not-run-id")
    decoy.when(
        mock_run_store.get_command(run_id="run-id", command_id="command-id")
    ).then_raise(RunNotFoundError("run-id"))

    with pytest.raises(RunNotFoundError):
        subject.get_command("run-id", "command-id")


def test_get_command_from_db_command_not_found(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_engine_store: EngineStore,
    run_command: commands.Command,
) -> None:
    """Should get command by id from engine store."""
    decoy.when(mock_engine_store.current_run_id).then_return("not-run-id")
    decoy.when(
        mock_run_store.get_command(run_id="run-id", command_id="command-id")
    ).then_raise(CommandNotFoundError(command_id="command-id"))

    with pytest.raises(CommandNotFoundError):
        subject.get_command("run-id", "command-id")


def test_get_all_commands_as_preserialized_list(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_engine_store: EngineStore,
) -> None:
    """It should return the pre-serialized commands list."""
    decoy.when(mock_engine_store.current_run_id).then_return(None)
    decoy.when(
        mock_run_store.get_all_commands_as_preserialized_list("run-id")
    ).then_return(['{"id": command-1}', '{"id": command-2}'])
    assert subject.get_all_commands_as_preserialized_list("run-id") == [
        '{"id": command-1}',
        '{"id": command-2}',
    ]


def test_get_all_commands_as_preserialized_list_errors_for_active_runs(
    decoy: Decoy,
    subject: RunDataManager,
    mock_run_store: RunStore,
    mock_engine_store: EngineStore,
) -> None:
    """It should raise an error when fetching pre-serialized commands list while run is active."""
    decoy.when(mock_engine_store.current_run_id).then_return("current-run-id")
    decoy.when(mock_engine_store.get_is_run_terminal()).then_return(False)
    with pytest.raises(PreSerializedCommandsNotAvailableError):
        subject.get_all_commands_as_preserialized_list("current-run-id")


async def test_get_current_run_labware_definition(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    subject: RunDataManager,
    engine_state_summary: StateSummary,
    run_resource: RunResource,
) -> None:
    """It should get the current run labware definition from the engine."""
    decoy.when(mock_engine_store.current_run_id).then_return("run-id")
    decoy.when(mock_engine_store.get_loaded_labware_definitions()).then_return(
        [
            LabwareDefinition.construct(namespace="test_1"),  # type: ignore[call-arg]
            LabwareDefinition.construct(namespace="test_2"),  # type: ignore[call-arg]
        ]
    )

    result = subject.get_run_loaded_labware_definitions(run_id="run-id")

    assert result == [
        LabwareDefinition.construct(namespace="test_1"),  # type: ignore[call-arg]
        LabwareDefinition.construct(namespace="test_2"),  # type: ignore[call-arg]
    ]
