# Pulled from: https://github.com/Opentrons/opentrons/pull/14253


requirements = {"robotType": "OT-2", "apiLevel": "2.16"}


def run(protocol):
    tip_rack = protocol.load_labware("opentrons_96_tiprack_300ul", location="9")
    well_plate = protocol.load_labware("opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap", location="10")

    pipette = protocol.load_instrument("p300_single_gen2", mount="left", tip_racks=[tip_rack])

    pipette.pick_up_tip()
    pipette.distribute(
        volume=[22.7, 22.7],
        source=well_plate["A1"],
        dest=[well_plate["B1"], well_plate["B2"]],
        air_gap=10,
        new_tip="never",
        disposal_volume=0,
    )
    pipette.drop_tip()
