"""Validation file for addressable area reference checking functions."""

import itertools
from typing import Union, cast

from opentrons.types import DeckSlotName, StagingSlotName


def is_waste_chute(addressable_area_name: str) -> bool:
    """Check if an addressable area is a Waste Chute."""
    return addressable_area_name in {
        "1ChannelWasteChute",
        "8ChannelWasteChute",
        "96ChannelWasteChute",
        "gripperWasteChute",
    }


def is_gripper_waste_chute(addressable_area_name: str) -> bool:
    """Check if an addressable area is a gripper-movement-compatible Waste Chute."""
    return addressable_area_name == "gripperWasteChute"


def is_drop_tip_waste_chute(addressable_area_name: str) -> bool:
    """Check if an addressable area is a Waste Chute compatible for dropping tips."""
    return addressable_area_name in {
        "1ChannelWasteChute",
        "8ChannelWasteChute",
        "96ChannelWasteChute",
    }


def is_trash(addressable_area_name: str) -> bool:
    """Check if an addressable area is a trash bin."""
    return any(
        [
            s in addressable_area_name
            for s in {"movableTrash", "fixedTrash", "shortFixedTrash"}
        ]
    )


def is_staging_slot(addressable_area_name: str) -> bool:
    """Check if an addressable area is a staging area slot."""
    return addressable_area_name in {"A4", "B4", "C4", "D4"}


def is_deck_slot(addressable_area_name: str) -> bool:
    """Check if an addressable area is a deck slot (including staging area slots)."""
    if is_staging_slot(addressable_area_name):
        return True
    try:
        DeckSlotName.from_primitive(addressable_area_name)
    except ValueError:
        return False
    return True


def is_abs_reader(addressable_area_name: str) -> bool:
    """Check if an addressable area is an absorbance plate reader area."""
    return "absorbanceReaderV1" in addressable_area_name


def is_stacker_shuttle(addressable_area_name: str) -> bool:
    """Check if an addressable area is a flex stacker shuttle area."""
    return addressable_area_name in [
        "flexStackerModuleV1A4",
        "flexStackerModuleV1B4",
        "flexStackerModuleV1C4",
        "flexStackerModuleV1D4",
    ]


def is_vac_dock(addressable_area_name: str) -> bool:
    """Check if an addressable area is an vacuum module dock area."""
    return "vacuumModuleV1Dock" in addressable_area_name


def get_slot_name_from_addressable_area(
    addressable_area_name: str,
) -> Union[DeckSlotName, StagingSlotName]:
    """Convert an addressable area name to a DeckSlotName or StagingSlotName.

    Tries the full name first (for plain "A3", "D4", etc.), then falls back to the
    last two characters upper-cased for special areas provided by modules/fixtures
    (e.g. "vacuumModuleV1DockA4" -> "A4", "vacuumModuleV1A3" -> "A3",
    "flexStackerModuleV1A4" -> "A4").
    """
    # NOTE(ba, 2026-05-1): Some labware like the vacuum module collar
    # are loaded onto custom addressable areas like `vacuumModuleV1DockV4`.
    # Currently this does not map well to our convention of everything is
    # either a DeckSlotName or StagingSlotName. So we need to take the
    # last 2 characters to convert properly, we should find a better way
    # of doing this like working with addressableAreaLocation directly.
    names = (addressable_area_name, addressable_area_name[-2:].upper())
    for name, slot_type in itertools.product(names, (DeckSlotName, StagingSlotName)):
        try:
            return cast(Union[DeckSlotName, StagingSlotName], slot_type).from_primitive(
                name
            )
        except ValueError:
            continue

    raise ValueError(
        f"Cannot convert area name '{addressable_area_name}' to DeckSlotName or StagingSlotName."
    )
