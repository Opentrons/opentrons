"""Tests for the /runs/.../commands routes."""
import asyncio
from datetime import datetime

import pytest
from decoy import Decoy

from opentrons.protocol_engine import (
    ProtocolEngine,
    EngineStatus,
    StateView,
    CommandSlice,
    CurrentCommand,
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
    CommandWaiter,
    create_run_command,
    get_run_command,
    get_run_commands,
)


@pytest.fixture
def command_waiter(decoy: Decoy) -> CommandWaiter:
    """Return a mock in the shape of a CommandWaiter."""
    return decoy.mock(cls=CommandWaiter)


async def test_command_waiter_not_timed_out(decoy: Decoy) -> None:
    mock_pe = decoy.mock(cls=ProtocolEngine)
    subject = CommandWaiter()

    command_request = pe_commands.PauseCreate(
        params=pe_commands.PauseParams(),
    )

    queued_command = pe_commands.Pause(
        id="command-id",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_commands.CommandStatus.QUEUED,
        params=pe_commands.PauseParams(),
        result=None,
    )

    completed_command = pe_commands.Pause(
        id="command-id",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_commands.CommandStatus.SUCCEEDED,
        params=pe_commands.PauseParams(),
        result=None,
    )

    decoy.when(mock_pe.add_command(request=command_request)).then_return(queued_command)

    decoy.when(
        await mock_pe.wait_for_command_completion(
            command_id=queued_command.id,
        )
    ).then_return(completed_command)

    result = await subject.add_and_wait_with_timeout(
        engine=mock_pe,
        command_request=command_request,
        timeout_ms=9999999999,
    )

    assert result == completed_command


async def test_command_waiter_timed_out(decoy: Decoy) -> None:
    mock_pe = decoy.mock(cls=ProtocolEngine)
    subject = CommandWaiter()

    command_request = pe_commands.PauseCreate(
        params=pe_commands.PauseParams(),
    )

    queued_command = pe_commands.Pause(
        id="command-id",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_commands.CommandStatus.QUEUED,
        params=pe_commands.PauseParams(),
        result=None,
    )

    running_command = pe_commands.Pause(
        id="command-id",
        key="command-key",
        createdAt=datetime(year=2021, month=1, day=1),
        status=pe_commands.CommandStatus.RUNNING,
        params=pe_commands.PauseParams(),
        result=None,
    )

    decoy.when(mock_pe.add_command(request=command_request)).then_return(queued_command)

    # After enqueueing the new command:
    # 1. The subject should call `await wait_for_command_completion()`,
    #    with the correct command ID, to try waiting for it to complete.
    # 2. The subject should cancel that await once the timeout expires.
    # 3. The subject should retrieve the current state of the command, to return.

    async def mock_wait_for_command_completion(command_id: str) -> pe_commands.Command:
        if command_id == queued_command.id:
            decoy.when(mock_pe.state_view.commands.get(command_id)).then_return(
                running_command
            )
        # Never return.
        # Yield to the event loop frequently to give the caller
        # the opportunity to cancel us.
        while True:
            await asyncio.sleep(0)

    mock_pe.wait_for_command_completion = mock_wait_for_command_completion  # type: ignore[assignment]

    result = await subject.add_and_wait_with_timeout(
        engine=mock_pe,
        command_request=command_request,
        timeout_ms=100,
    )

    assert result == running_command


async def test_create_run_command_non_blocking(
    decoy: Decoy,
    engine_store: EngineStore,
) -> None:
    """It should add the requested command to the ProtocolEngine and return it."""
    command_request = pe_commands.PauseCreate(
        params=pe_commands.PauseParams(message="Hello")
    )

    run = Run(
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
        waitUntilComplete=False,
        timeout=123456,  # Should be ignored.
        engine_store=engine_store,
        run=run,
    )

    assert result.content.data == output_command
    assert result.status_code == 201


async def test_create_run_command_blocking(
    decoy: Decoy,
    engine_store: EngineStore,
    command_waiter: CommandWaiter,
) -> None:
    """It should run the requested command in the ProtocolEngine and return it."""
    command_request = pe_commands.PauseCreate(
        params=pe_commands.PauseParams(message="Hello")
    )

    run = Run(
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
        status=pe_commands.CommandStatus.SUCCEEDED,
        params=pe_commands.PauseParams(message="Hello"),
        result=None,
    )

    decoy.when(
        await command_waiter.add_and_wait_with_timeout(
            engine=engine_store.engine,
            command_request=command_request,
            timeout_ms=123456,
        )
    ).then_return(output_command)

    result = await create_run_command(
        request_body=RequestModel(data=command_request),
        waitUntilComplete=True,
        timeout=123456,
        engine_store=engine_store,
        run=run,
        command_waiter=command_waiter,
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

    run = Run(
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
            waitUntilComplete=False,
            engine_store=engine_store,
            run=run,
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.content["errors"][0]["id"] == "RunStopped"


async def test_get_run_commands(decoy: Decoy, engine_store: EngineStore) -> None:
    """It should return a list of all commands in a run."""
    run = Run(
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
    decoy.when(engine_state.commands.get_current()).then_return(
        CurrentCommand(
            command_id="current-command-id",
            command_key="current-command-key",
            created_at=datetime(year=2024, month=4, day=4),
            index=101,
        )
    )
    decoy.when(engine_state.commands.get_slice(cursor=None, length=42)).then_return(
        CommandSlice(commands=[command], cursor=1, total_length=3)
    )

    result = await get_run_commands(
        run=run,
        engine_store=engine_store,
        cursor=None,
        pageLength=42,
    )

    assert result.content.data == [
        RunCommandSummary(
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
    assert result.content.meta == MultiBodyMeta(cursor=1, totalLength=3)
    assert result.content.links == CommandCollectionLinks(
        current=CommandLink(
            href="/runs/run-id/commands/current-command-id",
            meta=CommandLinkMeta(
                runId="run-id",
                commandId="current-command-id",
                key="current-command-key",
                createdAt=datetime(year=2024, month=4, day=4),
                index=101,
            ),
        )
    )
    assert result.status_code == 200


async def test_get_run_commands_empty(decoy: Decoy, engine_store: EngineStore) -> None:
    """It should return an empty commands list if no commands."""
    run = Run(
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
    decoy.when(engine_state.commands.get_slice(cursor=21, length=42)).then_return(
        CommandSlice(commands=[], cursor=0, total_length=0)
    )

    result = await get_run_commands(
        run=run,
        engine_store=engine_store,
        cursor=21,
        pageLength=42,
    )

    assert result.content.data == []
    assert result.content.meta == MultiBodyMeta(cursor=0, totalLength=0)
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

    run = Run(
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

    run = Run(
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
