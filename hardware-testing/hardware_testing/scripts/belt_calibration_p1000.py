from opentrons.protocol_api import ProtocolContext
​
metadata = {"protocolName": "belt-calibration-p1000"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}
​
​
def run(ctx: ProtocolContext) -> None:
    tipracks = [
        ctx.load_labware(f"opentrons_ot3_96_tiprack_1000uL", "D1"),
        ctx.load_labware(f"opentrons_ot3_96_tiprack_1000uL", "D3"),
        ctx.load_labware(f"opentrons_ot3_96_tiprack_1000uL", "A1"),
        ctx.load_labware(f"opentrons_ot3_96_tiprack_1000uL", "B3"),
    ]
    pipette = ctx.load_instrument("p1000_single_gen3", "left")
    for rack in tipracks:
        pipette.pick_up_tip(rack["A1"])
        pipette.drop_tip(home_after=False)
