"""Tests for RunDataManager."""
from typing import Optional

import pytest
from datetime import datetime
from decoy import Decoy

from opentrons.types import DeckSlotName
from opentrons.protocol_engine import (
    EngineStatus,
    StateSummary,
    commands,
    types as pe_types,
    CommandSlice,
    CurrentCommand,
    ErrorOccurrence,
    LoadedLabware,
    LoadedPipette,
    LoadedModule,
    LabwareOffset,
)
from opentrons.protocol_engine.errors.exceptions import CommandDoesNotExistError

from robot_server.protocols import ProtocolResource
from robot_server.maintenance_run.engine_store import EngineStore, EngineConflictError
from robot_server.maintenance_run.maintenance_run_data_manager import (
    MaintenanceRunDataManager,
)
from robot_server.maintenance_run.maintenance_run_models import MaintenanceRun
from robot_server.runs.run_models import RunNotFoundError

from opentrons.protocol_engine import Liquid


@pytest.fixture
def mock_engine_store(decoy: Decoy) -> EngineStore:
    """Get a mock EngineStore."""
    mock = decoy.mock(cls=EngineStore)
    decoy.when(mock.current_run_id).then_return(None)
    return mock


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
) -> MaintenanceRunDataManager:
    """Get a MaintenanceRunDataManager test subject."""
    return MaintenanceRunDataManager(
        engine_store=mock_engine_store,
    )


async def test_create(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    subject: MaintenanceRunDataManager,
    engine_state_summary: StateSummary,
) -> None:
    """It should create an engine and a persisted run resource."""
    run_id = "hello world"
    created_at = datetime(year=2021, month=1, day=1)

    decoy.when(
        await mock_engine_store.create(run_id=run_id, labware_offsets=[], protocol=None)
    ).then_return(engine_state_summary)

    result = await subject.create(
        run_id=run_id,
        created_at=created_at,
        labware_offsets=[],
    )

    assert result == MaintenanceRun(
        id=run_id,
        createdAt=created_at,
        current=True,
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
    subject: MaintenanceRunDataManager,
    engine_state_summary: StateSummary,
) -> None:
    """It should handle creation with a protocol and labware offsets."""
    run_id = "hello world"
    created_at = datetime(year=2021, month=1, day=1)

    protocol = ProtocolResource(
        protocol_id="protocol-id",
        created_at=datetime(year=2022, month=2, day=2),
        source=None,  # type: ignore[arg-type]
        protocol_key=None,
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
            protocol=None,
        )
    ).then_return(engine_state_summary)

    result = await subject.create(
        run_id=run_id,
        created_at=created_at,
        labware_offsets=[labware_offset],
    )

    assert result == MaintenanceRun(
        id=run_id,
        createdAt=created_at,
        current=True,
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
    subject: MaintenanceRunDataManager,
) -> None:
    """It should not create a resource if engine creation fails."""
    run_id = "hello world"
    created_at = datetime(year=2021, month=1, day=1)

    decoy.when(
        await mock_engine_store.create(run_id, labware_offsets=[], protocol=None)
    ).then_raise(EngineConflictError("oh no"))

    with pytest.raises(EngineConflictError):
        await subject.create(
            run_id=run_id,
            created_at=created_at,
            labware_offsets=[],
        )


async def test_get_current_run(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    subject: MaintenanceRunDataManager,
    engine_state_summary: StateSummary,
) -> None:
    """It should get the current run from the engine."""
    run_id = "hello world"

    decoy.when(mock_engine_store.current_run_id).then_return(run_id)
    decoy.when(mock_engine_store.engine.state_view.get_summary()).then_return(
        engine_state_summary
    )

    result = subject.get(run_id=run_id)

    assert result == MaintenanceRun(
        current=True,
        id=run_id,
        createdAt=datetime(2023, 1, 1),
        status=engine_state_summary.status,
        errors=engine_state_summary.errors,
        labware=engine_state_summary.labware,
        labwareOffsets=engine_state_summary.labwareOffsets,
        pipettes=engine_state_summary.pipettes,
        modules=engine_state_summary.modules,
        liquids=engine_state_summary.liquids,
    )
    assert subject.current_run_id == run_id


async def test_get_run_not_found(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    subject: MaintenanceRunDataManager,
    engine_state_summary: StateSummary,
) -> None:
    """It should raise a RunNotCurrentError."""
    run_id = "hello world"

    decoy.when(mock_engine_store.current_run_id).then_return("not-current-id")
    with pytest.raises(RunNotFoundError):
        subject.get(run_id=run_id)


async def test_delete_current_run(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    subject: MaintenanceRunDataManager,
) -> None:
    """It should delete the current run from the engine."""
    run_id = "hello world"
    decoy.when(mock_engine_store.current_run_id).then_return(run_id)

    await subject.delete(run_id=run_id)

    decoy.verify(
        await mock_engine_store.clear(),
    )


async def test_delete_run_not_current(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    subject: MaintenanceRunDataManager,
) -> None:
    """It should delete the current run from the engine."""
    run_id = "hello world"
    decoy.when(mock_engine_store.current_run_id).then_return("not-current")

    with pytest.raises(RunNotFoundError):
        await subject.delete(run_id=run_id)


def test_get_commands_slice_current_run(
    decoy: Decoy,
    subject: MaintenanceRunDataManager,
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
    decoy.when(
        mock_engine_store.engine.state_view.commands.get_slice(1, 2)
    ).then_return(expected_command_slice)

    result = subject.get_commands_slice("run-id", 1, 2)

    assert expected_command_slice == result


async def test_commands_slice_run_not_found(
    decoy: Decoy,
    mock_engine_store: EngineStore,
    subject: MaintenanceRunDataManager,
) -> None:
    """It should delete the current run from the engine."""
    run_id = "hello world"
    decoy.when(mock_engine_store.current_run_id).then_return("not-current")

    with pytest.raises(RunNotFoundError):
        subject.get_commands_slice(run_id=run_id, cursor=1, length=2)


def test_get_current_command(
    decoy: Decoy,
    subject: MaintenanceRunDataManager,
    mock_engine_store: EngineStore,
    run_command: commands.Command,
) -> None:
    """Should get current command from engine store."""
    expected_current = CurrentCommand(
        command_id=run_command.id,
        command_key=run_command.key,
        created_at=run_command.createdAt,
        index=0,
    )
    decoy.when(mock_engine_store.current_run_id).then_return("run-id")
    decoy.when(mock_engine_store.engine.state_view.commands.get_current()).then_return(
        expected_current
    )
    result = subject.get_current_command("run-id")

    assert result == expected_current


def test_get_current_command_not_current_run(
    decoy: Decoy,
    subject: MaintenanceRunDataManager,
    mock_engine_store: EngineStore,
) -> None:
    """Should return None because the run is not current."""
    decoy.when(mock_engine_store.current_run_id).then_return("not-run-id")
    result = subject.get_current_command("run-id")

    assert result is None


def test_get_command_from_engine(
    decoy: Decoy,
    subject: MaintenanceRunDataManager,
    mock_engine_store: EngineStore,
    run_command: commands.Command,
) -> None:
    """Should get command by id from engine store."""
    decoy.when(mock_engine_store.current_run_id).then_return("run-id")
    decoy.when(
        mock_engine_store.engine.state_view.commands.get("command-id")
    ).then_return(run_command)
    result = subject.get_command("run-id", "command-id")

    assert result == run_command


def test_get_command_from_engine_run_not_found(
    decoy: Decoy,
    subject: MaintenanceRunDataManager,
    mock_engine_store: EngineStore,
    run_command: commands.Command,
) -> None:
    """Should get command by id from engine store."""
    decoy.when(mock_engine_store.current_run_id).then_return("not-current-run-id")
    decoy.when(
        mock_engine_store.engine.state_view.commands.get("command-id")
    ).then_return(run_command)

    with pytest.raises(RunNotFoundError):
        subject.get_command("run-id", "command-id")


def test_get_command_from_engine_command_not_found(
    decoy: Decoy,
    subject: MaintenanceRunDataManager,
    mock_engine_store: EngineStore,
    run_command: commands.Command,
) -> None:
    """Should get command by id from engine store."""
    decoy.when(mock_engine_store.current_run_id).then_return("run-id")

    with pytest.raises(CommandDoesNotExistError):
        subject.get_command("run-id", "command-not-found-id")
