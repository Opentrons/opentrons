"""Tests for the command lifecycle state."""
from datetime import datetime
from typing import List
import itertools

from opentrons.types import DeckSlotName
from opentrons.protocol_engine import StateStore
from opentrons.protocol_engine.types import DeckSlotLocation
from opentrons.protocol_engine.errors import ProtocolEngineError
from opentrons.protocol_engine.commands import (
    PendingCommand,
    RunningCommand,
    FailedCommand,
    LoadLabwareRequest,
    LoadLabwareResult,
)
from opentrons.protocol_engine.state.commands import CommandState


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

    store.handle_command(command_a, "command-id-1")
    store.handle_command(command_b, "command-id-2")
    assert store.commands.get_all_commands() == [
        ("command-id-1", command_a), ("command-id-2", command_b)
    ]

    store.handle_command(command_c, "command-id-1")
    assert store.commands.get_all_commands() == [
        ("command-id-1", command_c), ("command-id-2", command_b)
    ]


def test_get_next_request_returns_first_pending(  # noqa: D103
    now: datetime
) -> None:
    subject = CommandState()
    running_command = RunningCommand[LoadLabwareRequest, LoadLabwareResult](
        created_at=now,
        started_at=now,
        request=_make_request()
    )
    pending_command = PendingCommand[LoadLabwareRequest, LoadLabwareResult](
        created_at=now,
        request=_make_request()
    )

    # todo(mm, 2021-06-14): Add completed and failed, for thoroughness.
    subject._commands_by_id["command-id-1"] = running_command
    subject._commands_by_id["command-id-2"] = pending_command

    # running_command should be skipped even though it came first.
    assert subject.get_next_request() == (
        "command-id-2", pending_command.request
    )


def test_get_next_request_returns_none_when_no_pending(  # noqa: D103
    now: datetime
) -> None:
    subject = CommandState()
    # todo(mm, 2021-06-11): We should throw a completed command in here too.
    running_command = RunningCommand[LoadLabwareRequest, LoadLabwareResult](
        created_at=now,
        started_at=now,
        request=_make_request()
    )
    failed_command = FailedCommand[LoadLabwareRequest](
        created_at=now,
        started_at=now,
        failed_at=now,
        error=ProtocolEngineError(),
        request=_make_request()
    )

    assert subject.get_next_request() is None

    subject._commands_by_id["running-command-id"] = running_command
    subject._commands_by_id["failed-command-id"] = failed_command

    assert subject.get_next_request() is None


def test_get_next_request_returns_none_when_earlier_command_failed(  # noqa: D103
    now: datetime
) -> None:
    subject = CommandState()
    failed_command = FailedCommand[LoadLabwareRequest](
        created_at=now,
        started_at=now,
        failed_at=now,
        error=ProtocolEngineError(),
        request=_make_request()
    )
    pending_command = PendingCommand[LoadLabwareRequest, LoadLabwareResult](
        created_at=now,
        request=_make_request()
    )
    subject._commands_by_id["command-id-1"] = failed_command
    subject._commands_by_id["command-id-2"] = pending_command

    assert subject.get_next_request() is None
