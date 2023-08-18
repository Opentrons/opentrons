"""Multi-Channel Tips."""
from typing import List, Dict

from opentrons.protocol_api import ProtocolContext, Well, Labware, InstrumentContext

# Rows by Channel:
#  - Rear Racks (slot-row=C)
#     - 7
#     - 6
#     - empty
#     - 5
#     - empty
#     - empty
#     - 4
#     - empty
#  - Front Racks (slot-row=B)
#     - empty
#     - 3
#     - empty
#     - empty
#     - 2
#     - empty
#     - 1
#     - 0
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

MULTI_CHANNEL_TEST_ORDER = [0, 1, 2, 3, 7, 6, 5, 4]  # zero indexed
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
    0: "B",
    1: "B",
    2: "B",
    3: "B",
    4: "C",
    5: "C",
    6: "C",
    7: "C",
}


def _get_racks(ctx: ProtocolContext) -> Dict[int, Labware]:
    return {
        slot: labware
        for slot, labware in ctx.loaded_labwares.items()
        if labware.is_tiprack
    }


def get_tips_for_single(ctx: ProtocolContext, tip_volume: int) -> List[Well]:
    """Get tips for single channel."""
    racks = _get_racks(ctx)
    return [
        tip
        for rack in racks.values()
        for tip in rack.wells()
        if tip.max_volume == tip_volume
    ]


def get_tips_for_individual_channel_on_multi(
    ctx: ProtocolContext, channel: int
) -> List[Well]:
    """Get tips for a multi's channel."""
    racks = _get_racks(ctx)
    slot_row = CHANNEL_TO_SLOT_ROW_LOOKUP[channel]
    tip_row = CHANNEL_TO_TIP_ROW_LOOKUP[channel]
    # FIXME: need custom deck to support 3x racks horizontally
    slots = [5, 6] if slot_row == "B" else [8, 9]
    tips = [
        tip
        for slot in slots
        for tip in racks[slot].wells()
        if tip.well_name[0] == tip_row
    ]
    return tips


def get_tips_for_all_channels_on_multi(ctx: ProtocolContext) -> List[Well]:
    """Get tips for all the multi's channels."""
    racks = _get_racks(ctx)
    return [rack[f"A{col + 1}"] for _, rack in racks.items() for col in range(12)]


def get_tips_for_96_channel(ctx: ProtocolContext) -> List[Well]:
    """Get tips for all the multi's channels."""
    racks = _get_racks(ctx)
    return [rack["A1"] for _, rack in racks.items()]


def get_tips(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tip_volume: int,
    all_channels: bool = True,
) -> Dict[int, List[Well]]:
    """Get tips."""
    if pipette.channels == 1:
        return {0: get_tips_for_single(ctx, tip_volume)}
    elif pipette.channels == 8:
        if all_channels:
            return {0: get_tips_for_all_channels_on_multi(ctx)}
        else:
            return {
                channel: get_tips_for_individual_channel_on_multi(ctx, channel)
                for channel in range(pipette.channels)
            }
    elif pipette.channels == 96:
        if all_channels:
            return {0: get_tips_for_96_channel(ctx)}
        else:
            raise NotImplementedError(
                "no support for individual channel testing on the 96ch pipette"
            )
    else:
        raise ValueError(
            f"unexpected state when getting tips: "
            f"pipette.channels={pipette.channels}, "
            f"all_channels={all_channels}"
        )
