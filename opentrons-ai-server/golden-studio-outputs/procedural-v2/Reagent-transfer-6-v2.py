from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-6-v2',
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
    source = protocol.load_labware(
        'opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat', 1
    )
    tiprack = protocol.load_labware('opentrons_96_tiprack_20ul', 4)

    # Pipette
    p20m = protocol.load_instrument('p20_multi_gen2', mount='left', tip_racks=[tiprack])

    # Volume and column setup
    transfer_vol = 14.0
    src_cols = [source.columns_by_name()[idx] for idx in ['4', '3', '6', '1', '11']]
    dest_cols = [source.columns_by_name()[idx] for idx in ['5', '9', '1', '10', '2']]

    # Define liquid
    reagent_liquid = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred between columns',
        display_color='#33FF33'
    )

    # Load liquid into source columns (columns 4, 3, 6, 1, 11)
    for col in src_cols:
        for well in col:
            well.load_liquid(liquid=reagent_liquid, volume=200)

    # Commands
    p20m.transfer(transfer_vol, src_cols, dest_cols, new_tip='always')
