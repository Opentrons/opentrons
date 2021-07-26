"""Tests for the session resource model builder."""
import pytest
from datetime import datetime

from opentrons.types import MountType
from opentrons.protocol_engine import (
    EngineStatus,
    CommandStatus,
    PipetteName,
    commands as pe_commands,
)

from robot_server.sessions.session_store import SessionResource
from robot_server.sessions.session_view import SessionView
from robot_server.sessions.session_models import (
    Session,
    SessionStatus,
    BasicSession,
    BasicSessionCreateData,
    ProtocolSession,
    ProtocolSessionCreateData,
    ProtocolSessionCreateParams,
    SessionCommandSummary,
)

from robot_server.sessions.action_models import (
    SessionAction,
    SessionActionCreateData,
    SessionActionType,
)


def test_create_session_resource_from_none() -> None:
    """It should create a basic session from create_data=None."""
    created_at = datetime.now()
    create_data = None

    subject = SessionView()
    result = subject.as_resource(
        session_id="session-id",
        create_data=create_data,
        created_at=created_at,
    )

    assert result == SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=created_at,
        actions=[],
    )


def test_create_session_resource() -> None:
    """It should create a session with create_data specified."""
    created_at = datetime.now()
    create_data = BasicSessionCreateData()

    subject = SessionView()
    result = subject.as_resource(
        session_id="session-id",
        create_data=create_data,
        created_at=created_at,
    )

    assert result == SessionResource(
        session_id="session-id",
        create_data=create_data,
        created_at=created_at,
        actions=[],
    )


def test_create_protocol_session_resource() -> None:
    """It should create a protocol session resource view."""
    created_at = datetime.now()
    create_data = ProtocolSessionCreateData(
        createParams=ProtocolSessionCreateParams(protocolId="protocol-id")
    )

    subject = SessionView()
    result = subject.as_resource(
        session_id="session-id",
        create_data=create_data,
        created_at=created_at,
    )

    assert result == SessionResource(
        session_id="session-id",
        create_data=create_data,
        created_at=created_at,
        actions=[],
    )


current_time = datetime.now()


@pytest.mark.parametrize(
    ("session_resource", "expected_response"),
    (
        (
            SessionResource(
                session_id="session-id",
                create_data=BasicSessionCreateData(),
                created_at=current_time,
                actions=[],
            ),
            BasicSession(
                id="session-id",
                createdAt=current_time,
                status=SessionStatus.READY_TO_START,
                actions=[],
                commands=[],
            ),
        ),
        (
            SessionResource(
                session_id="session-id",
                create_data=ProtocolSessionCreateData(
                    createParams=ProtocolSessionCreateParams(protocolId="protocol-id")
                ),
                created_at=current_time,
                actions=[],
            ),
            ProtocolSession(
                id="session-id",
                createdAt=current_time,
                status=SessionStatus.READY_TO_START,
                createParams=ProtocolSessionCreateParams(protocolId="protocol-id"),
                actions=[],
                commands=[],
            ),
        ),
    ),
)
def test_to_response(
    session_resource: SessionResource,
    expected_response: Session,
) -> None:
    """It should create the correct type of session."""
    subject = SessionView()
    result = subject.as_response(
        session=session_resource,
        commands=[],
        engine_status=EngineStatus.READY_TO_START,
    )
    assert result == expected_response


def test_to_response_maps_commands() -> None:
    """It should map ProtocolEngine commands to SessionCommandSummary models."""
    session_resource = SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
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

    subject = SessionView()
    result = subject.as_response(
        session=session_resource,
        commands=[command_1, command_2],
        engine_status=EngineStatus.RUNNING,
    )

    assert result == BasicSession(
        id="session-id",
        createdAt=datetime(year=2021, month=1, day=1),
        status=SessionStatus.RUNNING,
        actions=[],
        commands=[
            SessionCommandSummary(
                id="command-1",
                commandType="loadPipette",
                status=CommandStatus.RUNNING,
            ),
            SessionCommandSummary(
                id="command-2",
                commandType="moveToWell",
                status=CommandStatus.QUEUED,
            ),
        ],
    )


def test_create_action(current_time: datetime) -> None:
    """It should create a control action and add it to the session."""
    session_created_at = datetime.now()

    session = SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=session_created_at,
        actions=[],
    )

    command_data = SessionActionCreateData(
        actionType=SessionActionType.START,
    )

    subject = SessionView()
    action_result, session_result = subject.with_action(
        session=session,
        action_id="control-command-id",
        action_data=command_data,
        created_at=current_time,
    )

    assert action_result == SessionAction(
        id="control-command-id",
        createdAt=current_time,
        actionType=SessionActionType.START,
    )

    assert session_result == SessionResource(
        session_id="session-id",
        create_data=BasicSessionCreateData(),
        created_at=session_created_at,
        actions=[action_result],
    )
