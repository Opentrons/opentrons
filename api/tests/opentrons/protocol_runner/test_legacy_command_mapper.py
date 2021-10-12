"""Tests for the ProtocolRunner's LegacyContextPlugin."""
from decoy import matchers
from datetime import datetime

from opentrons.commands.types import PauseMessage
from opentrons.protocol_engine import commands as pe_commands
from opentrons.protocol_runner.legacy_command_mapper import (
    LegacyCommandMapper,
    LegacyCommandData,
)


def test_map_before_command() -> None:
    """It should map a "before" message to a running command."""
    legacy_command: PauseMessage = {
        "$": "before",
        "meta": {},
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello world", "text": "hello world"},
    }

    subject = LegacyCommandMapper()
    (result,) = subject.map_command(legacy_command)

    assert result == pe_commands.Custom.construct(
        id="command.PAUSE-0",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        data=LegacyCommandData(
            legacyCommandType="command.PAUSE",
            legacyCommandText="hello world",
        ),
    )


def test_map_after_command() -> None:
    """It should map an "after" message to a completed command."""
    legacy_command_start: PauseMessage = {
        "$": "before",
        "meta": {},
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello world", "text": "hello world"},
    }
    legacy_command_end: PauseMessage = {
        "$": "after",
        "meta": {},
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello world", "text": "hello world"},
    }

    subject = LegacyCommandMapper()

    _ = subject.map_command(legacy_command_start)
    (result,) = subject.map_command(legacy_command_end)

    assert result == pe_commands.Custom.construct(
        id="command.PAUSE-0",
        status=pe_commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        data=LegacyCommandData(
            legacyCommandType="command.PAUSE",
            legacyCommandText="hello world",
        ),
    )


def test_command_stack() -> None:
    """It should maintain a command stack to map IDs."""
    legacy_command_1: PauseMessage = {
        "$": "before",
        "meta": {},
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello", "text": "hello"},
    }
    legacy_command_2: PauseMessage = {
        "$": "before",
        "meta": {},
        "name": "command.PAUSE",
        "payload": {"userMessage": "goodbye", "text": "goodbye"},
    }
    legacy_command_3: PauseMessage = {
        "$": "after",
        "meta": {},
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello world", "text": "goodbye"},
    }
    legacy_command_4: PauseMessage = {
        "$": "after",
        "meta": {},
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello world", "text": "hello"},
    }

    subject = LegacyCommandMapper()
    (result_1,) = subject.map_command(legacy_command_1)
    (result_2,) = subject.map_command(legacy_command_2)
    (result_3,) = subject.map_command(legacy_command_3)
    (result_4,) = subject.map_command(legacy_command_4)

    assert result_1 == pe_commands.Custom.construct(
        id="command.PAUSE-0",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        data=LegacyCommandData(
            legacyCommandType="command.PAUSE",
            legacyCommandText="hello",
        ),
    )
    assert result_2 == pe_commands.Custom.construct(
        id="command.PAUSE-1",
        status=pe_commands.CommandStatus.RUNNING,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        data=LegacyCommandData(
            legacyCommandType="command.PAUSE",
            legacyCommandText="goodbye",
        ),
    )
    assert result_3 == pe_commands.Custom.construct(
        id="command.PAUSE-1",
        status=pe_commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        data=LegacyCommandData(
            legacyCommandType="command.PAUSE",
            legacyCommandText="goodbye",
        ),
    )
    assert result_4 == pe_commands.Custom.construct(
        id="command.PAUSE-0",
        status=pe_commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        data=LegacyCommandData(
            legacyCommandType="command.PAUSE",
            legacyCommandText="hello",
        ),
    )
