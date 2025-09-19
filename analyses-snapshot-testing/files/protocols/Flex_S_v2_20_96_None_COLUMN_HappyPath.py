from opentrons.protocol_api import COLUMN

metadata = {
    "protocolName": "96Channel COLUMN Happy Path",
    "description": "96 channel pipette and a COLUMN partial tip configuration.",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}


def run(protocol):

    trash = protocol.load_trash_bin("A3")  # must load trash bin

    partial_tip_rack = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul",
        label="Partial Tip Rack",
        location="B2",
    )

    pipette = protocol.load_instrument(instrument_name="flex_96channel_1000")

    # Which nozzle to use on the pipette
    # Think of the nozzles from above like you are looking down on a 96-well plate
    # start="A1" Means the West most nozzle column will pickup from the East most column of the tip rack
    # start="A12" Means the East most nozzle column will pickup from the West most column of the tip rack
    pipette.configure_nozzle_layout(
        style=COLUMN,
        start="A1",
        tip_racks=[partial_tip_rack],
    )

    source_labware = protocol.load_labware(
        load_name="nest_96_wellplate_100ul_pcr_full_skirt",
        label="Liquid Transfer - Source Labware",
        location="C2",
    )

    destination_labware = protocol.load_labware(
        load_name="nest_96_wellplate_100ul_pcr_full_skirt",
        label="Liquid Transfer - Destination Labware",
        location="C3",
    )

    volume = 10  # Default volume for actions that require it

    #############################
    # Pipette do work

    # consolidate does not work with the COLUMN configuration
    # consolidate only has a single well as a destination

    # transfer the row
    pipette.transfer(volume, source_labware["A1"], destination_labware["A1"])

    # distribute does not work with the COLUMN configuration
    # distribute only has a single well as a source

    pipette.pick_up_tip()
    pipette.touch_tip(source_labware["A2"])
    pipette.drop_tip()
    pipette.pick_up_tip()
    pipette.home()
    pipette.drop_tip()

    pipette.pick_up_tip()
    well = source_labware["A3"]
    # directly from docs http://sandbox.docs.opentrons.com/edge/v2/new_protocol_api.html#opentrons.protocol_api.InstrumentContext.prepare_to_aspirate
    pipette.move_to(well.bottom(z=2))
    pipette.mix(10, 10)
    pipette.move_to(well.top(z=5))
    pipette.blow_out()
    pipette.prepare_to_aspirate()
    pipette.move_to(well.bottom(z=2))
    pipette.aspirate(10, well.bottom(z=2))
    pipette.dispense(10)
    pipette.drop_tip()

    #############################
    # Change the pipette configuration

    pipette.configure_nozzle_layout(
        style=COLUMN,
        start="A12",  # Which nozzle to start with
        tip_racks=[partial_tip_rack],
    )

    #############################
    # Pipette do work

    # consolidate does not work with the COLUMN configuration
    # consolidate only has a single well as a destination

    # transfer the row
    pipette.transfer(volume, source_labware["A5"], destination_labware["A5"])

    # distribute does not work with the COLUMN configuration
    # distribute only has a single well as a source

    pipette.pick_up_tip()
    pipette.touch_tip(source_labware["A6"])
    pipette.drop_tip()
    pipette.pick_up_tip()
    pipette.home()
    pipette.drop_tip()

    pipette.pick_up_tip()
    well = source_labware["A7"]
    # directly from docs http://sandbox.docs.opentrons.com/edge/v2/new_protocol_api.html#opentrons.protocol_api.InstrumentContext.prepare_to_aspirate
    pipette.move_to(well.bottom(z=2))
    pipette.mix(10, 10)
    pipette.move_to(well.top(z=5))
    pipette.blow_out()
    pipette.prepare_to_aspirate()
    pipette.move_to(well.bottom(z=2))
    pipette.aspirate(10, well.bottom(z=2))
    pipette.dispense(10)
    pipette.drop_tip()
