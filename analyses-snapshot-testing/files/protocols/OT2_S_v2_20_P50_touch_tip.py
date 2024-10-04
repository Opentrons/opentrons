import random
from typing import Set
from opentrons import protocol_api

# metadata
metadata = {
    "protocolName": "touch_tip directly on OT2",
    "author": "Josh McVey",
    "description": "touch tip on OT2",
}

requirements = {
    "robotType": "OT-2",
    "apiLevel": "2.20",
}


def load_liquid_in_all_wells(labware, liquid) -> None:
    for well in labware.wells():
        well.load_liquid(liquid=liquid, volume=well.max_volume)


def run(protocol: protocol_api.ProtocolContext):

    # labware
    tiprack2 = protocol.load_labware("opentrons_96_tiprack_20ul", "5")
    wet_sample = protocol.load_labware("nest_12_reservoir_15ml", "2")

    # liquids
    waterButMoreBlue = protocol.define_liquid(
        name="H20",
        description="Test this wet!!!",
        display_color="#0077b6",
    )

    wet_sample.well("A1").load_liquid(liquid=waterButMoreBlue, volume=200)
    wet_sample.well("A2").load_liquid(liquid=waterButMoreBlue, volume=200)
    wet_sample.well("A3").load_liquid(liquid=waterButMoreBlue, volume=200)

    # instruments
    p20 = protocol.load_instrument("p20_single_gen2", mount="right", tip_racks=[tiprack2])

    pipette = p20

    pipette.pick_up_tip()
    protocol.comment("touch_tip")
    pipette.touch_tip(wet_sample.well("A1"))
    protocol.comment("air_gap")
    pipette.air_gap(volume=10)
    protocol.comment("blow_out with no arguments")
    pipette.blow_out()
    pipette.drop_tip()
