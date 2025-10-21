from opentrons.protocol_api import SINGLE, ALL

metadata = {
    "protocolName": "8channel 50 into a 48 well plate",
    "description": "the nozzles on the pipette do not match the target labware wells",
    "author": "Josh McVey",
}

requirements = {
    "robotType": "Flex",
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

    trash = protocol.load_trash_bin("A3")  # must load trash bin

    partial_tip_rack = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_50ul",
        label="Partial Tip Rack",
        location="B3",
    )

    # corning_48_wellplate_1.6ml_flat
    corning_48 = protocol.load_labware(
        load_name="corning_48_wellplate_1.6ml_flat",
        label="Corning 48 Wellplate",
        location="D2",
    )

    pipette = protocol.load_instrument(instrument_name="flex_8channel_50", mount="right")

    pipette.configure_nozzle_layout(
        style=ALL,
        start="H1",
        end="B1",  # Test that end is ignored when style is ALL and on 8.0.0-alpha.6 it is ✅
        tip_racks=[partial_tip_rack],
    )

    pipette.pick_up_tip()
    comment_tip_rack_status(protocol, partial_tip_rack)
    volume = 20

    ###### Purpose statement
    ### This protocol is made to detect if analysis output ever changes
    ### When we try and pipette to wells that do not match the geometry of the nozzles on the pipette
    ######

    # when using 8 channel location is the front-most well in the column of the target labware
    pipette.aspirate(volume=volume, location=corning_48["F1"])
    pipette.dispense(volume=volume, location=corning_48["F1"])
    pipette.touch_tip(location=corning_48["F1"])
    pipette.blow_out(location=corning_48["F1"])
    pipette.mix(repetitions=3, volume=volume, location=corning_48["F1"])
    # next line has this error: Invalid source for multichannel transfer: [F1 of Corning 48 Wellplate on slot D2]
    # pipette.transfer(volume=volume, source=corning_48["F1"], dest=corning_48["F2"])
    # next line has this error: Invalid source for multichannel transfer: [F2 of Corning 48 Wellplate on slot D2]
    # pipette.distribute(volume=20, source=corning_48["F2"], dest=[corning_48["F3"], corning_48["F4"]])
    # next line has this error:
    # Invalid source for multichannel transfer: [F6 of Corning 48 Wellplate on slot D2, F7 of Corning 48 Wellplate on slot D2]
    # pipette.consolidate(volume=20, source=[corning_48["F6"], corning_48["F7"]], dest=corning_48["F8"])

    pipette.drop_tip()  # so trash bin shows up in the deck map
