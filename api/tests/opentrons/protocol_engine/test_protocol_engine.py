"""Tests for the ProtocolEngine class."""
import pytest
from datetime import datetime
from decoy import Decoy

from opentrons.types import MountType
from opentrons.protocol_engine import ProtocolEngine, commands
from opentrons.protocol_engine.commands import CommandMapper, CommandStatus
from opentrons.protocol_engine.types import PipetteName
from opentrons.protocol_engine.execution import CommandExecutor
from opentrons.protocol_engine.resources import ResourceProviders
from opentrons.protocol_engine.state import StateStore


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def command_executor(decoy: Decoy) -> CommandExecutor:
    """Get a mock CommandExecutor."""
    return decoy.mock(cls=CommandExecutor)


@pytest.fixture
def command_mapper(decoy: Decoy) -> CommandMapper:
    """Get a mock CommandMapper."""
    return decoy.mock(cls=CommandMapper)


@pytest.fixture
def resources(decoy: Decoy) -> ResourceProviders:
    """Get mock ResourceProviders."""
    return decoy.mock(cls=ResourceProviders)


@pytest.fixture
def subject(
    state_store: StateStore,
    command_executor: CommandExecutor,
    command_mapper: CommandMapper,
    resources: ResourceProviders,
) -> ProtocolEngine:
    """Get a ProtocolEngine test subject with its dependencies stubbed out."""
    return ProtocolEngine(
        state_store=state_store,
        command_executor=command_executor,
        command_mapper=command_mapper,
        resources=resources,
    )


def test_add_command(
    decoy: Decoy,
    state_store: StateStore,
    command_mapper: CommandMapper,
    resources: ResourceProviders,
    subject: ProtocolEngine,
) -> None:
    """It should add a command to the state from a request."""
    data = commands.LoadPipetteData(
        mount=MountType.LEFT,
        pipetteName=PipetteName.P300_SINGLE,
    )

    request = commands.LoadPipetteRequest(data=data)

    created_at = datetime(year=2021, month=1, day=1)

    queued_command = commands.LoadPipette(
        id="command-id",
        status=commands.CommandStatus.QUEUED,
        createdAt=created_at,
        data=data,
    )

    decoy.when(resources.model_utils.generate_id()).then_return("command-id")
    decoy.when(resources.model_utils.get_timestamp()).then_return(created_at)
    decoy.when(
        command_mapper.map_request_to_command(
            request=request,
            command_id="command-id",
            created_at=created_at,
        )
    ).then_return(queued_command)

    result = subject.add_command(request)

    assert result == queued_command
    decoy.verify(state_store.handle_command(queued_command))


async def test_execute_command_by_id(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    command_mapper: CommandMapper,
    resources: ResourceProviders,
    subject: ProtocolEngine,
) -> None:
    """It should execute an existing command in the state."""
    created_at = datetime(year=2021, month=1, day=1)
    started_at = datetime(year=2022, month=2, day=2)
    completed_at = datetime(year=2022, month=3, day=3)

    data = commands.LoadPipetteData(
        mount=MountType.LEFT,
        pipetteName=PipetteName.P300_SINGLE,
    )

    queued_command = commands.LoadPipette(
        id="command-id",
        status=CommandStatus.QUEUED,
        createdAt=created_at,
        data=data,
    )

    running_command = commands.LoadPipette(
        id="command-id",
        status=CommandStatus.RUNNING,
        createdAt=created_at,
        startedAt=started_at,
        data=data,
    )

    executed_command = commands.LoadPipette(
        id="command-id",
        status=CommandStatus.SUCCEEDED,
        createdAt=datetime(year=2021, month=1, day=1),
        startedAt=started_at,
        completedAt=completed_at,
        data=data,
    )

    decoy.when(state_store.state_view.commands.get("command-id")).then_return(
        queued_command
    )

    decoy.when(resources.model_utils.get_timestamp()).then_return(started_at)

    decoy.when(
        command_mapper.update_command(
            command=queued_command,
            status=CommandStatus.RUNNING,
            startedAt=started_at,
        )
    ).then_return(running_command)

    decoy.when(await command_executor.execute(running_command)).then_return(
        executed_command
    )

    result = await subject.execute_command_by_id("command-id")

    assert result == executed_command
    decoy.verify(
        state_store.handle_command(running_command),
        state_store.handle_command(executed_command),
    )


async def test_execute_command(
    decoy: Decoy,
    state_store: StateStore,
    command_executor: CommandExecutor,
    command_mapper: CommandMapper,
    resources: ResourceProviders,
    subject: ProtocolEngine,
) -> None:
    """It should add and execute a command from a request."""
    created_at = datetime(year=2021, month=1, day=1)
    completed_at = datetime(year=2022, month=3, day=3)

    data = commands.LoadPipetteData(
        mount=MountType.LEFT,
        pipetteName=PipetteName.P300_SINGLE,
    )

    request = commands.LoadPipetteRequest(data=data)

    queued_command = commands.LoadPipette(
        id="command-id",
        status=commands.CommandStatus.QUEUED,
        createdAt=created_at,
        data=data,
    )

    running_command = commands.LoadPipette(
        id="command-id",
        status=commands.CommandStatus.RUNNING,
        createdAt=created_at,
        startedAt=created_at,
        data=data,
    )

    executed_command = commands.LoadPipette(
        id="command-id",
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=created_at,
        startedAt=created_at,
        completedAt=completed_at,
        data=data,
    )

    decoy.when(resources.model_utils.get_timestamp()).then_return(created_at)

    decoy.when(
        command_mapper.map_request_to_command(
            request=request,
            created_at=created_at,
            command_id="command-id",
        )
    ).then_return(queued_command)

    decoy.when(
        command_mapper.update_command(
            command=queued_command,
            startedAt=created_at,
            status=CommandStatus.RUNNING,
        )
    ).then_return(running_command)

    decoy.when(await command_executor.execute(running_command)).then_return(
        executed_command
    )

    result = await subject.execute_command(request, "command-id")

    assert result == executed_command
    decoy.verify(
        state_store.handle_command(running_command),
        state_store.handle_command(executed_command),
    )
