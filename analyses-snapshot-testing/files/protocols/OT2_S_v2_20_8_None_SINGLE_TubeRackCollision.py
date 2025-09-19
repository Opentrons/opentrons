from opentrons.protocol_api import SINGLE

metadata = {
    "protocolName": "8Channel SINGLE Pickup Tube Rack collision",
    "description": "Unsafe protocol ❗❗❗❗❗❗❗❗❗❗❗ will collide with tube.",
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
        load_name="opentrons_96_tiprack_300ul",
        label="Partial Tip Rack",
        location="3",
    )

    tube_rack = protocol.load_labware(
        load_name="opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical",
        label="Tube Rack",
        location="2",
    )

    pipette = protocol.load_instrument(instrument_name="p300_multi_gen2", mount="left")

    pipette.configure_nozzle_layout(
        style=SINGLE,
        start="H1",
        tip_racks=[partial_tip_rack],
    )

    pipette.pick_up_tip()
    comment_tip_rack_status(protocol, partial_tip_rack)
    # both commands are not physically possible but throw no error
    pipette.aspirate(30, tube_rack["A3"].bottom())
    pipette.dispense(30, tube_rack["A4"].bottom())
    pipette.drop_tip()
