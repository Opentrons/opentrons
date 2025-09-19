from opentrons.protocol_api import PARTIAL_COLUMN, ALL

metadata = {
    "protocolName": "p20_multi_gen2 Simple",
    "description": "A protocol that demonstrates safe actions with p20_multi_gen2",
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

    tip_rack = protocol.load_labware(
        load_name="opentrons_96_tiprack_300ul",
        label="Partial Tip Rack",
        location="10",
    )

    pipette = protocol.load_instrument(instrument_name="p300_multi_gen2", mount="left", tip_racks=[tip_rack])

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

    volume = 40
    pipette.pick_up_tip()
    comment_tip_rack_status(protocol, tip_rack)
    pipette.aspirate(volume=volume, location=destination_labware_2["H1"])
    pipette.dispense(volume=volume, location=destination_labware_2["H2"])
    for i in range(1, 13):
        protocol.comment(f"Touching tip to {destination_labware_2[f'H{i}']}")
        pipette.touch_tip(location=destination_labware_2[f"H{i}"])

    pipette.blow_out(location=destination_labware_2["H1"])
    pipette.mix(repetitions=3, volume=volume, location=destination_labware_2["H1"])
    pipette.drop_tip()

    range_A_to_H = [chr(i) for i in range(ord("A"), ord("H") + 1)]
    column1 = [destination_labware_2[f"{row}1"] for row in range_A_to_H]
    column2 = [destination_labware_2[f"{row}2"] for row in range_A_to_H]
    protocol.comment(f"Transferring {volume}uL from column 1 to column 2")
    pipette.transfer(volume=volume, source=column1, dest=column2)
    comment_tip_rack_status(protocol, tip_rack)

    # Note that you cannot target Hn like you could on a partial tip
    # when I try to use the well destination of Hn for
    # transfer, distribute, or consolidate, I get an error like
    # Invalid source for multichannel transfer: [H3 of PCR Plate on slot 2]
    # pipette.transfer(volume=volume, source=destination_labware_2["H3"], dest=destination_labware_2["H4"])
    # comment_tip_rack_status(protocol, tip_rack)

    # but this works and I am inferring
    # when using 8 channel pipette and you are specifying a column, use An
    pipette.transfer(volume=volume, source=destination_labware_2["A3"], dest=destination_labware_2["A4"])
    comment_tip_rack_status(protocol, tip_rack)
    pipette.distribute(volume=volume, source=destination_labware_2["A4"], dest=[destination_labware_2["A5"], destination_labware_2["A6"]])
    comment_tip_rack_status(protocol, tip_rack)
    pipette.consolidate(volume=volume, source=[destination_labware_2["A7"], destination_labware_2["A8"]], dest=destination_labware_2["A9"])
    comment_tip_rack_status(protocol, tip_rack)
