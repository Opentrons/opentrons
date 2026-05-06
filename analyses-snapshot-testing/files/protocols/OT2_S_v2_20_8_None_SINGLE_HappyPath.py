from opentrons.protocol_api import SINGLE

metadata = {
    "protocolName": "OT2 8 Channel SINGLE Happy Path A1 and H1",
    "description": "OT2 8 Channel pipette and a SINGLE partial tip configuration.",
}

requirements = {
    "robotType": "OT-2",
    "apiLevel": "2.20",
}


def run(protocol):

    # trash = protocol.load_trash_bin("A3")  # must load trash bin

    partial_tip_rack = protocol.load_labware(
        load_name="opentrons_96_tiprack_300ul",
        label="Partial Tip Rack",
        location="8",
    )

    pipette = protocol.load_instrument(instrument_name="p300_multi_gen2", mount="left")
    # mount on the right and you will get an error.

    # On the 8-channel SINGLE
    # start="A1" Means the North nozzle will pickup from the SW corner of the tip rack
    # start="H1" Means the South nozzle will pickup from the NW corner of the tip rack
    pipette.configure_nozzle_layout(
        style=SINGLE,
        start="A1",  # Which nozzle
        tip_racks=[partial_tip_rack],
    )

    source_labware_2 = protocol.load_labware(
        load_name="nest_96_wellplate_100ul_pcr_full_skirt",
        label="2 Source Labware",
        location="2",
    )

    destination_labware_3 = protocol.load_labware(
        load_name="nest_96_wellplate_100ul_pcr_full_skirt",
        label="3 Destination Labware",
        location="3",
    )

    volume = 10  # Default volume for actions that require it

    #############################
    # Pipette do work
    pipette.consolidate(
        [volume, volume],
        [source_labware_2["A3"], source_labware_2["A4"]],
        destination_labware_3["A3"],
    )

    pipette.transfer(volume, source_labware_2["A6"], destination_labware_3["A6"])

    pipette.distribute(
        5,
        source_labware_2["A7"],
        [destination_labware_3["A7"], destination_labware_3["A8"]],
    )

    pipette.pick_up_tip()
    pipette.touch_tip(source_labware_2["B1"])
    pipette.drop_tip()
    pipette.pick_up_tip()
    pipette.home()
    pipette.drop_tip()

    pipette.pick_up_tip()
    well = source_labware_2["D1"]
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

    ############################
    # Change the pipette configuration

    pipette.configure_nozzle_layout(
        style=SINGLE,
        start="H1",  # Which nozzle
        tip_racks=[partial_tip_rack],
    )

    source_labware_4 = protocol.load_labware(
        load_name="nest_96_wellplate_100ul_pcr_full_skirt",
        label="4 Source Labware",
        location="4",
    )

    #############################
    # Pipette do work
    pipette.consolidate(
        [volume, volume],
        [source_labware_4["A3"], source_labware_4["A4"]],
        destination_labware_3["A3"],
    )

    pipette.transfer(volume, source_labware_4["A6"], source_labware_4["A6"])

    pipette.distribute(
        5,
        source_labware_4["A7"],
        [destination_labware_3["A7"], destination_labware_3["A8"]],
    )

    pipette.pick_up_tip()
    pipette.touch_tip(destination_labware_3["B1"])
    pipette.drop_tip()
    pipette.pick_up_tip()
    pipette.home()
    pipette.drop_tip()

    pipette.pick_up_tip()
    well = destination_labware_3["D1"]
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
