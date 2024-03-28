"""CommandHistory state store tests."""
import pytest

from opentrons.ordered_set import OrderedSet

from opentrons.protocol_engine.errors.exceptions import CommandDoesNotExistError
from opentrons.protocol_engine.state.command_history import CommandHistory, CommandEntry

from .command_fixtures import (
    create_queued_command,
)


def create_queued_command_entry(
    command_id: str = "command-id", index: int = 0
) -> CommandEntry:
    """Create a command entry for a queued command."""
    return CommandEntry(create_queued_command(command_id=command_id), index)


@pytest.fixture
def command_history() -> CommandHistory:
    """Instantiates a CommandHistory instance."""
    return CommandHistory()


def test_length(command_history: CommandHistory) -> None:
    """It should return the length of the command history."""
    assert command_history.length() == 0
    command_history._add("0", create_queued_command_entry())
    assert command_history.length() == 1


def test_has(command_history: CommandHistory) -> None:
    """It should return True if the command exists in the history, False otherwise."""
    assert not command_history.has("0")
    command_history._add("0", create_queued_command_entry())
    assert command_history.has("0")


def test_get(command_history: CommandHistory) -> None:
    """It should return the command entry for the given ID."""
    with pytest.raises(CommandDoesNotExistError):
        command_history.get("0")
    command_entry = create_queued_command_entry()
    command_history._add("0", command_entry)
    assert command_history.get("0") == command_entry


def test_get_next(command_history: CommandHistory) -> None:
    """It should return the next command entry after the command associated with the given ID."""
    with pytest.raises(CommandDoesNotExistError):
        command_history.get_next("0")
    command_entry_1 = create_queued_command_entry()
    command_entry_2 = create_queued_command_entry(index=1)
    command_history._add("0", command_entry_1)
    command_history._add("1", command_entry_2)
    assert command_history.get_next("0") == command_entry_2
    assert command_history.get_next("1") is None


def test_get_prev(command_history: CommandHistory) -> None:
    """It should return the previous command entry before the command associated with the given ID."""
    with pytest.raises(CommandDoesNotExistError):
        command_history.get_prev("0")
    command_entry_1 = create_queued_command_entry()
    command_entry_2 = create_queued_command_entry(index=1)
    command_history._add("0", command_entry_1)
    command_history._add("1", command_entry_2)
    assert command_history.get_prev("0") is None
    assert command_history.get_prev("1") == command_entry_1


def test_get_if_present(command_history: CommandHistory) -> None:
    """It should return the command entry for the given ID if it exists, None otherwise."""
    assert command_history.get_if_present("0") is None
    command_entry = create_queued_command_entry()
    command_history._add("0", command_entry)
    assert command_history.get_if_present("0") == command_entry


def test_get_all_commands(command_history: CommandHistory) -> None:
    """It should return a list of all commands."""
    assert command_history.get_all_commands() == []
    command_entry_1 = create_queued_command_entry()
    command_entry_2 = create_queued_command_entry(index=1)
    command_history._add("0", command_entry_1)
    command_history._add("1", command_entry_2)
    assert command_history.get_all_commands() == [
        command_entry_1.command,
        command_entry_2.command,
    ]


def test_get_all_ids(command_history: CommandHistory) -> None:
    """It should return a list of all command IDs."""
    assert command_history.get_all_ids() == []
    command_entry_1 = create_queued_command_entry()
    command_entry_2 = create_queued_command_entry(index=1)
    command_history._add("0", command_entry_1)
    command_history._add("1", command_entry_2)
    assert command_history.get_all_ids() == ["0", "1"]


def test_get_slice(command_history: CommandHistory) -> None:
    """It should return a slice of commands."""
    assert command_history.get_slice(0, 2) == []
    command_entry_1 = create_queued_command_entry()
    command_entry_2 = create_queued_command_entry(index=1)
    command_entry_3 = create_queued_command_entry(index=2)
    command_history._add("0", command_entry_1)
    command_history._add("1", command_entry_2)
    command_history._add("2", command_entry_3)
    assert command_history.get_slice(1, 3) == [
        command_entry_2.command,
        command_entry_3.command,
    ]


def test_get_tail_command(command_history: CommandHistory) -> None:
    """It should return the tail command."""
    assert command_history.get_tail_command() is None
    command_entry_1 = create_queued_command_entry()
    command_entry_2 = create_queued_command_entry(index=1)
    command_history._add("0", command_entry_1)
    command_history._add("1", command_entry_2)
    assert command_history.get_tail_command() == command_entry_2


def test_get_recently_dequeued_command(command_history: CommandHistory) -> None:
    """It should return the most recently dequeued command."""
    assert command_history.get_terminal_command() is None
    command_entry = create_queued_command_entry()
    command_history._add("0", command_entry)
    command_history._set_terminal_command_id("0")
    assert command_history.get_terminal_command() == command_entry


def test_get_running_command(command_history: CommandHistory) -> None:
    """It should return the currently running command."""
    assert command_history.get_running_command() is None
    command_entry = create_queued_command_entry()
    command_history._add("0", command_entry)
    command_history._set_running_command_id("0")
    assert command_history.get_running_command() == command_entry


def test_get_queue_ids(command_history: CommandHistory) -> None:
    """It should return the IDs of all commands in the queue."""
    assert command_history.get_queue_ids() == OrderedSet()
    command_history._add_to_queue("0")
    command_history._add_to_queue("1")
    assert command_history.get_queue_ids() == OrderedSet(["0", "1"])


def test_get_setup_queue_ids(command_history: CommandHistory) -> None:
    """It should return the IDs of all commands in the setup queue."""
    assert command_history.get_setup_queue_ids() == OrderedSet()
    command_history._add_to_setup_queue("0")
    command_history._add_to_setup_queue("1")
    assert command_history.get_setup_queue_ids() == OrderedSet(["0", "1"])


def test_set_command_entry(command_history: CommandHistory) -> None:
    """It should set the command entry for the given ID."""
    command_entry = create_queued_command_entry()
    command_history._add("0", command_entry)
    assert command_history.get("0") == command_entry


def test_set_recent_dequeued_command_id(command_history: CommandHistory) -> None:
    """It should set the ID of the most recently dequeued command."""
    command_entry = create_queued_command_entry()
    command_history._add("0", command_entry)
    command_history._set_terminal_command_id("0")
    assert command_history.get_terminal_command() == command_entry


def test_set_running_command_id(command_history: CommandHistory) -> None:
    """It should set the ID of the currently running command."""
    command_entry = create_queued_command_entry()
    command_history._add("0", command_entry)
    command_history._set_running_command_id("0")
    assert command_history.get_running_command() == command_entry


def test_add_to_queue(command_history: CommandHistory) -> None:
    """It should add the given ID to the queue."""
    command_history._add_to_queue("0")
    assert command_history.get_queue_ids() == OrderedSet(["0"])


def test_add_to_setup_queue(command_history: CommandHistory) -> None:
    """It should add the given ID to the setup queue."""
    command_history._add_to_setup_queue("0")
    assert command_history.get_setup_queue_ids() == OrderedSet(["0"])


def test_clear_queue(command_history: CommandHistory) -> None:
    """It should clear all commands in the queue."""
    command_history._add_to_queue("0")
    command_history._add_to_queue("1")
    command_history.clear_queue()
    assert command_history.get_queue_ids() == OrderedSet()


def test_clear_setup_queue(command_history: CommandHistory) -> None:
    """It should clear all commands in the setup queue."""
    command_history._add_to_setup_queue("0")
    command_history._add_to_setup_queue("1")
    command_history.clear_setup_queue()
    assert command_history.get_setup_queue_ids() == OrderedSet()


def test_remove_id_from_queue(command_history: CommandHistory) -> None:
    """It should remove the given ID from the queue."""
    command_history._add_to_queue("0")
    command_history._add_to_queue("1")
    command_history._remove_queue_id("0")
    assert command_history.get_queue_ids() == OrderedSet(["1"])


def test_remove_id_from_setup_queue(command_history: CommandHistory) -> None:
    """It should remove the given ID from the setup queue."""
    command_history._add_to_setup_queue("0")
    command_history._add_to_setup_queue("1")
    command_history._remove_setup_queue_id("0")
    assert command_history.get_setup_queue_ids() == OrderedSet(["1"])
