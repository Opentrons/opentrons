"""Test."""
from typing import List, Tuple

import pytest
from mock import AsyncMock, call  # type: ignore[attr-defined]

from opentrons.file_runner.command_queue_worker import CommandQueueWorker
from opentrons.protocol_engine import ProtocolEngine, WellLocation, StateStore
from opentrons.protocol_engine.commands import PickUpTipRequest, \
    AspirateRequest, DispenseRequest, CommandRequestType


@pytest.fixture
def commands() -> List[Tuple[str, CommandRequestType]]:
    """Fixture."""
    return [
        (
            "command-id-0",
            PickUpTipRequest(pipetteId="123", labwareId="abc", wellName="def"),
        ),
        (
            "command-id-1",
            AspirateRequest(
                volume=321,
                wellLocation=WellLocation(),
                pipetteId="123",
                labwareId="xyz",
                wellName="def",
            ),
        ),
        (
            "command-id-2",
            DispenseRequest(
                volume=321,
                wellLocation=WellLocation(),
                pipetteId="123",
                labwareId="xyz",
                wellName="def",
            ),
        ),
    ]


@pytest.fixture
def store() -> AsyncMock:
    """Create a state store fixture."""
    return AsyncMock(spec=StateStore)


@pytest.fixture
def store_with_commands(
        store: AsyncMock, commands: List[Tuple[str, CommandRequestType]]
) -> AsyncMock:
    """Create a state store fixture with pending commands."""
    # List of Tuples. Command id and command. With None terminator.
    # type ignore is because mypy doesn't like concatenating lists of different types.
    pending_commands = commands[:] + [None]  # type: ignore
    store.commands.get_next_request.side_effect = pending_commands
    return store


@pytest.fixture
def protocol_engine(store: AsyncMock) -> AsyncMock:
    """Create a protocol engine fixture."""
    mock = AsyncMock(spec=ProtocolEngine)
    mock.state_store = store
    return mock


@pytest.fixture
def subject(protocol_engine: AsyncMock) -> CommandQueueWorker:
    """The command queue worker under test."""
    return CommandQueueWorker(protocol_engine=protocol_engine)


async def test_play_no_pending(
        protocol_engine: AsyncMock,
        subject: CommandQueueWorker,
        store: AsyncMock
) -> None:
    """It not execute any commands."""
    store.commands.get_next_request.return_value = None

    subject.play()
    await subject.wait_to_be_idle()

    protocol_engine.execute_command.assert_not_called()


async def test_play(
        protocol_engine: AsyncMock,
        subject: CommandQueueWorker,
        store_with_commands: AsyncMock,
        commands: List[Tuple[str, CommandRequestType]]
) -> None:
    """It should cycle through pending commands and execute them."""
    subject.play()
    await subject.wait_to_be_idle()

    expected_call_args_list = [call(request=r, command_id=i) for i, r in commands]
    print("Actual calls:", protocol_engine.execute_command.call_args_list)
    assert protocol_engine.execute_command.call_args_list == expected_call_args_list


async def test_pause(
        protocol_engine: AsyncMock,
        subject: CommandQueueWorker,
        store_with_commands: AsyncMock,
        commands: List[Tuple[str, CommandRequestType]]
) -> None:
    """It should cycle through pending commands and execute them."""
    async def mock_execute_command(
        request: CommandRequestType,
        command_id: str,
    ) -> None:
        if command_id == str("command-id-0"):
            # Pause after first command
            subject.pause()

    protocol_engine.execute_command.side_effect = mock_execute_command

    subject.play()
    await subject.wait_to_be_idle()

    # Only first command was executed.
    protocol_engine.execute_command.assert_called_once_with(
        request=commands[0][1], command_id=commands[0][0]
    )

    # Reset execute command mock and resume
    protocol_engine.execute_command.reset_mock()

    subject.play()
    await subject.wait_to_be_idle()

    expected_call_args_list = [call(request=r, command_id=i) for i, r in commands[1:]]

    assert protocol_engine.execute_command.call_args_list == expected_call_args_list
