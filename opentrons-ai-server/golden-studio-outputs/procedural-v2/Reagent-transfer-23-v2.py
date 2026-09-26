from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-23-v2',
    'author': 'Bob',
    'description': 'Transfer',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28'
}

def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_plate = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'C1')
    destination_plate = protocol.load_labware('nest_96_wellplate_2ml_deep', 'B3')
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_1000ul', 'D1')

    # Pipette
    pipette = protocol.load_instrument('flex_8channel_1000', 'right', tip_racks=[tiprack])

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Define liquid
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='Sample liquid transferred from source plate to destination plate',
        display_color='#FF0000'
    )

    # Assign liquid to every well in the first column of the source plate
    source_column_1 = source_plate.columns()[0]
    for well in source_column_1:
        well.load_liquid(liquid=sample_liquid, volume=80)

    # Wells setup
    destination_column_1 = destination_plate.columns()[0]

    # Transfer 80 uL from each well in source column 1 to each well in destination column 1
    # Using a new tip for each transfer
    pipette.transfer(80, source_column_1, destination_column_1, new_tip='always')
