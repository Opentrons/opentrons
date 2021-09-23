"""Tests for the /sessions/.../commands routes."""
import pytest

from datetime import datetime
from decoy import Decoy

from opentrons.protocol_engine import (
    CommandStatus,
    EngineStatus,
    commands as pe_commands,
    errors as pe_errors,
)

from robot_server.errors import ApiError
from robot_server.service.json_api import ResponseModel
from robot_server.sessions.session_models import (
    Session,
    BasicSession,
    SessionCommandSummary,
)
from robot_server.sessions.engine_store import EngineStore
from robot_server.sessions.router.commands_router import (
    post_session_command,
    get_session_command,
    get_session_commands,
)


async def test_post_session_command(decoy: Decoy, engine_store: EngineStore) -> None:
    """It should add the requested command to the Protocol Engine and return it."""
    command_request = pe_commands.PauseRequest(
        data=pe_commands.PauseData(message="Hello")
    )
    output_command = pe_commands.Pause(
        id="abc123",
        createdAt=datetime(year=2021, month=1, day=1),
        status=CommandStatus.QUEUED,
        data=pe_commands.PauseData(message="Hello"),
        result=None,
    )

    decoy.when(engine_store.engine.add_command(command_request)).then_return(
        output_command
    )

    response = await post_session_command(
        command_request=command_request, engine_store=engine_store
    )

    assert response.data == output_command


async def test_get_session_commands() -> None:
    """It should return a list of all commands in a session."""
    command_summary = SessionCommandSummary(
        id="command-id",
        commandType="moveToWell",
        status=CommandStatus.RUNNING,
    )

    session_response = ResponseModel[Session](
        data=BasicSession(
            id="session-id",
            createdAt=datetime(year=2021, month=1, day=1),
            status=EngineStatus.RUNNING,
            actions=[],
            commands=[command_summary],
            pipettes=[],
            labware=[],
        )
    )

    response = await get_session_commands(session=session_response)

    assert response.data == [command_summary]


async def test_get_session_command_by_id(
    decoy: Decoy,
    engine_store: EngineStore,
) -> None:
    """It should return full details about a command by ID."""
    command = pe_commands.MoveToWell(
        id="command-id",
        status=CommandStatus.RUNNING,
        createdAt=datetime(year=2022, month=2, day=2),
        data=pe_commands.MoveToWellData(pipetteId="a", labwareId="b", wellName="c"),
    )

    decoy.when(engine_store.engine.state_view.commands.get("command-id")).then_return(
        command
    )

    response = await get_session_command(
        commandId="command-id", engine_store=engine_store
    )

    assert response.data == command


async def test_get_session_command_missing_command(
    decoy: Decoy,
    engine_store: EngineStore,
) -> None:
    """It should 404 if you attempt to get a non-existent command."""
    key_error = pe_errors.CommandDoesNotExistError("oh no")

    decoy.when(engine_store.engine.state_view.commands.get("command-id")).then_raise(
        key_error
    )

    with pytest.raises(ApiError) as exc_info:
        await get_session_command(commandId="command-id", engine_store=engine_store)
    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["detail"] == "oh no"
