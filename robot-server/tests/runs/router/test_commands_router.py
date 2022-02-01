"""Tests for the /runs/.../commands routes."""
import pytest

from datetime import datetime
from decoy import Decoy

from opentrons.protocol_engine import (
    EngineStatus,
    StateView,
    CommandSlice,
    commands as pe_commands,
    errors as pe_errors,
)

from robot_server.errors import ApiError
from robot_server.service.json_api import RequestModel, MultiBodyMeta
from robot_server.runs.run_models import Run, RunCommandSummary
from robot_server.runs.engine_store import EngineStore
from robot_server.runs.router.commands_router import (
    CommandCollectionLinks,
    CommandLink,
    CommandLinkMeta,
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
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    output_command = pe_commands.Pause(
        id="abc123",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_commands.CommandStatus.QUEUED,
        params=pe_commands.PauseParams(message="Hello"),
        result=None,
    )

    decoy.when(engine_store.engine.add_command(command_request)).then_return(
        output_command
    )

    result = await create_run_command(
        request_body=RequestModel(data=command_request),
        engine_store=engine_store,
        run=run,
    )

    assert result.content.data == output_command
    assert result.status_code == 201


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
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    with pytest.raises(ApiError) as exc_info:
        await create_run_command(
            request_body=RequestModel(data=command_request),
            engine_store=engine_store,
            run=run,
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.content["errors"][0]["id"] == "RunStopped"


async def test_get_run_commands(decoy: Decoy, engine_store: EngineStore) -> None:
    """It should return a list of all commands in a run."""
    run = Run.construct(
        id="run-id",
        protocolId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=EngineStatus.RUNNING,
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    command = pe_commands.Pause(
        id="command-id",
        key="command-key",
        status=pe_commands.CommandStatus.FAILED,
        createdAt=datetime(year=2021, month=1, day=1),
        startedAt=datetime(year=2022, month=2, day=2),
        completedAt=datetime(year=2023, month=3, day=3),
        params=pe_commands.PauseParams(message="hello world"),
        errorId="error-id",
    )

    engine_state = decoy.mock(cls=StateView)
    decoy.when(engine_store.get_state("run-id")).then_return(engine_state)
    decoy.when(engine_state.commands.get_current()).then_return("current-command-id")
    decoy.when(
        engine_state.commands.get_slice(cursor=None, before=42, after=84)
    ).then_return(
        CommandSlice(
            commands=[command],
            cursor=1,
            before=2,
            after=3,
            total_count=4,
        )
    )

    result = await get_run_commands(
        run=run,
        engine_store=engine_store,
        cursor=None,
        before=42,
        after=84,
    )

    assert result.content.data == [
        RunCommandSummary.construct(
            id="command-id",
            key="command-key",
            commandType="pause",
            createdAt=datetime(year=2021, month=1, day=1),
            startedAt=datetime(year=2022, month=2, day=2),
            completedAt=datetime(year=2023, month=3, day=3),
            status=pe_commands.CommandStatus.FAILED,
            params=pe_commands.PauseParams(message="hello world"),
            errorId="error-id",
        )
    ]
    assert result.content.meta == MultiBodyMeta(
        cursor=1,
        before=2,
        after=3,
        totalCount=4,
    )
    assert result.content.links == CommandCollectionLinks(
        current=CommandLink(
            href="/runs/run-id/commands/current-command-id",
            meta=CommandLinkMeta(runId="run-id", commandId="current-command-id"),
        )
    )
    assert result.status_code == 200


async def test_get_run_commands_empty(decoy: Decoy, engine_store: EngineStore) -> None:
    """It should return an empty commands list if no commands."""
    run = Run.construct(
        id="run-id",
        protocolId=None,
        createdAt=datetime(year=2021, month=1, day=1),
        status=EngineStatus.RUNNING,
        current=True,
        actions=[],
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    engine_state = decoy.mock(cls=StateView)
    decoy.when(engine_store.get_state("run-id")).then_return(engine_state)
    decoy.when(engine_state.commands.get_current()).then_return(None)
    decoy.when(
        engine_state.commands.get_slice(cursor=21, before=42, after=84)
    ).then_return(CommandSlice(commands=[], cursor=0, before=0, after=0, total_count=0))

    result = await get_run_commands(
        run=run,
        engine_store=engine_store,
        cursor=21,
        before=42,
        after=84,
    )

    assert result.content.data == []
    assert result.content.meta == MultiBodyMeta(
        cursor=0,
        before=0,
        after=0,
        totalCount=0,
    )
    assert result.content.links == CommandCollectionLinks(current=None)
    assert result.status_code == 200


async def test_get_run_command_by_id(
    decoy: Decoy,
    engine_store: EngineStore,
) -> None:
    """It should return full details about a command by ID."""
    command = pe_commands.MoveToWell(
        id="command-id",
        key="command-key",
        status=pe_commands.CommandStatus.RUNNING,
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
        errors=[],
        pipettes=[],
        labware=[],
        labwareOffsets=[],
    )

    engine_state = decoy.mock(cls=StateView)

    decoy.when(engine_store.get_state("run-id")).then_return(engine_state)
    decoy.when(engine_state.commands.get("command-id")).then_return(command)

    result = await get_run_command(
        commandId="command-id",
        engine_store=engine_store,
        run=run,
    )

    assert result.content.data == command
    assert result.status_code == 200


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
            run=run,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.content["errors"][0]["detail"] == "oh no"
