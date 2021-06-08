"""Test."""
from typing import List, Tuple

import pytest
from mock import AsyncMock, MagicMock, call  # type: ignore[attr-defined]

from opentrons.file_runner.command_queue_worker import CommandQueueWorker
from opentrons.protocol_engine import (
    ProtocolEngine,
    WellLocation,
    StateView,
    commands as pe_commands,
)


@pytest.fixture
def commands() -> List[Tuple[str, pe_commands.CommandRequest]]:
    """Fixture."""
    return [
        (
            "command-id-0",
            pe_commands.PickUpTipRequest(
                data=pe_commands.PickUpTipData(
                    pipetteId="123",
                    labwareId="abc",
                    wellName="def",
                )
            ),
        ),
        (
            "command-id-1",
            pe_commands.AspirateRequest(
                data=pe_commands.AspirateData(
                    volume=321,
                    wellLocation=WellLocation(),
                    pipetteId="123",
                    labwareId="xyz",
                    wellName="def",
                ),
            ),
        ),
        (
            "command-id-2",
            pe_commands.DispenseRequest(
                data=pe_commands.DispenseData(
                    volume=321,
                    wellLocation=WellLocation(),
                    pipetteId="123",
                    labwareId="xyz",
                    wellName="def",
                ),
            ),
        ),
    ]


@pytest.fixture
def state_view() -> MagicMock:
    """Create a state view fixture."""
    return MagicMock(spec=StateView)


@pytest.fixture
def state_view_with_commands(
    state_view: MagicMock,
    commands: List[Tuple[str, pe_commands.CommandRequest]],
) -> MagicMock:
    """Create a state view fixture with pending commands."""
    # List of Tuples. Command id and command. With None terminator.
    # type ignore is because mypy doesn't like concatenating lists of different types.
    pending_commands = commands[:] + [None]  # type: ignore
    state_view.commands.get_next_request.side_effect = pending_commands
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
    protocol_engine: AsyncMock, subject: CommandQueueWorker, state_view: MagicMock
) -> None:
    """It should not execute any commands."""
    state_view.commands.get_next_request.return_value = None

    subject.play()
    await subject.wait_to_be_idle()

    protocol_engine.execute_command.assert_not_called()


async def test_play(
    protocol_engine: AsyncMock,
    subject: CommandQueueWorker,
    state_view_with_commands: MagicMock,
    commands: List[Tuple[str, pe_commands.CommandRequest]],
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
    state_view_with_commands: MagicMock,
    commands: List[Tuple[str, pe_commands.CommandRequest]],
) -> None:
    """It should cycle through pending commands and execute them."""

    async def mock_execute_command(
        request: pe_commands.CommandRequest,
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
