from opentrons.protocol_api import SINGLE

metadata = {
    "protocolName": "96Channel SINGLE Happy Path H1 or H12",
    "description": "Tip Rack North Clearance for the 96 channel pipette and a SINGLE partial tip configuration.",
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
    # start="A1" Means the NW nozzle will pickup from the SE corner of the tip rack
    # start="A12" Means the SW nozzle will pickup from the NE corner of the tip rack
    # start="H1" Means the NE nozzle will pickup from the SW corner of the tip rack
    # start="H12" Means the SE nozzle will pickup from the NW corner of the tip rack
    pipette.configure_nozzle_layout(
        style=SINGLE,
        start="H1",  # Which nozzle to start with
        tip_racks=[partial_tip_rack],
    )

    source_labware_C1 = protocol.load_labware(
        load_name="nest_96_wellplate_100ul_pcr_full_skirt",
        label="Liquid Transfer - Source Labware",
        location="C1",
    )

    destination_labware_C2 = protocol.load_labware(
        load_name="nest_96_wellplate_100ul_pcr_full_skirt",
        label="Liquid Transfer - Destination Labware",
        location="C2",
    )

    volume = 10  # Default volume for actions that require it

    #############################
    # Pipette do work
    pipette.consolidate(
        [volume, volume],
        [source_labware_C1["A3"], source_labware_C1["A4"]],
        destination_labware_C2["A3"],
    )

    pipette.transfer(volume, source_labware_C1["A6"], source_labware_C1["A6"])

    pipette.distribute(
        5,
        source_labware_C1["A7"],
        [destination_labware_C2["A7"], destination_labware_C2["A8"]],
    )

    pipette.pick_up_tip()
    pipette.touch_tip(source_labware_C1["B1"])
    pipette.drop_tip()
    pipette.pick_up_tip()
    pipette.home()
    pipette.drop_tip()

    pipette.pick_up_tip()
    well = source_labware_C1["D1"]
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
        style=SINGLE,
        start="H12",  # Which nozzle to start with
        tip_racks=[partial_tip_rack],
    )

    source_labware_C3 = protocol.load_labware(
        load_name="nest_96_wellplate_100ul_pcr_full_skirt",
        label="C3 Source Labware",
        location="C3",
    )

    destination_labware_B2 = protocol.load_labware(
        load_name="nest_96_wellplate_100ul_pcr_full_skirt",
        label="B2 Destination Labware",
        location="B2",
    )

    #############################
    # Pipette do work
    pipette.consolidate(
        [volume, volume],
        [source_labware_C3["A3"], source_labware_C3["A4"]],
        destination_labware_B2["A3"],
    )

    pipette.transfer(volume, source_labware_C3["A6"], destination_labware_B2["A6"])

    pipette.distribute(
        5,
        source_labware_C3["A7"],
        [destination_labware_B2["A7"], destination_labware_B2["A8"]],
    )

    pipette.pick_up_tip()
    pipette.touch_tip(source_labware_C3["B1"])
    pipette.drop_tip()
    pipette.pick_up_tip()
    pipette.home()
    pipette.drop_tip()

    pipette.pick_up_tip()
    well = source_labware_C3["D1"]
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
