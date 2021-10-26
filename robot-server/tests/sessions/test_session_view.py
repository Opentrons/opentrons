"""Tests for the session resource model builder."""
import pytest
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

from robot_server.sessions.run_store import RunResource
from robot_server.sessions.run_view import RunView
from robot_server.sessions.run_models import (
    Run,
    BasicRun,
    BasicRunCreateData,
    ProtocolRun,
    ProtocolRunCreateData,
    ProtocolRunCreateParams,
    RunCommandSummary,
)

from robot_server.sessions.action_models import (
    RunAction,
    RunActionCreateData,
    RunActionType,
)


def test_create_session_resource_from_none() -> None:
    """It should create a basic session from create_data=None."""
    created_at = datetime.now()
    create_data = None

    subject = RunView()
    result = subject.as_resource(run_id="session-id", created_at=created_at,
                                 create_data=create_data)

    assert result == RunResource(
        run_id="session-id",
        create_data=BasicRunCreateData(),
        created_at=created_at,
        actions=[],
    )


def test_create_session_resource() -> None:
    """It should create a session with create_data specified."""
    created_at = datetime.now()
    create_data = BasicRunCreateData()

    subject = RunView()
    result = subject.as_resource(run_id="session-id", created_at=created_at,
                                 create_data=create_data)

    assert result == RunResource(
        run_id="session-id",
        create_data=create_data,
        created_at=created_at,
        actions=[],
    )


def test_create_protocol_session_resource() -> None:
    """It should create a protocol session resource view."""
    created_at = datetime.now()
    create_data = ProtocolRunCreateData(
        createParams=ProtocolRunCreateParams(protocolId="protocol-id")
    )

    subject = RunView()
    result = subject.as_resource(run_id="session-id", created_at=created_at,
                                 create_data=create_data)

    assert result == RunResource(
        run_id="session-id",
        create_data=create_data,
        created_at=created_at,
        actions=[],
    )


current_time = datetime.now()


@pytest.mark.parametrize(
    ("session_resource", "expected_response"),
    (
        (
                RunResource(
                run_id="session-id",
                create_data=BasicRunCreateData(),
                created_at=current_time,
                actions=[],
            ),
                BasicRun(
                id="session-id",
                createdAt=current_time,
                status=EngineStatus.READY_TO_RUN,
                actions=[],
                commands=[],
                pipettes=[],
                labware=[],
            ),
        ),
        (
                RunResource(
                run_id="session-id",
                create_data=ProtocolRunCreateData(
                    createParams=ProtocolRunCreateParams(protocolId="protocol-id")
                ),
                created_at=current_time,
                actions=[],
            ),
                ProtocolRun(
                id="session-id",
                createdAt=current_time,
                status=EngineStatus.READY_TO_RUN,
                createParams=ProtocolRunCreateParams(protocolId="protocol-id"),
                actions=[],
                commands=[],
                pipettes=[],
                labware=[],
            ),
        ),
    ),
)
def test_to_response(
    session_resource: RunResource,
    expected_response: Run,
) -> None:
    """It should create the correct type of session."""
    subject = RunView()
    result = subject.as_response(run=session_resource, commands=[], pipettes=[],
                                 labware=[], engine_status=EngineStatus.READY_TO_RUN)
    assert result == expected_response


def test_to_response_maps_commands() -> None:
    """It should map ProtocolEngine commands to RunCommandSummary models."""
    session_resource = RunResource(
        run_id="session-id",
        create_data=BasicRunCreateData(),
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
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
    result = subject.as_response(run=session_resource, commands=[command_1, command_2],
                                 pipettes=[], labware=[],
                                 engine_status=EngineStatus.RUNNING)

    assert result == BasicRun(
        id="session-id",
        createdAt=datetime(year=2021, month=1, day=1),
        status=EngineStatus.RUNNING,
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
    session_resource = RunResource(
        run_id="session-id",
        create_data=BasicRunCreateData(),
        created_at=datetime(year=2021, month=1, day=1),
        actions=[],
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
    result = subject.as_response(run=session_resource, commands=[], pipettes=[pipette],
                                 labware=[labware], engine_status=EngineStatus.RUNNING)

    assert result == BasicRun(
        id="session-id",
        createdAt=datetime(year=2021, month=1, day=1),
        status=EngineStatus.RUNNING,
        actions=[],
        commands=[],
        pipettes=[pipette],
        labware=[labware],
    )


def test_create_action(current_time: datetime) -> None:
    """It should create a control action and add it to the session."""
    session_created_at = datetime.now()

    session = RunResource(
        run_id="session-id",
        create_data=BasicRunCreateData(),
        created_at=session_created_at,
        actions=[],
    )

    command_data = RunActionCreateData(
        actionType=RunActionType.PLAY,
    )

    subject = RunView()
    action_result, session_result = subject.with_action(run=session,
                                                        action_id="control-command-id",
                                                        action_data=command_data,
                                                        created_at=current_time)

    assert action_result == RunAction(
        id="control-command-id",
        createdAt=current_time,
        actionType=RunActionType.PLAY,
    )

    assert session_result == RunResource(
        run_id="session-id",
        create_data=BasicRunCreateData(),
        created_at=session_created_at,
        actions=[action_result],
    )
