"""CommandHistory state store tests."""
import pytest

from opentrons.ordered_set import OrderedSet

from opentrons.protocol_engine.errors.exceptions import CommandDoesNotExistError
from opentrons.protocol_engine.state.commands import CommandHistory

from .command_fixtures import (
    create_queued_command_entry,
)


@pytest.fixture
def command_history() -> CommandHistory:
    """Instantiates a CommandHistory instance."""
    return CommandHistory()


def test_length(command_history: CommandHistory) -> None:
    assert command_history.length() == 0
    command_history.set_command_entry("0", create_queued_command_entry())
    assert command_history.length() == 1


def test_has(command_history: CommandHistory) -> None:
    assert not command_history.has("0")
    command_history.set_command_entry("0", create_queued_command_entry())
    assert command_history.has("0")


def test_get(command_history: CommandHistory) -> None:
    with pytest.raises(CommandDoesNotExistError):
        command_history.get("0")
    command_entry = create_queued_command_entry()
    command_history.set_command_entry("0", command_entry)
    assert command_history.get("0") == command_entry


def test_get_next(command_history: CommandHistory) -> None:
    with pytest.raises(CommandDoesNotExistError):
        command_history.get_next("0")
    command_entry_1 = create_queued_command_entry()
    command_entry_2 = create_queued_command_entry(index=1)
    command_history.set_command_entry("0", command_entry_1)
    command_history.set_command_entry("1", command_entry_2)
    assert command_history.get_next("0") == command_entry_2
    assert command_history.get_next("1") is None


def test_get_if_present(command_history: CommandHistory) -> None:
    assert command_history.get_if_present("0") is None
    command_entry = create_queued_command_entry()
    command_history.set_command_entry("0", command_entry)
    assert command_history.get_if_present("0") == command_entry


def test_get_all_commands(command_history: CommandHistory) -> None:
    assert command_history.get_all_commands() == []
    command_entry_1 = create_queued_command_entry()
    command_entry_2 = create_queued_command_entry(index=1)
    command_history.set_command_entry("0", command_entry_1)
    command_history.set_command_entry("1", command_entry_2)
    assert command_history.get_all_commands() == [
        command_entry_1.command,
        command_entry_2.command,
    ]


def test_get_all_ids(command_history: CommandHistory) -> None:
    assert command_history.get_all_ids() == []
    command_entry_1 = create_queued_command_entry()
    command_entry_2 = create_queued_command_entry(index=1)
    command_history.set_command_entry("0", command_entry_1)
    command_history.set_command_entry("1", command_entry_2)
    assert command_history.get_all_ids() == ["0", "1"]


def test_get_slice(command_history: CommandHistory) -> None:
    assert command_history.get_slice(0, 2) == []
    command_entry_1 = create_queued_command_entry()
    command_entry_2 = create_queued_command_entry(index=1)
    command_entry_3 = create_queued_command_entry(index=2)
    command_history.set_command_entry("0", command_entry_1)
    command_history.set_command_entry("1", command_entry_2)
    command_history.set_command_entry("2", command_entry_3)
    assert command_history.get_slice(1, 3) == [
        command_entry_2.command,
        command_entry_3.command,
    ]


def test_get_tail_command(command_history: CommandHistory) -> None:
    assert command_history.get_tail_command() is None
    command_entry_1 = create_queued_command_entry()
    command_entry_2 = create_queued_command_entry(index=1)
    command_history.set_command_entry("0", command_entry_1)
    command_history.set_command_entry("1", command_entry_2)
    assert command_history.get_tail_command() == command_entry_2


def test_get_recently_dequeued_command(command_history: CommandHistory) -> None:
    assert command_history.get_recent_dequeued_command() is None
    command_entry = create_queued_command_entry()
    command_history.set_command_entry("0", command_entry)
    command_history.set_recent_dequeued_command_id("0")
    assert command_history.get_recent_dequeued_command() == command_entry


def test_get_running_command(command_history: CommandHistory) -> None:
    assert command_history.get_running_command() is None
    command_entry = create_queued_command_entry()
    command_history.set_command_entry("0", command_entry)
    command_history.set_running_command_id("0")
    assert command_history.get_running_command() == command_entry


def test_get_queue_ids(command_history: CommandHistory) -> None:
    assert command_history.get_queue_ids() == OrderedSet()
    command_history.add_to_queue("0")
    command_history.add_to_queue("1")
    assert command_history.get_queue_ids() == OrderedSet(["0", "1"])


def test_get_setup_queue_ids(command_history: CommandHistory) -> None:
    assert command_history.get_setup_queue_ids() == OrderedSet()
    command_history.add_to_setup_queue("0")
    command_history.add_to_setup_queue("1")
    assert command_history.get_setup_queue_ids() == OrderedSet(["0", "1"])


def test_set_command_entry(command_history: CommandHistory) -> None:
    command_entry = create_queued_command_entry()
    command_history.set_command_entry("0", command_entry)
    assert command_history.get("0") == command_entry


def test_set_recent_dequeued_command_id(command_history: CommandHistory) -> None:
    command_entry = create_queued_command_entry()
    command_history.set_command_entry("0", command_entry)
    command_history.set_recent_dequeued_command_id("0")
    assert command_history.get_recent_dequeued_command() == command_entry


def test_set_running_command_id(command_history: CommandHistory) -> None:
    command_entry = create_queued_command_entry()
    command_history.set_command_entry("0", command_entry)
    command_history.set_running_command_id("0")
    assert command_history.get_running_command() == command_entry


def test_add_to_queue(command_history: CommandHistory) -> None:
    command_history.add_to_queue("0")
    assert command_history.get_queue_ids() == OrderedSet(["0"])


def test_add_to_setup_queue(command_history: CommandHistory) -> None:
    command_history.add_to_setup_queue("0")
    assert command_history.get_setup_queue_ids() == OrderedSet(["0"])


def test_clear_queue(command_history: CommandHistory) -> None:
    command_history.add_to_queue("0")
    command_history.add_to_queue("1")
    command_history.clear_queue()
    assert command_history.get_queue_ids() == OrderedSet()


def test_clear_setup_queue(command_history: CommandHistory) -> None:
    command_history.add_to_setup_queue("0")
    command_history.add_to_setup_queue("1")
    command_history.clear_setup_queue()
    assert command_history.get_setup_queue_ids() == OrderedSet()


def test_remove_id_from_queue(command_history: CommandHistory) -> None:
    command_history.add_to_queue("0")
    command_history.add_to_queue("1")
    command_history.remove_id_from_queue("0")
    assert command_history.get_queue_ids() == OrderedSet(["1"])


def test_remove_id_from_setup_queue(command_history: CommandHistory) -> None:
    command_history.add_to_setup_queue("0")
    command_history.add_to_setup_queue("1")
    command_history.remove_id_from_setup_queue("0")
    assert command_history.get_setup_queue_ids() == OrderedSet(["1"])
