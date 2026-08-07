"""OT-2 thermocycler + magnetic module protocol for js-package-testing.

Paired with ot2Analysis.json for troubleshooting. Mirrors the historical
ot2TC Protocol Designer export (TC Gen1, Mag Gen2, p300 single, Axygen plate).

Note: this Flex monorepo rejects OT-2 analysis. Keep ot2Analysis.json as the
checked-in snapshot; refresh it only from an OT-2-capable analyzer.
"""

from opentrons import protocol_api

metadata = {
    "protocolName": "ot2TC",
    "author": "QA team",
}

requirements = {
    "robotType": "OT-2",
    "apiLevel": "2.28",
}


def run(ctx: protocol_api.ProtocolContext) -> None:
    tip_rack = ctx.load_labware("opentrons_96_tiprack_300ul", 2)
    plate = ctx.load_labware("axygen_96_wellplate_500ul", 9)

    thermocycler = ctx.load_module("thermocycler module", 7)
    magnetic_module = ctx.load_module("magnetic module gen2", 1)

    pipette = ctx.load_instrument("p300_single", "left", tip_racks=[tip_rack])

    ctx.pause("Confirm deck setup before continuing.")
    thermocycler.open_lid()

    pipette.pick_up_tip()
    pipette.aspirate(10, plate["A1"].bottom(1))
    pipette.dispense(10, plate["H12"].bottom(1))
    pipette.drop_tip()

    magnetic_module.engage(height_from_base=0)
