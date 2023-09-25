"""Gravimetric OT3 P1000."""
from opentrons.protocol_api import ProtocolContext
from opentrons.protocol_api._types import OffDeckType

metadata = {"protocolName": "gravimetric-ot3-p1000-96"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

SLOT_SCALE = 4
SLOTS_TIPRACK = {
    # TODO: add slot 12 when tipracks are disposable
    50: [2, 3, 5, 6, 7, 8, 9, 10, 11],
    # 200: [2, 3, 5, 6, 7, 8, 9, 10, 11],
    # 1000: [2, 3, 5, 6, 7, 8, 9, 10, 11],
}
LABWARE_ON_SCALE = "nest_1_reservoir_195ml"


def run(ctx: ProtocolContext) -> None:
    """Run."""
    scale_labware = ctx.load_labware(LABWARE_ON_SCALE, SLOT_SCALE)
    pipette = ctx.load_instrument("flex_96channel_1000", "left")
    for tip_size in SLOTS_TIPRACK.keys():
        tipracks = [
            ctx.load_labware(f"opentrons_flex_96_tiprack_{tip_size}uL_adp", slot)
            for slot in SLOTS_TIPRACK[tip_size]
        ]
        for rack in tipracks:
            pipette.pick_up_tip(rack["A1"])
            pipette.aspirate(10, scale_labware["A1"].top())
            pipette.dispense(10, scale_labware["A1"].top())
            pipette.drop_tip(home_after=False)
            ctx.move_labware(rack, OffDeckType.OFF_DECK)
