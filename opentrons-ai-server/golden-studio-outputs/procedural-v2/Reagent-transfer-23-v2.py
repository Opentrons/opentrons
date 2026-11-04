from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-23-v2',
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
    source_plate = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'C1')
    dest_plate = protocol.load_labware('nest_96_wellplate_2ml_deep', 'B3')
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_1000ul', 'D1')

    # Trash bin (required on Flex for apiLevel >= 2.16)
    trash = protocol.load_trash_bin('A3')

    # Pipette
    pipette = protocol.load_instrument('flex_8channel_1000', 'right', tip_racks=[tiprack])

    # Liquids
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='Sample liquid in the first column of the source plate',
        display_color='#FF0000',
    )

    # Load liquid into the source wells (first column) before they are used
    source_column = source_plate.columns()[0]
    source_plate.load_liquid(wells=source_column, volume=100, liquid=sample_liquid)

    # Transfer 80 uL from source column 1 to destination column 1, new tips for each transfer
    pipette.transfer(
        80,
        source_plate.columns()[0],
        dest_plate.columns()[0],
        new_tip='always',
    )
