from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-25-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_rack = protocol.load_labware(
        'opentrons_24_tuberack_nest_1.5ml_snapcap', 'C1'
    )
    dest_plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 'B1')
    tip_rack = protocol.load_labware(
        'opentrons_flex_96_filtertiprack_200ul', 'B2'
    )

    # Pipette
    pipette = protocol.load_instrument(
        'flex_1channel_1000', 'right', tip_racks=[tip_rack]
    )

    # Trash
    trash = protocol.load_trash_bin('A3')

    # Define liquid
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='Sample liquid aliquoted from source tube rack',
        display_color='#FF0000'
    )

    # Load liquid into every source tube before it is used as a source
    source_wells = source_rack.wells()
    for well in source_wells:
        well.load_liquid(liquid=sample_liquid, volume=1500)

    # Destination wells: all wells of the destination plate
    dest_wells = dest_plate.wells()

    # Transfer 185 uL from each tube to all wells of destination plate
    # 96 destination wells / 24 source tubes = 4, evenly divisible
    # No for loop: transfer() handles list pairing/stretching internally
    pipette.transfer(
        185,
        source_wells,
        dest_wells,
        new_tip='always'
    )
