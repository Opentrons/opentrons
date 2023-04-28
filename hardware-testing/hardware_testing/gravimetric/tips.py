"""Multi-Channel Tips."""
from typing import List, Dict

from opentrons.protocol_api import ProtocolContext, Well, Labware, InstrumentContext

# Rows by Channel:
#  - Rear Racks
#     - 8
#     - 7
#     - empty
#     - 6
#     - empty
#     - empty
#     - 5
#     - empty
#  - Front Racks
#     - empty
#     - 4
#     - empty
#     - empty
#     - 3
#     - empty
#     - 2
#     - 1
#
# Increment
#  - 72x total transfers
#      - 24x volumes
#      - 3x trials
#
# QC
#  - 36x total transfers
#      - 3x volumes
#      - 12x trials

CHANNEL_TEST_ORDER = [0, 1, 2, 3, 7, 6, 5, 4]  # zero indexed
CHANNEL_TO_TIP_ROW_LOOKUP = {  # zero indexed
    0: "H",
    1: "G",
    2: "E",
    3: "B",
    4: "G",
    5: "D",
    6: "B",
    7: "A",
}
CHANNEL_TO_SLOT_ROW_LOOKUP = {  # zero indexed
    0: "A",
    1: "A",
    2: "A",
    3: "A",
    4: "B",
    5: "B",
    6: "B",
    7: "B",
}


def _get_racks(ctx: ProtocolContext) -> Dict[int, Labware]:
    return {
        slot: labware
        for slot, labware in ctx.loaded_labwares.items()
        if labware.is_tiprack
    }


def get_tips_for_single(ctx: ProtocolContext) -> List[Well]:
    racks = _get_racks(ctx)
    return [tip for rack in racks.values() for tip in rack.wells()]


def get_tips_for_individual_channel_on_multi(
    ctx: ProtocolContext, channel: int
) -> List[Well]:
    racks = _get_racks(ctx)
    slot_row = CHANNEL_TO_SLOT_ROW_LOOKUP[channel]
    tip_row = CHANNEL_TO_TIP_ROW_LOOKUP[channel]
    # FIXME: need custom deck to support 3x racks horizontally
    slots = [5, 6] if slot_row == "A" else [8, 9]
    tips = [
        tip
        for slot in slots
        for tip in racks[slot].wells()
        if tip.well_name[0] == tip_row
    ]
    return tips


def get_tips(
    ctx: ProtocolContext, pipette: InstrumentContext, channel: int
) -> List[Well]:
    if pipette.channels == 1:
        assert channel == 0
        return get_tips_for_single(ctx)
    else:
        assert 0 <= channel < pipette.channels
        return get_tips_for_individual_channel_on_multi(ctx, channel)
