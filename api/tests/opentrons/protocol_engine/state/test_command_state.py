"""Tests for the command lifecycle state."""
import pytest

from datetime import datetime
from typing import List

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


def test_command_state_preserves_handle_order(
    store: StateStore,
    pending_command: PendingCommand,
    completed_command: CompletedCommand,
    running_command: RunningCommand
) -> None:
    """It should return commands in the order they are first added."""
    # Any arbitrary 3 commands that compare non-equal (!=) to each other.
    command_a = pending_command
    command_b = running_command
    command_c = completed_command

    store.handle_command(command_a, "command-id-1")
    store.handle_command(command_b, "command-id-2")
    assert store.commands.get_all_commands() == [
        ("command-id-1", command_a), ("command-id-2", command_b)
    ]

    store.handle_command(command_c, "command-id-1")
    assert store.commands.get_all_commands() == [
        ("command-id-1", command_c), ("command-id-2", command_b)
    ]


def test_get_next_request_returns_first_pending(
    pending_command: PendingCommand,
    running_command: RunningCommand,
    completed_command: CompletedCommand,
    failed_command: FailedCommand,
) -> None:
    """It should return the first command that's pending."""
    subject = CommandState()

    subject._commands_by_id["command-id-1"] = running_command
    subject._commands_by_id["command-id-2"] = completed_command
    subject._commands_by_id["command-id-3"] = pending_command
    subject._commands_by_id["command-id-4"] = pending_command

    assert subject.get_next_request() == (
        "command-id-3", pending_command.request
    )


def test_get_next_request_returns_none_when_no_pending(
    running_command: RunningCommand,
    completed_command: CompletedCommand,
    failed_command: FailedCommand
) -> None:
    """It should return None if there are no pending commands to return."""
    subject = CommandState()

    assert subject.get_next_request() is None

    subject._commands_by_id["running-command-id"] = running_command
    subject._commands_by_id["completed-command-id"] = completed_command
    subject._commands_by_id["failed-command-id"] = failed_command

    assert subject.get_next_request() is None


def test_get_next_request_returns_none_when_earlier_command_failed(
    pending_command: PendingCommand,
    failed_command: FailedCommand
) -> None:
    """It should return None if any prior-added command is failed."""
    subject = CommandState()

    subject._commands_by_id["command-id-1"] = failed_command
    subject._commands_by_id["command-id-2"] = pending_command

    assert subject.get_next_request() is None
