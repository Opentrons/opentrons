from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-31-v2',
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
    source = protocol.load_labware(
        'opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat', 'D1'
    )
    destination = protocol.load_labware(
        'opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat', 'C2'
    )
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'C1')

    # Pipette
    pipette = protocol.load_instrument(
        'flex_8channel_1000', 'right', tip_racks=[tiprack]
    )

    # Trash
    trash = protocol.load_trash_bin('A3')

    # Liquid definition
    reagent_liquid = protocol.define_liquid(
        name='Reagent',
        description='Reagent transferred between source and destination plates',
        display_color='#00FFFF',
    )

    # Well/column setup
    transfer_vol = 88
    src_col_indices = [4, 3, 6, 1, 11]  # 1-based column numbers from description
    dest_col_indices = [5, 9, 1, 10, 2]  # 1-based column numbers from description

    source_columns = [source.columns()[idx - 1] for idx in src_col_indices]
    destination_columns = [destination.columns()[idx - 1] for idx in dest_col_indices]

    # Load liquid into every source well that will be used as a transfer source
    for column in source_columns:
        for well in column:
            well.load_liquid(liquid=reagent_liquid, volume=200)

    # Transfer
    pipette.transfer(
        transfer_vol,
        source_columns,
        destination_columns,
        new_tip='always'
    )
