from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-25-v2',
    'author': 'OpentronsAI',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_rack = protocol.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 'C1')
    dest_plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 'B1')
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'B2')

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Pipette
    pipette = protocol.load_instrument('flex_1channel_1000', 'right', tip_racks=[tiprack])

    # Liquids
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='Sample liquid in source tubes',
        display_color='#FF6F00',
    )
    source_rack.load_liquid(
        wells=source_rack.wells(),
        volume=1000,
        liquid=sample_liquid,
    )

    # Transfer 185 uL from each tube to the destination wells, new tip for each transfer
    pipette.transfer(
        185,
        source_rack.wells(),
        dest_plate.wells(),
        new_tip='always',
    )
