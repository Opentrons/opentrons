"""Tests for analysis preview flag derivation."""

from opentrons.protocol_engine.types import DeckSlotLocation, LoadedLabware
from opentrons.types import DeckSlotName

from robot_server.protocols.analysis_preview import (
    ExtractedCommand,
    required_addressable_areas,
    uses_gripper,
)


def test_uses_gripper() -> None:
    """It should detect gripper moveLabware commands."""
    assert uses_gripper([]) is False
    assert (
        uses_gripper(
            [
                ExtractedCommand(
                    command_type="moveLabware", strategy="manualMoveWithPause"
                )
            ]
        )
        is False
    )
    assert (
        uses_gripper(
            [ExtractedCommand(command_type="moveLabware", strategy="usingGripper")]
        )
        is True
    )


def test_required_addressable_areas_legacy_trash_and_slots() -> None:
    """It should include slot AAs, explicit AAs, and legacy A3 trash."""
    labware = [
        LoadedLabware(
            id="trash",
            loadName="opentrons_1_trash_3200ml_fixed",
            definitionUri="opentrons/opentrons_1_trash_3200ml_fixed/1",
            location=DeckSlotLocation(slotName=DeckSlotName.SLOT_A3),
        )
    ]
    areas = required_addressable_areas(
        [
            ExtractedCommand(command_type="moveLabware", new_location_slot="A1"),
            ExtractedCommand(
                command_type="moveToAddressableArea",
                addressable_area_name="movableTrashB3",
            ),
        ],
        labware,
        "OT-3 Standard",
    )
    assert areas == ["A1", "movableTrashB3", "movableTrashA3"]
