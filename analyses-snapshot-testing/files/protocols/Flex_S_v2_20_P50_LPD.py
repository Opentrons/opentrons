import random
from typing import Set
from opentrons import protocol_api

# metadata
metadata = {
    "protocolName": "Wet test for LPD",
    "author": "Josh McVey",
    "description": "http://sandbox.docs.opentrons.com/edge/v2/pipettes/loading.html#liquid-presence-detection",
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

    load_liquid_in_all_wells(wet_sample, waterButMoreBlue)

    # instruments
    p50 = protocol.load_instrument("flex_1channel_50", mount="right", tip_racks=[tiprack2], liquid_presence_detection=True)
    volume = 50

    pipette = p50

    # Wet A1 to sample plate A1
    # should be successful
    well = "A1"
    pipette.pick_up_tip()
    pipette.aspirate(volume, wet_sample.well(well))
    pipette.dispense(volume, sample_plate.well(well))
    pipette.drop_tip()

    # reuse a tip with liquid_presence_detection=True
    # we do NOT get an error if we reuse a tip
    # but it is not recommended
    well = "A2"
    pipette.pick_up_tip()
    pipette.aspirate(volume, wet_sample.well(well))
    pipette.dispense(volume, sample_plate.well(well))

    well = "A3"
    pipette.aspirate(volume, wet_sample.well(well))
    pipette.dispense(volume, sample_plate.well(well))
    pipette.drop_tip()

    # disable liquid presence detection on the pipette
    pipette.liquid_presence_detection = False
    # dry aspirate to prove it is off
    protocol.comment(f"Reservoir in {reservoir.parent} is to have NO liquid")
    pipette.pick_up_tip()
    # dry aspirate to prove it is off
    pipette.aspirate(volume, reservoir["A1"])
    pipette.blow_out(trashbin)  # make sure tip is empty then use for next step
    protocol.comment(f"Current volume in pipette: {pipette.current_volume}")  # prints 0
    # detect liquid presence
    # we expect this to move the pipette to well A1 of the reservoir
    # and then return False during the run
    # but will always return true in the simulation (analysis)
    # ❗❗❗❗❗❗
    # currently the next line is throwing an error:
    # Error 4000 GENERAL_ERROR (ProtocolCommandFailedError): TipNotEmptyError:
    # This operation requires a tip with no liquid in it.
    # https://opentrons.atlassian.net/browse/RQA-3171
    pipette.prepare_to_aspirate()  # This removes the error
    is_liquid_in_reservoir = pipette.detect_liquid_presence(reservoir["A1"])
    protocol.comment(f"Is there liquid in the reservoir? {is_liquid_in_reservoir}")
    if not protocol.is_simulating():
        if is_liquid_in_reservoir:
            protocol.comment("🐛🐛🐛🐛🐛 False + for liquid")
    pipette.drop_tip()
    # ❗❗❗❗❗❗

    # now we turn back on liquid presence detection
    # with the property
    pipette.liquid_presence_detection = True
    pipette.pick_up_tip()
    # the next line should throw an error and pause the protocol
    # resolve and continue
    protocol.comment(f"We expect an error on the next line")
    pipette.aspirate(volume, reservoir["A1"])

    if pipette.has_tip:
        pipette.drop_tip()

    # pipette.liquid_presence_detection = True
    # and we try to use
    # pipette.detect_liquid_presence
    # no error is thrown regardless of the presence of liquid

    pipette.pick_up_tip()
    protocol.comment(f"Reservoir in {reservoir.parent} is to have NO liquid")
    pipette.detect_liquid_presence(reservoir["A1"])
    is_liquid_in_reservoir = pipette.detect_liquid_presence(reservoir["A1"])
    protocol.comment(f"Is there liquid in the reservoir? {is_liquid_in_reservoir}")
    if not protocol.is_simulating():
        if is_liquid_in_reservoir:
            protocol.comment("🐛🐛🐛🐛🐛 False + for liquid")
