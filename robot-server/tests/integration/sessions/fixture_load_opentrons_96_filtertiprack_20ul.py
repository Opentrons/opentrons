requirements = {"apiLevel": "2.0"}


def run(protocol):
    tip_rack = protocol.load_labware("opentrons_96_filtertiprack_20ul", 1)
    pipette = protocol.load_instrument("p20_single_gen2", mount="right")
    pipette.pick_up_tip(tip_rack.wells()[0])
    pipette.drop_tip(tip_rack.wells()[0])
