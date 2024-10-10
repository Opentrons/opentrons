from opentrons.protocol_api import SINGLE

metadata = {
    "protocolName": "96Channel Partial Tip to single well labware",
    "description": "How does the 96 channel pipette behave with a partial tip rack and a single well labware?",
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


def aspirate_to_reservoir_test(ctx, labware):
    location = labware.wells()[0]
    ctx.comment(f"Aspirating from {labware.parent} {location}")
    ctx.aspirate(20, location)
    ctx.pause("Where did I aspirate from?")


def run(protocol):

    trash = protocol.load_trash_bin("A3")  # must load trash bin

    partial_tip_rack = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_200ul",
        label="Partial Tip Rack",
        location="B2",
    )

    # agilent_1_reservoir_290ml
    agilent_290 = protocol.load_labware(
        load_name="agilent_1_reservoir_290ml",
        label="Agilent 290mL",
        location="D1",
    )

    # axygen_1_reservoir_90ml
    axygen_90 = protocol.load_labware(
        load_name="axygen_1_reservoir_90ml",
        label="Axygen 90mL",
        location="D2",
    )

    # nest_1_reservoir_195ml
    nest_195 = protocol.load_labware(
        load_name="nest_1_reservoir_195ml",
        label="Nest 195mL",
        location="D3",
    )

    pipette = protocol.load_instrument(instrument_name="flex_96channel_1000")

    pipette.configure_nozzle_layout(
        style=SINGLE,
        start="H1",
        tip_racks=[partial_tip_rack],
    )

    pipette.pick_up_tip()
    comment_tip_rack_status(protocol, partial_tip_rack)
    aspirate_to_reservoir_test(protocol, agilent_290)

    pipette.configure_nozzle_layout(
        style=COLUMN,
        start="A1",
        tip_racks=[partial_tip_rack],
    )
