"""Tests for the run resource model builder."""
from datetime import datetime

from opentrons.types import DeckSlotName, MountType
from opentrons.protocol_engine import (
    DeckSlotLocation,
    EngineStatus,
    CommandStatus,
    PipetteName,
    LoadedPipette,
    LoadedLabware,
    commands as pe_commands,
)

from robot_server.runs.run_store import RunResource
from robot_server.runs.run_view import RunView
from robot_server.runs.run_models import Run, RunUpdate, RunCommandSummary

from robot_server.runs.action_models import (
    RunAction,
    RunActionCreateData,
    RunActionType,
)


def test_to_response() -> None:
    """It should create the correct type of run."""
    run_resource = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=True,
    )

    subject = RunView()
    result = subject.as_response(
        run=run_resource,
        commands=[],
        pipettes=[],
        labware=[],
        engine_status=EngineStatus.READY_TO_RUN,
    )

    assert result == Run(
        id="run-id",
        protocolId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=EngineStatus.READY_TO_RUN,
        current=True,
        actions=[],
        commands=[],
        pipettes=[],
        labware=[],
    )


def test_to_response_maps_commands() -> None:
    """It should map ProtocolEngine commands to RunCommandSummary models."""
    run_resource = RunResource(
        run_id="run-id",
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=True,
    )

    command_1 = pe_commands.LoadPipette(
        id="command-1",
        status=CommandStatus.RUNNING,
        createdAt=datetime(year=2022, month=2, day=2),
        data=pe_commands.LoadPipetteData(
            mount=MountType.LEFT,
            pipetteName=PipetteName.P300_SINGLE,
        ),
    )

    command_2 = pe_commands.MoveToWell(
        id="command-2",
        status=CommandStatus.QUEUED,
        createdAt=datetime(year=2023, month=3, day=3),
        data=pe_commands.MoveToWellData(pipetteId="a", labwareId="b", wellName="c"),
    )

    subject = RunView()
    result = subject.as_response(
        run=run_resource,
        commands=[command_1, command_2],
        pipettes=[],
        labware=[],
        engine_status=EngineStatus.RUNNING,
    )

    assert result == Run(
        id="run-id",
        protocolId="protocol-id",
        createdAt=datetime(year=2021, month=1, day=1),
        status=EngineStatus.RUNNING,
        current=True,
        actions=[],
        commands=[
            RunCommandSummary(
                id="command-1",
                commandType="loadPipette",
                status=CommandStatus.RUNNING,
            ),
            RunCommandSummary(
                id="command-2",
                commandType="moveToWell",
                status=CommandStatus.QUEUED,
            ),
        ],
        pipettes=[],
        labware=[],
    )


def test_to_response_adds_equipment() -> None:
    """It should add ProtocolEngine equipment to Session response model."""
    run_resource = RunResource(
        run_id="run-id",
        protocol_id=None,
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=True,
    )

    labware = LoadedLabware(
        id="labware-id",
        loadName="load-name",
        definitionUri="namespace/load-name/42",
        location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
    )

    pipette = LoadedPipette(
        id="pipette-id",
        pipetteName=PipetteName.P300_SINGLE,
        mount=MountType.LEFT,
    )

    subject = RunView()
    result = subject.as_response(
        run=run_resource,
        commands=[],
        pipettes=[pipette],
        labware=[labware],
        engine_status=EngineStatus.RUNNING,
    )

    assert result == Run(
        id="run-id",
        protocolId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=EngineStatus.RUNNING,
        current=True,
        actions=[],
        commands=[],
        pipettes=[pipette],
        labware=[labware],
    )


def test_create_action(current_time: datetime) -> None:
    """It should create a control action and add it to the run."""
    run_created_at = datetime.now()

    run = RunResource(
        run_id="run-id",
        protocol_id="protocol-id",
        created_at=run_created_at,
        actions=[],
        is_current=True,
    )

    command_data = RunActionCreateData(
        actionType=RunActionType.PLAY,
    )

    subject = RunView()
    action_result, run_result = subject.with_action(
        run=run,
        action_id="control-command-id",
        action_data=command_data,
        created_at=current_time,
    )

    assert action_result == RunAction(
        id="control-command-id",
        createdAt=current_time,
        actionType=RunActionType.PLAY,
    )

    assert run_result == RunResource(
        run_id="run-id",
        protocol_id="protocol-id",
        created_at=run_created_at,
        actions=[action_result],
        is_current=True,
    )


def test_with_update() -> None:
    """It should update a run resource to not current."""
    run = RunResource(
        run_id="run-id",
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=True,
    )
    update = RunUpdate(current=False)

    subject = RunView()
    result = subject.with_update(run=run, update=update)

    assert result == RunResource(
        run_id="run-id",
        protocol_id="protocol-id",
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
        is_current=False,
    )
