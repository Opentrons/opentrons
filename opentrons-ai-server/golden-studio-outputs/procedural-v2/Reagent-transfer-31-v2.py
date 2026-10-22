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
    # Adapters
    source_adapter = protocol.load_adapter('opentrons_96_flat_bottom_adapter', 'D1')
    dest_adapter = protocol.load_adapter('opentrons_96_flat_bottom_adapter', 'C2')

    # Labware
    source = source_adapter.load_labware('nest_96_wellplate_200ul_flat')
    destination = dest_adapter.load_labware('nest_96_wellplate_200ul_flat')
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'C1')

    # Pipette
    p1000m = protocol.load_instrument('flex_8channel_1000', 'right', tip_racks=[tiprack])

    # Trash
    trash = protocol.load_trash_bin('A3')

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred',
        display_color='#1E90FF',
    )

    # Parameters
    transfer_vol = 88
    src_col_names = ['4', '3', '6', '1', '11']
    dest_col_names = ['5', '9', '1', '10', '2']

    src_cols = [source.columns_by_name()[c] for c in src_col_names]
    dest_cols = [destination.columns_by_name()[c] for c in dest_col_names]

    # Load reagent into every well of the source columns used
    for col in src_cols:
        for well in col:
            well.load_liquid(liquid=reagent, volume=200)

    # Transfer with a new tip for each transfer
    p1000m.transfer(transfer_vol, src_cols, dest_cols, new_tip='always')
