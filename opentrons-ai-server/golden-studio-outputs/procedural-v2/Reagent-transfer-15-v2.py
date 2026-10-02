from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-15-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28'
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source = protocol.load_labware('opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat', 1)
    destination = protocol.load_labware('opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat', 5)
    tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', 4)

    # Pipette
    p300m = protocol.load_instrument('p300_multi_gen2', mount='left', tip_racks=[tiprack])

    # Liquid definition
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred from source to destination',
        display_color='#00FFFF'
    )

    # Source columns and destination columns (0-indexed)
    src_col_indices = [3, 2, 5, 0, 10]   # columns 4, 3, 6, 1, 11
    dest_col_indices = [4, 8, 0, 9, 1]   # columns 5, 9, 1, 10, 2

    src_columns = [source.columns()[i] for i in src_col_indices]
    dest_columns = [destination.columns()[i] for i in dest_col_indices]

    # Load liquid into every source well that will be used
    for col in src_columns:
        for well in col:
            well.load_liquid(liquid=reagent, volume=200)

    # Volume setup
    transfer_vol = 88

    # Commands
    p300m.transfer(transfer_vol, src_columns, dest_columns, new_tip='always')
