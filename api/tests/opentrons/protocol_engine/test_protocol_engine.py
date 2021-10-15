"""Tests for the ProtocolEngine class."""
import pytest
from datetime import datetime
from decoy import Decoy

from opentrons.types import MountType
from opentrons.hardware_control import API as HardwareAPI
from opentrons.protocol_engine import ProtocolEngine, commands
from opentrons.protocol_engine.types import PipetteName
from opentrons.protocol_engine.commands import CommandMapper
from opentrons.protocol_engine.execution import QueueWorker
from opentrons.protocol_engine.resources import ModelUtils
from opentrons.protocol_engine.state import StateStore
from opentrons.protocol_engine.plugins import AbstractPlugin

from opentrons.protocol_engine.actions import (
    ActionDispatcher,
    PlayAction,
    PauseAction,
    StopAction,
    StopErrorDetails,
    CommandUpdatedAction,
)


@pytest.fixture
def state_store(decoy: Decoy) -> StateStore:
    """Get a mock StateStore."""
    return decoy.mock(cls=StateStore)


@pytest.fixture
def action_dispatcher(decoy: Decoy) -> ActionDispatcher:
    """Get a mock ActionDispatcher."""
    return decoy.mock(cls=ActionDispatcher)


@pytest.fixture
def queue_worker(decoy: Decoy) -> QueueWorker:
    """Get a mock QueueWorker."""
    return decoy.mock(cls=QueueWorker)


@pytest.fixture
def command_mapper(decoy: Decoy) -> CommandMapper:
    """Get a mock CommandMapper."""
    return decoy.mock(cls=CommandMapper)


@pytest.fixture
def model_utils(decoy: Decoy) -> ModelUtils:
    """Get mock ModelUtils."""
    return decoy.mock(cls=ModelUtils)


@pytest.fixture
def hardware_api(decoy: Decoy) -> HardwareAPI:
    """Get a mock HardwareAPI."""
    return decoy.mock(cls=HardwareAPI)


@pytest.fixture
def subject(
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    command_mapper: CommandMapper,
    model_utils: ModelUtils,
    queue_worker: QueueWorker,
    hardware_api: HardwareAPI,
) -> ProtocolEngine:
    """Get a ProtocolEngine test subject with its dependencies stubbed out."""
    return ProtocolEngine(
        hardware_api=hardware_api,
        state_store=state_store,
        action_dispatcher=action_dispatcher,
        queue_worker=queue_worker,
        command_mapper=command_mapper,
        model_utils=model_utils,
    )


def test_add_command(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    command_mapper: CommandMapper,
    model_utils: ModelUtils,
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

    decoy.when(model_utils.generate_id()).then_return("command-id")
    decoy.when(model_utils.get_timestamp()).then_return(created_at)
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
        action_dispatcher.dispatch(CommandUpdatedAction(command=queued_command)),
    )


async def test_execute_command(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    command_mapper: CommandMapper,
    model_utils: ModelUtils,
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

    decoy.when(model_utils.generate_id()).then_return("command-id")
    decoy.when(model_utils.get_timestamp()).then_return(created_at)

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
        action_dispatcher.dispatch(CommandUpdatedAction(command=queued_command)),
        await state_store.wait_for(
            condition=state_store.commands.get_is_complete,
            command_id="command-id",
        ),
    )


def test_play(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    subject: ProtocolEngine,
) -> None:
    """It should be able to start executing queued commands."""
    subject.play()

    decoy.verify(
        state_store.commands.validate_action_allowed(PlayAction()),
        action_dispatcher.dispatch(PlayAction()),
    )


def test_pause(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    subject: ProtocolEngine,
) -> None:
    """It should be able to pause executing queued commands."""
    subject.pause()

    decoy.verify(
        state_store.commands.validate_action_allowed(PauseAction()),
        action_dispatcher.dispatch(PauseAction()),
    )


async def test_stop(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    queue_worker: QueueWorker,
    hardware_api: HardwareAPI,
    subject: ProtocolEngine,
) -> None:
    """It should be able to stop the engine."""
    await subject.stop()

    decoy.verify(
        action_dispatcher.dispatch(StopAction()),
        await queue_worker.join(),
        await hardware_api.stop(home_after=False),
    )


async def test_stop_with_error(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    queue_worker: QueueWorker,
    hardware_api: HardwareAPI,
    model_utils: ModelUtils,
    subject: ProtocolEngine,
) -> None:
    """It should be able to stop the engine."""
    error = RuntimeError("oh no")
    completed_at = datetime(year=2021, month=1, day=1)

    decoy.when(model_utils.get_timestamp()).then_return(completed_at)
    decoy.when(model_utils.generate_id()).then_return("error-id")

    await subject.stop(error=error)

    decoy.verify(
        action_dispatcher.dispatch(
            StopAction(
                error_details=StopErrorDetails(
                    error=error,
                    error_id="error-id",
                    created_at=completed_at,
                )
            )
        ),
        await queue_worker.join(),
        await hardware_api.stop(home_after=False),
    )


async def test_stop_stops_hardware_if_queue_worker_join_fails(
    decoy: Decoy,
    queue_worker: QueueWorker,
    hardware_api: HardwareAPI,
    subject: ProtocolEngine,
) -> None:
    """It should be able to stop the engine."""
    decoy.when(
        await queue_worker.join(),
    ).then_raise(RuntimeError("oh no"))

    with pytest.raises(RuntimeError, match="oh no"):
        await subject.stop()

    decoy.verify(
        await hardware_api.stop(home_after=False),
        times=1,
    )


async def test_wait_until_complete(
    decoy: Decoy,
    state_store: StateStore,
    subject: ProtocolEngine,
) -> None:
    """It should be able to stop the engine after waiting for commands to complete."""
    await subject.wait_until_complete()

    decoy.verify(
        await state_store.wait_for(condition=state_store.commands.get_all_complete)
    )


async def test_halt(
    decoy: Decoy,
    action_dispatcher: ActionDispatcher,
    queue_worker: QueueWorker,
    hardware_api: HardwareAPI,
    subject: ProtocolEngine,
) -> None:
    """It should be able to halt the engine."""
    await subject.halt()

    decoy.verify(
        action_dispatcher.dispatch(StopAction()),
        queue_worker.cancel(),
        await hardware_api.halt(),
    )


def test_add_plugin(
    decoy: Decoy,
    state_store: StateStore,
    action_dispatcher: ActionDispatcher,
    subject: ProtocolEngine,
) -> None:
    """It should configure and add a plugin to the ActionDispatcher pipeline."""
    plugin = decoy.mock(cls=AbstractPlugin)

    subject.add_plugin(plugin)

    decoy.verify(
        plugin._configure(state=state_store, action_dispatcher=action_dispatcher),
        action_dispatcher.add_handler(plugin),
    )
