from typing import Any, Optional, Dict, List

from opentrons.protocol_api import ProtocolContext, Labware

metadata = {"protocolName": "stack-guides-march-2024-v1"}
requirements = {"robotType": "Flex", "apiLevel": "2.16"}


"""
Setup:
 - 2x tip-racks in slots C2 and C3
 - 1x tip-rack stacking guides in staging slot C4

Run:
 - For each tip-rack:
   - Move tip-rack from deck-slot into guide
     - Second rack gets stacked onto first
     - PAUSE, wait for tester to press continue
 - For each tip-rack:
   - Move from guide into deck-slot
     - PAUSE, wait for tester to press continue
"""

TIPS_DEFINITION = "opentrons_flex_96_tiprack_1000ul"
TIPS_DECK_SLOTS = ["C2", "C3"]
GUIDES_SLOT = "C4"

START_UNSTACKED = True


def _move_labware_with_offset_and_pause(
    protocol: ProtocolContext,
    labware: Labware,
    destination: Any,
    pick_up_offset: Optional[Dict[str, float]] = None,
    drop_offset: Optional[Dict[str, float]] = None,
) -> None:
    protocol.move_labware(
        labware,
        destination,
        use_gripper=True,
        pick_up_offset=pick_up_offset,
        drop_offset=drop_offset,
    )
    protocol.pause(
        f'Pick(x={round(pick_up_offset["x"], 1)},'
        f'y={round(pick_up_offset["y"], 1)},'
        f'z={round(pick_up_offset["z"], 1)}) | '
        f'Drop(x={round(drop_offset["x"], 1)},'
        f'y={round(drop_offset["y"], 1)},'
        f'z={round(drop_offset["z"], 1)})'
    )


def run(protocol: ProtocolContext):
    # SETUP
    if START_UNSTACKED:
        tip_racks: List[Labware] = [
            protocol.load_labware(TIPS_DEFINITION, slot) for slot in TIPS_DECK_SLOTS
        ]
    else:
        lower_rack = protocol.load_labware(TIPS_DEFINITION, GUIDES_SLOT)
        tip_racks: List[Labware] = [
            lower_rack,
            lower_rack.load_labware(TIPS_DEFINITION),
        ]

    # RUN
    if START_UNSTACKED:
        prev_rack: Optional[Labware] = None
        for rack in tip_racks:
            _move_labware_with_offset_and_pause(
                protocol,
                rack,
                prev_rack if prev_rack else GUIDES_SLOT,
                pick_up_offset={"x": 0, "y": 0, "z": 0},  # PICK-UP from DECK
                drop_offset={"x": 0, "y": 0, "z": 0},  # DROP-OFF in GUIDES
            )
            prev_rack = rack
    # remove from stack in reverse order
    tip_racks.reverse()
    TIPS_DECK_SLOTS.reverse()
    for rack, destination in zip(tip_racks, TIPS_DECK_SLOTS):
        _move_labware_with_offset_and_pause(
            protocol,
            rack,
            destination,
            pick_up_offset={"x": 0, "y": 0, "z": 0},  # PICK-UP from GUIDES
            drop_offset={"x": 0, "y": 0, "z": 0},  # DROP-OFF in DECK
        )
