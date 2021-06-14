"""Tests for the command lifecycle state."""
import pytest

from datetime import datetime
from typing import List
import itertools

from pydantic import BaseModel

from opentrons.types import DeckSlotName
from opentrons.protocol_engine import StateStore
from opentrons.protocol_engine.types import DeckSlotLocation
from opentrons.protocol_engine.errors import ProtocolEngineError
from opentrons.protocol_engine.commands import (
    PendingCommand,
    RunningCommand,
    CompletedCommand,
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


@pytest.fixture
def pending_command(now: datetime) -> PendingCommand:
    """Fixture for an arbitrary `PendingCommand`."""
    return PendingCommand[BaseModel, BaseModel](
        created_at=now,
        request=BaseModel()
    )


@pytest.fixture
def running_command(now: datetime) -> RunningCommand:
    """Fixture for an arbitrary `RunningCommand`."""
    return RunningCommand[BaseModel, BaseModel](
        created_at=now,
        started_at=now,
        request=BaseModel()
    )


@pytest.fixture
def completed_command(now: datetime) -> CompletedCommand:
    """Fixture for an arbitrary `CompletedCommand`."""
    return CompletedCommand[BaseModel, BaseModel](
        created_at=now,
        started_at=now,
        completed_at=now,
        request=BaseModel(),
        result=BaseModel()
    )


@pytest.fixture
def failed_command(now: datetime) -> FailedCommand:
    """Fixture for an arbitrary `FailedCommand`."""
    return FailedCommand[BaseModel](
        created_at=now,
        started_at=now,
        failed_at=now,
        request=BaseModel(),
        error=ProtocolEngineError()
    )


def test_state_store_handles_command(
    store: StateStore,
    pending_command: PendingCommand
) -> None:
    """It should add a command to the store that can be accessed later by ID."""
    store.handle_command(pending_command, command_id="unique-id")
    assert store.commands.get_command_by_id("unique-id") == pending_command


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
    pending_command: PendingCommand,
    running_command: RunningCommand
) -> None:
    subject = CommandState()

    # todo(mm, 2021-06-14): Add completed and failed, for thoroughness.
    subject._commands_by_id["command-id-1"] = running_command
    subject._commands_by_id["command-id-2"] = pending_command

    # running_command should be skipped even though it came first.
    assert subject.get_next_request() == (
        "command-id-2", pending_command.request
    )


def test_get_next_request_returns_none_when_no_pending(  # noqa: D103
    running_command: RunningCommand,
    failed_command: FailedCommand
) -> None:
    subject = CommandState()

    assert subject.get_next_request() is None

    # todo(mm, 2021-06-11): We should throw a completed command in here too.
    subject._commands_by_id["running-command-id"] = running_command
    subject._commands_by_id["failed-command-id"] = failed_command

    assert subject.get_next_request() is None


def test_get_next_request_returns_none_when_earlier_command_failed(  # noqa: D103
    pending_command: PendingCommand,
    failed_command: FailedCommand
) -> None:
    subject = CommandState()

    subject._commands_by_id["command-id-1"] = failed_command
    subject._commands_by_id["command-id-2"] = pending_command

    assert subject.get_next_request() is None
