"""Tests for the ProtocolRunner's LegacyContextPlugin."""
from decoy import matchers
from datetime import datetime

from opentrons.commands.types import PauseMessage
from opentrons.protocol_engine import (
    CalibrationOffset,
    DeckSlotLocation,
    PipetteName,
    commands as pe_commands,
)
from opentrons.protocol_runner.legacy_command_mapper import (
    LegacyCommandMapper,
    LegacyCommandData,
)
from opentrons.protocol_runner.legacy_wrappers import (
    LegacyInstrumentLoadInfo,
    LegacyLabwareLoadInfo,
)
from opentrons_shared_data.labware.dev_types import LabwareDefinition
from opentrons.types import DeckSlotName, Mount, MountType


def test_map_before_command() -> None:
    """It should map a "before" message to a running command."""
    legacy_command: PauseMessage = {
        "$": "before",
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello world", "text": "hello world"},
        "error": None,
    }

    subject = LegacyCommandMapper()
    result = subject.map_command(legacy_command)

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
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello world", "text": "hello world"},
        "error": None,
    }
    legacy_command_end: PauseMessage = {
        "$": "after",
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello world", "text": "hello world"},
        "error": None,
    }

    subject = LegacyCommandMapper()

    _ = subject.map_command(legacy_command_start)
    result = subject.map_command(legacy_command_end)

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


def test_map_after_with_error_command() -> None:
    """It should map an "after" message to a completed command."""
    legacy_command_start: PauseMessage = {
        "$": "before",
        "name": "command.PAUSE",
        "error": None,
        "payload": {"userMessage": "hello world", "text": "hello world"},
    }
    legacy_command_end: PauseMessage = {
        "$": "after",
        "name": "command.PAUSE",
        "error": RuntimeError("oh no"),
        "payload": {"userMessage": "hello world", "text": "hello world"},
    }

    subject = LegacyCommandMapper()

    _ = subject.map_command(legacy_command_start)
    result = subject.map_command(legacy_command_end)

    assert result == pe_commands.Custom.construct(
        id="command.PAUSE-0",
        status=pe_commands.CommandStatus.FAILED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        data=LegacyCommandData(
            legacyCommandType="command.PAUSE",
            legacyCommandText="hello world",
        ),
        error="oh no",
    )


def test_command_stack() -> None:
    """It should maintain a command stack to map IDs."""
    legacy_command_1: PauseMessage = {
        "$": "before",
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello", "text": "hello"},
        "error": None,
    }
    legacy_command_2: PauseMessage = {
        "$": "before",
        "name": "command.PAUSE",
        "payload": {"userMessage": "goodbye", "text": "goodbye"},
        "error": None,
    }
    legacy_command_3: PauseMessage = {
        "$": "after",
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello world", "text": "goodbye"},
        "error": None,
    }
    legacy_command_4: PauseMessage = {
        "$": "after",
        "name": "command.PAUSE",
        "payload": {"userMessage": "hello world", "text": "hello"},
        "error": None,
    }

    subject = LegacyCommandMapper()
    result_1 = subject.map_command(legacy_command_1)
    result_2 = subject.map_command(legacy_command_2)
    result_3 = subject.map_command(legacy_command_3)
    result_4 = subject.map_command(legacy_command_4)

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


def test_map_labware_load(minimal_labware_def: LabwareDefinition) -> None:
    """It should correctly map a labware load."""
    input = LegacyLabwareLoadInfo(
        labware_definition=minimal_labware_def,
        labware_namespace="some_namespace",
        labware_load_name="some_load_name",
        labware_version=123,
        deck_slot=DeckSlotName.SLOT_1,
    )
    expected_output = pe_commands.LoadLabware.construct(
        id=matchers.IsA(str),
        status=pe_commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        data=pe_commands.LoadLabwareData.construct(
            location=DeckSlotLocation(slot=DeckSlotName.SLOT_1),
            namespace="some_namespace",
            loadName="some_load_name",
            version=123,
            labwareId=None,
        ),
        result=pe_commands.LoadLabwareResult.construct(
            labwareId=matchers.IsA(str),
            # Trusting that the exact fields within in the labware definition
            # get passed through corectly.
            definition=matchers.Anything(),
            calibration=CalibrationOffset(x=0, y=0, z=0),
        ),
    )

    output = LegacyCommandMapper().map_labware_load(input)
    assert output == expected_output


def test_map_instrument_load() -> None:
    """It should correctly map an instrument load."""
    input = LegacyInstrumentLoadInfo(
        instrument_load_name="p1000_single_gen2",
        mount=Mount.LEFT,
    )
    expected_output = pe_commands.LoadPipette.construct(
        id=matchers.IsA(str),
        status=pe_commands.CommandStatus.SUCCEEDED,
        createdAt=matchers.IsA(datetime),
        startedAt=matchers.IsA(datetime),
        completedAt=matchers.IsA(datetime),
        data=pe_commands.LoadPipetteData.construct(
            pipetteName=PipetteName.P1000_SINGLE_GEN2, mount=MountType.LEFT
        ),
        result=pe_commands.LoadPipetteResult.construct(pipetteId=matchers.IsA(str)),
    )

    output = LegacyCommandMapper().map_instrument_load(input)
    assert output == expected_output
