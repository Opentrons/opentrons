metadata = {"apiLevel": "2.11"}

def run(protocol):
    tip_rack = protocol.load_labware("opentrons_96_tiprack_300ul", 1)
    pipette = protocol.load_instrument("p300_single", mount="right")
    
    for i in range(10):
        pipette.pick_up_tip(tip_rack.wells_by_name()["A1"])
        pipette.return_tip(tip_rack.wells_by_name()["A1"])
