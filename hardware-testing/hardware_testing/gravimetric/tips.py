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


def _get_racks(ctx: ProtocolContext) -> Dict[int, Labware]:
    return {
        slot: labware
        for slot, labware in ctx.loaded_labwares.items()
        if labware.is_tiprack
    }


def get_unused_tips(ctx: ProtocolContext, tip_volume: int) -> List[Well]:
    """Use the labware's tip tracker to get a list of all unused tips for a given tip volume."""
    racks = [
        r for r in _get_racks(ctx).values() if r.wells()[0].max_volume == tip_volume
    ]
    wells: List[Well] = []
    rows = "ABCDEFGH"
    for rack in racks:
        for col in range(1, 13):
            for row in rows:
                wellname = f"{row}{col}"
                next_well = rack.next_tip(1, rack[wellname])
                if next_well is not None and wellname == next_well.well_name:
                    wells.append(rack[wellname])
    return wells


def get_tips_for_single(ctx: ProtocolContext, tip_volume: int) -> List[Well]:
    """Get tips for single channel."""
    return get_unused_tips(ctx, tip_volume)


def get_tips_for_individual_channel_on_multi(
    ctx: ProtocolContext, channel: int, tip_volume: int, pipette_volume: int
) -> List[Well]:
    """Get tips for a multi's channel."""
    unused_tips = get_unused_tips(ctx, tip_volume)
    tip_row = CHANNEL_TO_TIP_ROW_LOOKUP[channel]
    tips = [tip for tip in unused_tips if tip.well_name[0] == tip_row]
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
                channel: get_tips_for_individual_channel_on_multi(
                    ctx, channel, tip_volume, int(pipette.max_volume)
                )
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
