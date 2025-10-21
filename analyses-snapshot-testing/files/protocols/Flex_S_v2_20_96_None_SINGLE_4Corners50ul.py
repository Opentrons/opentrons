from opentrons.protocol_api import SINGLE

metadata = {
    "protocolName": "96Channel SINGLE Pickup on all 4 corners 2 pickups",
    "description": "96 2 tips picked up on all 4 corners of the tip rack",
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

    four_corners = ["A1", "A12", "H1", "H12"]

    partial_tip_rack = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_50ul",
        label="Partial Tip Rack",
        location="C2",
    )

    pipette = protocol.load_instrument(instrument_name="flex_96channel_1000")

    for corner in four_corners:

        pipette.configure_nozzle_layout(
            style=SINGLE,
            start=corner,
            tip_racks=[partial_tip_rack],
        )

        pipette.pick_up_tip()
        comment_tip_rack_status(protocol, partial_tip_rack)
        protocol.pause("How was the pickup of first tip?")
        pipette.drop_tip()
        pipette.pick_up_tip()
        comment_tip_rack_status(protocol, partial_tip_rack)
        protocol.pause("How was the pickup of second tip?")
        pipette.drop_tip()
