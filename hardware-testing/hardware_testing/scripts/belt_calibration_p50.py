from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "belt-calibration-p50"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

def run(ctx: ProtocolContext) -> None:
    tipracks = [
        ctx.load_labware(f"opentrons_ot3_96_tiprack_200uL", "D1"),
        ctx.load_labware(f"opentrons_ot3_96_tiprack_200uL", "D3"),
        ctx.load_labware(f"opentrons_ot3_96_tiprack_200uL", "C2"),
        ctx.load_labware(f"opentrons_ot3_96_tiprack_200uL", "A1"),
        ctx.load_labware(f"opentrons_ot3_96_tiprack_200uL", "B3"),
    ]
    pipette = ctx.load_instrument("p50_single_gen3", "left")
    for rack in tipracks:
        pipette.pick_up_tip(rack["A1"])
        pipette.drop_tip(home_after=False)
