from opentrons.protocol_api import PARTIAL_COLUMN

metadata = {
    "protocolName": "p20_multi_gen2 PARTIAL_COLUMN Overhang",
    "description": "A protocol that demonstrates overhang into a slot with a partial column configuration.",
    "author": "Josh McVey",
}

requirements = {
    "robotType": "OT-2",
    "apiLevel": "2.20",
}


def comment_tip_rack_status(ctx, tip_rack):
    """
    Print out the tip status for each row in a tip rack.
    Each row (A-H) will print the well statuses for columns 1-12 in a single comment,
    with a '🟢' for present tips and a '❌' for missing tips.
    """
    range_A_to_H = [chr(i) for i in range(ord("A"), ord("H") + 1)]
    range_1_to_12 = range(1, 13)

    ctx.comment(f"Tip rack in {tip_rack.parent}")

    for row in range_A_to_H:
        status_line = f"{row}: "
        for col in range_1_to_12:
            well = f"{row}{col}"
            has_tip = tip_rack.wells_by_name()[well].has_tip
            status_emoji = "🟢" if has_tip else "❌"
            status_line += f"{well} {status_emoji}  "

        # Print the full status line for the row
        ctx.comment(status_line)


def run(protocol):

    partial_tip_rack = protocol.load_labware(
        load_name="opentrons_96_tiprack_20ul",
        label="Partial Tip Rack",
        location="10",
    )

    pipette = protocol.load_instrument(instrument_name="p20_multi_gen2", mount="left")

    pipette.configure_nozzle_layout(
        style=PARTIAL_COLUMN,
        start="H1",
        end="D1",  # 5 Tips
        tip_racks=[partial_tip_rack],
    )

    source_labware_5 = protocol.load_labware(
        load_name="nest_1_reservoir_290ml",
        label="Source Reservoir",
        location="5",
    )

    destination_labware_2 = protocol.load_labware(
        load_name="nest_96_wellplate_100ul_pcr_full_skirt",
        label="PCR Plate",
        location="2",
    )

    # Known issue in 8.0.0
    # if you target A1 of the labware in 2
    # nozzle H1 - the front-most nozzle will go to A1
    # this means that tips will be out of the slot
    # they will over hang into the 5 slot
    # no error is raised
    # the overhanging tips will collide with the labware in slot 5

    # If we ever do detect and error for this
    # Take all these examples into a negative Overrides test

    volume = 5
    pipette.pick_up_tip()
    comment_tip_rack_status(protocol, partial_tip_rack)
    # why with P20 do I get:
    # MOTION_PLANNING_FAILURE (PartialTipMovementNotAllowedError): Moving to PCR Plate in slot 2
    # with H1 nozzle partial configuration will result in collision with items in deck slot 5.
    # because the P20 would actually collide with the labware in slot 5
    # https://opentrons.atlassian.net/browse/RQA-3198
    # bad - 4 tips will overhang into slot 5
    # pipette.aspirate(volume=volume, location=destination_labware_2["A1"])
    # bad - 3 tips will overhang into slot 5
    # pipette.aspirate(volume=volume, location=destination_labware_2["B1"])
    # bad - 2 tips will overhang into slot 5
    # pipette.aspirate(volume=volume, location=destination_labware_2["C1"])
    # bad - 1 tip will overhang into slot 5
    # pipette.aspirate(volume=volume, location=destination_labware_2["D1"])
    # pipette.aspirate(volume=volume, location=destination_labware_2["E1"])
    # pipette.aspirate(volume=volume, location=destination_labware_2["F1"])
    # pipette.aspirate(volume=volume, location=destination_labware_2["G1"])
    # H is the only safe row
    pipette.aspirate(volume=volume, location=destination_labware_2["H1"])


# ignore the below for the time being
"""
    # this is safe - from a reservoir
    # must aspirate before dispense
    pipette.aspirate(volume=volume, location=source_labware_5["A1"])
    # bad - bad - 4 tips will overhang into B2
    pipette.dispense(volume=volume, location=destination_labware_2["A1"])
    # this is safe - from a reservoir
    # must aspirate before dispense
    pipette.aspirate(volume=volume, location=source_labware_5["A1"])
    # bad - bad - 3 tips will overhang into B2
    pipette.dispense(volume=volume, location=destination_labware_2["B2"])
    # this is safe - from a reservoir
    # must aspirate before dispense
    pipette.aspirate(volume=volume, location=source_labware_5["A1"])
    # bad - bad - 2 tips will overhang into B2
    pipette.dispense(volume=volume, location=destination_labware_2["C3"])
    # this is safe - from a reservoir
    # must aspirate before dispense
    pipette.aspirate(volume=volume, location=source_labware_5["A1"])
    # bad - bad - 1 tip will overhang into B2
    pipette.dispense(volume=volume, location=destination_labware_2["D4"])
    # this is safe - from a reservoir
    # must aspirate before dispense
    pipette.aspirate(volume=volume, location=source_labware_5["A1"])
    # this is safe - 0 tips will overhang into B2
    pipette.dispense(volume=volume, location=destination_labware_2["E5"])
    # bad - has overhang into B2 - 4 tips
    pipette.touch_tip(location=destination_labware_2["A1"])
    # bad - has overhang into B2 - 4 tips
    pipette.blow_out(location=destination_labware_2["A1"])
    # bad - has overhang into B2 - 4 tips
    pipette.mix(repetitions=3, volume=volume, location=destination_labware_2["A2"])
    # bad - aspirate and dispense have overhang into B2
    pipette.drop_tip()
    pipette.transfer(volume=volume, source=destination_labware_2["A1"], dest=destination_labware_2["A2"])
    # bad - aspirate has 3 tip overhang but not dispense
    pipette.transfer(volume=volume, source=destination_labware_2["B1"], dest=destination_labware_2["E1"])
    # bad - aspirate is safe but dispense has 2 tip overhang
    pipette.transfer(volume=volume, source=destination_labware_2["E1"], dest=destination_labware_2["C3"])
    # bad - source and destinations have overhang
    pipette.distribute(volume=20, source=destination_labware_2["D2"], dest=[destination_labware_2["D3"], destination_labware_2["D4"]])
    # bad - source has overhang but destinations are safe
    pipette.distribute(volume=20, source=destination_labware_2["D2"], dest=[destination_labware_2["E3"], destination_labware_2["E4"]])
    # bad - source has no overhang but 1 destination does
    pipette.distribute(volume=20, source=destination_labware_2["E6"], dest=[destination_labware_2["A7"], destination_labware_2["E7"]])
    # bad - source has no overhang but 2 destinations do
    pipette.distribute(volume=20, source=destination_labware_2["E7"], dest=[destination_labware_2["A8"], destination_labware_2["A9"]])
    # bad - all sources and destination have overhang
    pipette.consolidate(volume=volume, source=[destination_labware_2["A9"], destination_labware_2["A10"]], dest=destination_labware_2["A11"])
    # bad - 1 source has overhang but destination is safe
    pipette.consolidate(volume=volume, source=[destination_labware_2["A9"], destination_labware_2["E10"]], dest=destination_labware_2["E11"])
    # bad - sources are safe but destination has overhang
    pipette.consolidate(volume=volume, source=[destination_labware_2["E9"], destination_labware_2["E10"]], dest=destination_labware_2["A12"])
"""
