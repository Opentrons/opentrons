import random
from typing import Set
from opentrons import protocol_api

# metadata
metadata = {
    "protocolName": "Flex touch tip first",
    "author": "Josh McVey",
    "description": "touch tip first",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}


def load_liquid_in_all_wells(labware, liquid) -> None:
    for well in labware.wells():
        well.load_liquid(liquid=liquid, volume=well.max_volume)


def run(protocol: protocol_api.ProtocolContext):

    # modules/fixtures
    trashbin = protocol.load_trash_bin(location="A3")

    # labware
    tiprack1 = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "A2")
    tiprack2 = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "B2")
    sample_plate = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "C3")
    reservoir = protocol.load_labware("nest_1_reservoir_290ml", "D3")
    wet_sample = protocol.load_labware("nest_12_reservoir_15ml", "B3")

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
    p50 = protocol.load_instrument("flex_1channel_50", mount="right", tip_racks=[tiprack2], liquid_presence_detection=True)
    volume = 50

    pipette = p50
    total_volume = 30

    pipette.pick_up_tip()
    # don't do an aspirate before the touch_tip
    # pipette.aspirate(volume=total_volume, location=wet_sample.well("A1"))
    protocol.comment("touch_tip")
    # no matter if you aspirate before or not,
    # the touch_tip is not shown in the app preview run
    pipette.touch_tip(location=wet_sample.well("A1"))
    protocol.comment("air_gap")
    # if you uncomment the air_gap an error is thrown
    # I should be at the wet_sample.well("A1") but it says I am at the tiprack
    # pipette.air_gap(volume=20)
    protocol.comment("blow_out with no arguments")
    pipette.blow_out()
    pipette.drop_tip()
