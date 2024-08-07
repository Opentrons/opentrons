from opentrons.protocol_api import PARTIAL_COLUMN

metadata = {
    "protocolName": "96Channel PARTIAL_COLUMN Happy Path",
    "description": "96 channel pipette and a PARTIAL_COLUMN partial tip configuration.",
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
        location="D2",
    )

    pipette = protocol.load_instrument(instrument_name="flex_96channel_1000")

    # Which nozzle to use on the pipette
    # Think of the nozzles from above like you are looking down on a 96-well plate
    # Picking up partial columns with the backmost nozzles is currently not supported. Setting
    # ``style=PARTIAL_COLUMN`` and either ``start="A1"`` or ``start="A12"`` will raise an error.
    # H1 means pipette overhang NE
    # H12 means pipette overhang NW
    pipette.configure_nozzle_layout(
        style=PARTIAL_COLUMN,
        start="H1",
        end="D1",  # pick up the first 5
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

    # consolidate does not work with the PARTIAL_COLUMN configuration
    # consolidate only has a single well as a destination

    # transfer the row
    pipette.transfer(volume, source_labware["D1"], destination_labware["D1"])

    # distribute does not work with the PARTIAL_COLUMN configuration
    # distribute only has a single well as a source

    pipette.pick_up_tip()
    pipette.touch_tip(source_labware["D2"])
    pipette.drop_tip()
    pipette.pick_up_tip()
    pipette.home()
    pipette.drop_tip()

    pipette.pick_up_tip()
    well = source_labware["D3"]
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
        style=PARTIAL_COLUMN,
        start="H1",  # Which nozzle to start with
        end="G1",  # 2 - the remaining 2 in the column
        tip_racks=[partial_tip_rack],
    )

    #############################
    # Pipette do work

    # consolidate does not work with the PARTIAL_COLUMN configuration
    # consolidate only has a single well as a destination

    # transfer the row
    pipette.transfer(volume, source_labware["B5"], destination_labware["B5"])

    # distribute does not work with the PARTIAL_COLUMN configuration
    # distribute only has a single well as a source

    pipette.pick_up_tip()
    pipette.touch_tip(source_labware["B6"])
    pipette.drop_tip()
    pipette.pick_up_tip()
    pipette.home()
    pipette.drop_tip()

    pipette.pick_up_tip()
    well = source_labware["B7"]
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
