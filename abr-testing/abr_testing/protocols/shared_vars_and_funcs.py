"""Shared Protocol Functions and Variables."""
from opentrons.protocol_api import Labware, ProtocolContext
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    MagneticBlockContext,
)
from typing import Tuple, List

colors = [
    "#008000",
    "#008000",
    "#A52A2A",
    "#A52A2A",
    "#00FFFF",
    "#0000FF",
    "#800080",
    "#ADD8E6",
    "#FF0000",
    "#FFFF00",
    "#FF00FF",
    "#00008B",
    "#7FFFD4",
    "#FFC0CB",
    "#FFA500",
    "#00FF00",
    "#C0C0C0",
]


def from_hs_to_mag(
    protocol: ProtocolContext,
    labware: Labware,
    h_s: HeaterShakerContext,
    mag_block: MagneticBlockContext,
) -> None:
    """Move Labware from heatershaker to magnetic block."""
    h_s.open_labware_latch()
    protocol.move_labware(labware, mag_block, use_gripper=True)
    h_s.close_labware_latch()


def from_mag_to_hs(
    protocol: ProtocolContext,
    labware: Labware,
    h_s_adapter: Labware,
    h_s: HeaterShakerContext,
) -> None:
    """Move labware from magnetic block to heatershaker."""
    h_s.open_labware_latch()
    protocol.move_labware(labware, h_s_adapter, use_gripper=True)
    h_s.close_labware_latch()


def h_s_speed_and_delay(
    protocol: ProtocolContext,
    h_s: HeaterShakerContext,
    h_s_speed: int,
    time: float,
    deactivate: bool,
) -> None:
    """Set Shake Speed and wait specified time."""
    h_s.set_and_wait_for_shake_speed(h_s_speed)
    comment = f"Shake at {h_s_speed} for {time} minutes."
    protocol.delay(minutes=time, msg=comment)
    if deactivate:
        h_s.deactivate_shaker()


def load_labware_in_deck_slot(
    protocol: ProtocolContext, labware_dict: dict
) -> List[Labware]:
    """Load dictionary fo labware."""
    loaded_labware = [
        protocol.load_labware(lw_info["type"], slot, lw_info["description"])
        for slot, lw_info in labware_dict.items()
    ]
    return loaded_labware
