"""Test."""
import pytest
from mock import AsyncMock, MagicMock, call  # type: ignore[attr-defined]
from typing import List, Optional

from opentrons.file_runner.command_queue_worker import CommandQueueWorker
from opentrons.protocol_engine import ProtocolEngine, StateView


@pytest.fixture
def commands() -> List[str]:
    """Fixture."""
    return [
        "command-id-0",
        "command-id-1",
        "command-id-2",
    ]


@pytest.fixture
def state_view() -> MagicMock:
    """Create a state view fixture."""
    return MagicMock(spec=StateView)


@pytest.fixture
def state_view_with_commands(
    state_view: MagicMock,
    commands: List[Optional[str]],
) -> MagicMock:
    """Create a state view fixture with pending commands."""
    pending_commands = commands + [None]
    state_view.commands.get_next_command.side_effect = pending_commands
    return state_view


@pytest.fixture
def protocol_engine(state_view: MagicMock) -> AsyncMock:
    """Create a protocol engine fixture."""
    mock = AsyncMock(spec=ProtocolEngine)
    mock.state_view = state_view
    return mock


@pytest.fixture
def subject(protocol_engine: AsyncMock) -> CommandQueueWorker:
    """The command queue worker under test."""
    return CommandQueueWorker(protocol_engine=protocol_engine)


async def test_play_no_pending(
    protocol_engine: AsyncMock,
    subject: CommandQueueWorker,
    state_view: MagicMock,
) -> None:
    """It should not execute any commands."""
    state_view.commands.get_next_command.return_value = None

    subject.play()
    await subject.wait_to_be_idle()

    protocol_engine.execute_command_by_id.assert_not_called()


async def test_play(
    protocol_engine: AsyncMock,
    subject: CommandQueueWorker,
    state_view_with_commands: MagicMock,
    commands: List[str],
) -> None:
    """It should cycle through pending commands and execute them."""
    subject.play()
    await subject.wait_to_be_idle()

    expected_call_args_list = [call(command_id=command_id) for command_id in commands]
    assert (
        protocol_engine.execute_command_by_id.call_args_list == expected_call_args_list
    )


async def test_pause(
    protocol_engine: AsyncMock,
    subject: CommandQueueWorker,
    state_view_with_commands: MagicMock,
    commands: List[str],
) -> None:
    """It should cycle through pending commands and execute them."""

    async def mock_execute_command(command_id: str) -> None:
        if command_id == str("command-id-0"):
            # Pause after first command
            subject.pause()

    protocol_engine.execute_command_by_id.side_effect = mock_execute_command

    subject.play()
    await subject.wait_to_be_idle()

    # Only first command was executed.
    protocol_engine.execute_command_by_id.assert_called_once_with(
        command_id=commands[0]
    )

    # Reset execute command mock and resume
    protocol_engine.execute_command_by_id.reset_mock()

    subject.play()
    await subject.wait_to_be_idle()

    expected_call_args_list = [
        call(command_id=command_id) for command_id in commands[1:]
    ]

    assert (
        protocol_engine.execute_command_by_id.call_args_list == expected_call_args_list
    )
