from opentrons.protocol_api import PARTIAL_COLUMN

metadata = {
    "protocolName": "flex_8channel_1000 Simple",
    "description": "A protocol that demonstrates safe actions with flex_8channel_1000",
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
    tip_rack = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul",
        label="Tip Rack",
        location="A1",
    )

    pipette = protocol.load_instrument(instrument_name="flex_8channel_1000", mount="left", tip_racks=[tip_rack])

    source_labware_C2 = protocol.load_labware(
        load_name="nest_1_reservoir_290ml",
        label="Source Reservoir",
        location="C2",
    )

    destination_labware_D2 = protocol.load_labware(
        load_name="nest_96_wellplate_100ul_pcr_full_skirt",
        label="PCR Plate",
        location="2",
    )

    volume = 100
    pipette.pick_up_tip()
    comment_tip_rack_status(protocol, tip_rack)
    pipette.aspirate(volume=volume, location=destination_labware_D2["H1"])
    pipette.dispense(volume=volume, location=destination_labware_D2["H2"])
    for i in range(1, 13):
        protocol.comment(f"Touching tip to {destination_labware_D2[f'H{i}']}")
        pipette.touch_tip(location=destination_labware_D2[f"H{i}"])

    pipette.blow_out(location=destination_labware_D2["H1"])
    pipette.mix(repetitions=3, volume=volume, location=destination_labware_D2["H1"])
    pipette.drop_tip()

    range_A_to_H = [chr(i) for i in range(ord("A"), ord("H") + 1)]
    column1 = [destination_labware_D2[f"{row}1"] for row in range_A_to_H]
    column2 = [destination_labware_D2[f"{row}2"] for row in range_A_to_H]
    column3 = [destination_labware_D2[f"{row}3"] for row in range_A_to_H]
    column4 = [destination_labware_D2[f"{row}4"] for row in range_A_to_H]
    column5 = [destination_labware_D2[f"{row}5"] for row in range_A_to_H]
    column6 = [destination_labware_D2[f"{row}6"] for row in range_A_to_H]
    column7 = [destination_labware_D2[f"{row}7"] for row in range_A_to_H]

    protocol.comment(f"Transferring {volume}uL from column 1 to column 2")
    pipette.transfer(volume=volume, source=column1, dest=column2)
    comment_tip_rack_status(protocol, tip_rack)

    volume = 50
    protocol.comment(f"Distribute {volume}uL from column 2 to column 3 and 4")
    pipette.distribute(volume=volume, source=column2, dest=column3 + column4)
    comment_tip_rack_status(protocol, tip_rack)
    protocol.comment(f"Consolidate {volume}uL from column 5 and 6 to column 7")
    pipette.consolidate(volume=volume, source=column5 + column6, dest=column7)
    comment_tip_rack_status(protocol, tip_rack)
