"""Tests for the /runs/.../commands routes."""
import pytest

from datetime import datetime
from decoy import Decoy

from opentrons.protocol_engine import (
    CommandStatus,
    EngineStatus,
    StateView,
    commands as pe_commands,
    errors as pe_errors,
)

from robot_server.errors import ApiError
from robot_server.service.json_api import RequestModel, SimpleResponseModel
from robot_server.runs.run_models import Run, RunCommandSummary
from robot_server.runs.engine_store import EngineStore
from robot_server.runs.router.commands_router import (
    create_run_command,
    get_run_command,
    get_run_commands,
)


async def test_create_run_command(decoy: Decoy, engine_store: EngineStore) -> None:
    """It should add the requested command to the ProtocolEngine and return it."""
    command_request = pe_commands.PauseCreate(
        params=pe_commands.PauseParams(message="Hello")
    )

    run = Run.construct(
        id="run-id",
        protocolId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=EngineStatus.RUNNING,
        current=True,
        actions=[],
        commands=[],
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    output_command = pe_commands.Pause(
        id="abc123",
        createdAt=datetime(year=2021, month=1, day=1),
        status=CommandStatus.QUEUED,
        params=pe_commands.PauseParams(message="Hello"),
        result=None,
    )

    decoy.when(engine_store.engine.add_command(command_request)).then_return(
        output_command
    )

    response = await create_run_command(
        request_body=RequestModel(data=command_request),
        engine_store=engine_store,
        run=SimpleResponseModel(data=run),
    )

    assert response.data == output_command


async def test_create_run_command_not_current(
    decoy: Decoy,
    engine_store: EngineStore,
) -> None:
    """It should 400 if you try to add commands to non-current run."""
    command_request = pe_commands.PauseCreate(
        params=pe_commands.PauseParams(message="Hello")
    )

    run = Run.construct(
        id="run-id",
        protocolId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=EngineStatus.RUNNING,
        current=False,
        actions=[],
        commands=[],
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    with pytest.raises(ApiError) as exc_info:
        await create_run_command(
            request_body=RequestModel(data=command_request),
            engine_store=engine_store,
            run=SimpleResponseModel(data=run),
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.content["errors"][0]["id"] == "RunStopped"


async def test_get_run_commands() -> None:
    """It should return a list of all commands in a run."""
    command_summary = RunCommandSummary(
        id="command-id",
        commandType="moveToWell",
        status=CommandStatus.RUNNING,
    )

    run = Run.construct(
        id="run-id",
        protocolId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=EngineStatus.RUNNING,
        current=True,
        actions=[],
        commands=[command_summary],
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    response = await get_run_commands(run=SimpleResponseModel(data=run))

    assert response.data == [command_summary]


async def test_get_run_command_by_id(
    decoy: Decoy,
    engine_store: EngineStore,
) -> None:
    """It should return full details about a command by ID."""
    command_summary = RunCommandSummary(
        id="command-id",
        commandType="moveToWell",
        status=CommandStatus.RUNNING,
    )

    command = pe_commands.MoveToWell(
        id="command-id",
        status=CommandStatus.RUNNING,
        createdAt=datetime(year=2022, month=2, day=2),
        params=pe_commands.MoveToWellParams(pipetteId="a", labwareId="b", wellName="c"),
    )

    run = Run.construct(
        id="run-id",
        protocolId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=EngineStatus.RUNNING,
        current=True,
        actions=[],
        commands=[command_summary],
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    engine_state = decoy.mock(cls=StateView)

    decoy.when(engine_store.get_state("run-id")).then_return(engine_state)
    decoy.when(engine_state.commands.get("command-id")).then_return(command)

    response = await get_run_command(
        commandId="command-id",
        engine_store=engine_store,
        run=SimpleResponseModel(data=run),
    )

    assert response.data == command


async def test_get_run_command_missing_command(
    decoy: Decoy,
    engine_store: EngineStore,
) -> None:
    """It should 404 if you attempt to get a non-existent command."""
    key_error = pe_errors.CommandDoesNotExistError("oh no")

    run = Run.construct(
        id="run-id",
        protocolId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=EngineStatus.RUNNING,
        current=True,
        actions=[],
        commands=[],
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    engine_state = decoy.mock(cls=StateView)
    decoy.when(engine_store.get_state("run-id")).then_return(engine_state)
    decoy.when(engine_state.commands.get("command-id")).then_raise(key_error)

    with pytest.raises(ApiError) as exc_info:
        await get_run_command(
            commandId="command-id",
            engine_store=engine_store,
            run=SimpleResponseModel(data=run),
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["detail"] == "oh no"
