"""Tests for the command lifecycle state."""
from datetime import datetime
from typing import List
import itertools

from opentrons.types import DeckSlotName
from opentrons.protocol_engine import StateStore
from opentrons.protocol_engine.types import DeckSlotLocation
from opentrons.protocol_engine.commands import (
    CommandRequestType,
    PendingCommand,
    RunningCommand,
    FailedCommand,
    LoadLabwareRequest,
    LoadLabwareResult,
)


def _make_unique_requests(n: int) -> List[LoadLabwareRequest]:
    """Return n dummy requests that are non-equal (!=) to each other."""
    def request(i: int) -> LoadLabwareRequest:
        return LoadLabwareRequest(
            loadName=f"load-name-{i}",
            namespace="opentrons-test",
            version=1,
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
            labwareId=None
        )
    requests = [request(i) for i in range(n)]
    for a, b in itertools.combinations(requests, 2):
        # Testing the test. If these accidentally compare equal real assertions in this
        # module (e.g. to compare iteration order) could trivially succeed.
        assert a != b
    return requests


def _make_request() -> LoadLabwareRequest:
    return _make_unique_requests(1)[0]


def test_state_store_handles_command(store: StateStore, now: datetime) -> None:
    """It should add a command to the store."""
    cmd = PendingCommand[LoadLabwareRequest, LoadLabwareResult](
        created_at=now,
        request=LoadLabwareRequest(
            loadName="load-name",
            namespace="opentrons-test",
            version=1,
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_2),
            labwareId=None
        )
    )

    store.handle_command(cmd, command_id="unique-id")

    assert store.commands.get_command_by_id("unique-id") == cmd


def test_command_state_preserves_handle_order(  # noqa:D103
    store: StateStore, now: datetime
) -> None:
    unique_commands = [
        PendingCommand[LoadLabwareRequest, LoadLabwareResult](
            created_at=now,
            request=r
        )
        for r in _make_unique_requests(3)
    ]
    command_a, command_b, command_c = unique_commands

    store.handle_command(command_a, "first-handled-id")
    store.handle_command(command_b, "second-handled-id")
    assert store.commands.get_all_commands() == [
        ("first-handled-id", command_a), ("second-handled-id", command_b)
    ]

    store.handle_command(command_c, "first-handled-id")
    assert store.commands.get_all_commands() == [
        ("first-handled-id", command_c), ("second-handled-id", command_b)
    ]


# todo(mm, 2021-06-10): Not sure if this is the right way to initialize the queue
# of commands for the purposes of this test.
#
# Options:
#
# * Manually initalize ._commands_by_id? ._commands_by_id is private (sort of), and
#   touching private attributes in a test seems Bad.
# * Add the commands through store.handle_command()? That would make this
#   test partially redundant with test_state_store_handles_command(), which seems
#   Bad.
# * Mock out CommandState.get_all_commands() and avoid the need to initialize the
#   queue of commands at all? That would mean CommandState is partially mocked out,
#   which seems Bad.
def test_get_next_request_returns_first_pending(  # noqa: D103
    store: StateStore, now: datetime
) -> None:
    running_command = RunningCommand[LoadLabwareRequest, LoadLabwareResult](
        created_at=now,
        started_at=now,
        request=_make_request()
    )
    pending_command = PendingCommand[LoadLabwareRequest, LoadLabwareResult](
        created_at=now,
        request=_make_request()
    )
    # Testing the test: the next assert is only meaningful if these compare nonequal.
    assert running_command != pending_command

    store.handle_command(running_command, "id-1")
    store.handle_command(pending_command, "id-2")
    # Skips running_command even though it came first.
    assert store.commands.get_next_request() == ("id-2", pending_command.request)


def test_get_next_request_returns_none_when_no_pending(  # noqa: D103
    store: StateStore, now: datetime
) -> None:
    assert store.commands.get_next_request() is None

    store.handle_command(
        RunningCommand[LoadLabwareRequest, LoadLabwareResult](
            created_at=now,
            started_at=now,
            request=_make_request()
        ),
        "command-id"
    )

    # todo(mm, 2021-06-11): We should throw a completed command and failed command
    # in here too, but I'm skipping it because they're a pain to construct.

    assert store.commands.get_next_request() is None


def test_get_next_request_returns_none_when_earlier_command_failed(  # noqa: D103
    store: StateStore, now: datetime
) -> None:
    # Fix before merge.
    raise NotImplementedError()
