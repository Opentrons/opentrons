from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-22-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28'
}

def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source = protocol.load_labware(
        'opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat',
        'D1'
    )
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', 'C1')

    # Pipette
    p50m = protocol.load_instrument('flex_8channel_50', mount='left', tip_racks=[tiprack])

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Define liquid
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred between columns',
        display_color='#00FFFF'
    )

    # Source columns (0-indexed: column 3->2, 2->1, 5->4, 1->0, 10->9)
    src_col_indices = [3, 2, 5, 1, 10]
    dest_col_indices = [4, 8, 1, 9, 2]

    # Assign liquid to every well that will be used as a source before pipetting
    for idx in src_col_indices:
        for well in source.columns()[idx - 1]:
            well.load_liquid(liquid=reagent, volume=100)

    # Parameters
    transfer_vol = 14.0
    src_cols = [source.columns_by_name()[str(idx)] for idx in src_col_indices]
    dest_cols = [source.columns_by_name()[str(idx)] for idx in dest_col_indices]

    # Command: transfer 14.0 uL, new tip for each transfer
    p50m.transfer(transfer_vol, src_cols, dest_cols, new_tip='always')
