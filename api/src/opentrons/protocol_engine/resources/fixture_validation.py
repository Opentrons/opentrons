"""Validation file for addressable area reference checking functions."""

from opentrons.types import DeckSlotName


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
    return addressable_area_name in {"movableTrash", "fixedTrash", "shortFixedTrash"}


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
