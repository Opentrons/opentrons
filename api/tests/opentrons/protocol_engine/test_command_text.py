"""Tests for command_text annotator."""

from datetime import datetime, timezone

from opentrons.protocol_engine import (
    LoadedLabware,
    StateSummary,
    annotate_commands_with_command_text,
)
from opentrons.protocol_engine.commands import (
    Aspirate,
    AspirateParams,
    Comment,
    CommentParams,
    Custom,
    CustomParams,
    Home,
    HomeParams,
)
from opentrons.protocol_engine.commands.thermocycler import CloseLid, CloseLidParams
from opentrons.protocol_engine.commands.wait_for_duration import (
    WaitForDuration,
    WaitForDurationParams,
)
from opentrons.protocol_engine.types import (
    DeckSlotLocation,
    EngineStatus,
)
from opentrons.types import DeckSlotName


def _make_command_id() -> str:
    return "cmd-test-1"


def _make_created_at() -> datetime:
    return datetime.now(tz=timezone.utc)


def _empty_state_summary() -> StateSummary:
    return StateSummary(
        status=EngineStatus.SUCCEEDED,
        errors=[],
        labware=[],
        pipettes=[],
        modules=[],
        labwareOffsets=[],
        liquids=[],
    )


def test_annotate_direct_translation_home() -> None:
    """Home command gets commandTextKey 'home_gantry' and no params."""
    home_params = HomeParams()
    command = Home(
        id=_make_command_id(),
        createdAt=_make_created_at(),
        commandType="home",
        key="home-1",
        status="succeeded",
        params=home_params,
    )
    state = _empty_state_summary()
    annotate_commands_with_command_text([command], state, "OT-2 Standard")
    assert command.commandTextKey == "home_gantry"
    assert command.commandTextParams is None


def test_annotate_direct_translation_thermocycler_close_lid() -> None:
    """thermocycler/closeLid gets commandTextKey 'closing_tc_lid' and no params."""
    command = CloseLid(
        id=_make_command_id(),
        createdAt=_make_created_at(),
        commandType="thermocycler/closeLid",
        key="tc-close-1",
        status="succeeded",
        params=CloseLidParams(moduleId="mod-1"),
    )
    state = _empty_state_summary()
    annotate_commands_with_command_text([command], state, "OT-2 Standard")
    assert command.commandTextKey == "closing_tc_lid"
    assert command.commandTextParams is None


def test_annotate_comment() -> None:
    """Comment command gets commandTextKey 'comment' and message in params."""
    command = Comment(
        id=_make_command_id(),
        createdAt=_make_created_at(),
        commandType="comment",
        key="comment-1",
        status="succeeded",
        params=CommentParams(message="Hello, protocol!"),
    )
    state = _empty_state_summary()
    annotate_commands_with_command_text([command], state, "OT-2 Standard")
    assert command.commandTextKey == "comment"
    assert command.commandTextParams is not None
    assert command.commandTextParams.get("message") == "Hello, protocol!"


def test_annotate_aspirate_with_labware_and_location() -> None:
    """Aspirate command gets key and params including labware, location, volume, flow_rate."""
    labware_id = "labware-plate-1"
    well_name = "A1"
    state = StateSummary(
        status=EngineStatus.SUCCEEDED,
        errors=[],
        labware=[
            LoadedLabware(
                id=labware_id,
                loadName="generic_96_wellplate_380_ul",
                definitionUri="opentrons/generic_96_wellplate_380_ul/1",
                location=DeckSlotLocation(slotName=DeckSlotName.SLOT_1),
            )
        ],
        pipettes=[],
        modules=[],
        labwareOffsets=[],
        liquids=[],
    )
    command = Aspirate(
        id=_make_command_id(),
        createdAt=_make_created_at(),
        commandType="aspirate",
        key="aspirate-1",
        status="succeeded",
        params=AspirateParams(
            pipetteId="pipette-1",
            labwareId=labware_id,
            wellName=well_name,
            volume=50.5,
            flowRate=300.0,
        ),
    )
    annotate_commands_with_command_text([command], state, "OT-2 Standard")
    assert command.commandTextKey == "aspirate"
    assert command.commandTextParams is not None
    assert command.commandTextParams.get("well_name") == well_name
    assert command.commandTextParams.get("labware") == "generic_96_wellplate_380_ul"
    assert command.commandTextParams.get("labware_location") == "Slot 1"
    assert command.commandTextParams.get("volume") == "50.5"
    assert command.commandTextParams.get("flow_rate") == "300"


def test_annotate_aspirate_unknown_labware_id_leaves_empty_display() -> None:
    """Aspirate with labwareId not in state still gets key and params with empty labware/location."""
    command = Aspirate(
        id=_make_command_id(),
        createdAt=_make_created_at(),
        commandType="aspirate",
        key="aspirate-1",
        status="succeeded",
        params=AspirateParams(
            pipetteId="pipette-1",
            labwareId="nonexistent-labware",
            wellName="A1",
            volume=10,
            flowRate=100.0,
        ),
    )
    state = _empty_state_summary()
    annotate_commands_with_command_text([command], state, "OT-2 Standard")
    assert command.commandTextKey == "aspirate"
    assert command.commandTextParams is not None
    assert command.commandTextParams.get("well_name") == "A1"
    assert command.commandTextParams.get("labware") == ""
    assert command.commandTextParams.get("labware_location") == ""


def test_annotate_wait_for_duration() -> None:
    """waitForDuration command gets key and seconds in params."""
    command = WaitForDuration(
        id=_make_command_id(),
        createdAt=_make_created_at(),
        commandType="waitForDuration",
        key="wait-1",
        status="succeeded",
        params=WaitForDurationParams(seconds=30.7),
    )
    state = _empty_state_summary()
    annotate_commands_with_command_text([command], state, "OT-2 Standard")
    assert command.commandTextKey == "wait_for_duration"
    assert command.commandTextParams is not None
    assert command.commandTextParams.get("seconds") == "30"


def test_annotate_custom_command_uses_comment_key() -> None:
    """Custom commands get commandTextKey 'comment' and message from legacyCommandText or params."""
    command = Custom(
        id=_make_command_id(),
        createdAt=_make_created_at(),
        commandType="custom",
        key="custom-1",
        status="succeeded",
        params=CustomParams(text="some custom text"),
    )
    state = _empty_state_summary()
    annotate_commands_with_command_text([command], state, "OT-2 Standard")
    assert command.commandTextKey == "comment"
    assert command.commandTextParams is not None
    assert "message" in command.commandTextParams
    assert "custom" in command.commandTextParams["message"]
