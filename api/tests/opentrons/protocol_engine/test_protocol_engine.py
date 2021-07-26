"""Tests for the ProtocolEngine class."""
import pytest
from datetime import datetime
from decoy import Decoy

from opentrons.types import MountType
from opentrons.protocol_engine import ProtocolEngine, commands
from opentrons.protocol_engine.commands import CommandMapper
from opentrons.protocol_engine.types import PipetteName
from opentrons.protocol_engine.execution import QueueWorker
from opentrons.protocol_engine.resources import ResourceProviders

from opentrons.protocol_engine.state import (
    StateStore,
    PlayAction,
    PauseAction,
    StopAction,
    UpdateCommandAction,
)


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def queue_worker(decoy: Decoy) -> QueueWorker:
    """Get a mock CommandExecutor."""
    return decoy.mock(cls=QueueWorker)


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
    command_mapper: CommandMapper,
    resources: ResourceProviders,
    queue_worker: QueueWorker,
) -> ProtocolEngine:
    """Get a ProtocolEngine test subject with its dependencies stubbed out."""
    return ProtocolEngine(
        state_store=state_store,
        queue_worker=queue_worker,
        command_mapper=command_mapper,
        resources=resources,
    )


def test_add_command(
    decoy: Decoy,
    state_store: StateStore,
    command_mapper: CommandMapper,
    resources: ResourceProviders,
    queue_worker: QueueWorker,
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
    decoy.verify(
        state_store.handle_action(UpdateCommandAction(command=queued_command)),
    )


async def test_execute_command(
    decoy: Decoy,
    state_store: StateStore,
    command_mapper: CommandMapper,
    resources: ResourceProviders,
    queue_worker: QueueWorker,
    subject: ProtocolEngine,
) -> None:
    """It should add and execute a command from a request."""
    created_at = datetime(year=2021, month=1, day=1)
    completed_at = datetime(year=2023, month=3, day=3)

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

    executed_command = commands.LoadPipette(
        id="command-id",
        status=commands.CommandStatus.SUCCEEDED,
        createdAt=created_at,
        startedAt=created_at,
        completedAt=completed_at,
        data=data,
    )

    decoy.when(resources.model_utils.generate_id()).then_return("command-id")
    decoy.when(resources.model_utils.get_timestamp()).then_return(created_at)

    decoy.when(
        command_mapper.map_request_to_command(
            command_id="command-id",
            created_at=created_at,
            request=request,
        )
    ).then_return(queued_command)

    decoy.when(state_store.commands.get(command_id="command-id")).then_return(
        executed_command
    )

    result = await subject.add_and_execute_command(request)

    assert result == executed_command

    decoy.verify(
        state_store.handle_action(UpdateCommandAction(command=queued_command)),
        await state_store.wait_for(
            condition=state_store.commands.get_is_complete,
            command_id="command-id",
        ),
    )


def test_play(
    decoy: Decoy,
    state_store: StateStore,
    subject: ProtocolEngine,
) -> None:
    """It should be able to start executing queued commands."""
    subject.play()

    decoy.verify(state_store.handle_action(PlayAction()))


def test_pause(
    decoy: Decoy,
    state_store: StateStore,
    subject: ProtocolEngine,
) -> None:
    """It should be able to pause executing queued commands."""
    subject.pause()

    decoy.verify(state_store.handle_action(PauseAction()))


async def test_wait_for_done(
    decoy: Decoy,
    state_store: StateStore,
    queue_worker: QueueWorker,
    subject: ProtocolEngine,
) -> None:
    """It should be able to wait until the engine is done executing."""
    await subject.wait_for_done()

    decoy.verify(
        await state_store.wait_for(state_store.commands.get_is_complete),
        await queue_worker.stop(),
        state_store.handle_action(StopAction()),
    )
