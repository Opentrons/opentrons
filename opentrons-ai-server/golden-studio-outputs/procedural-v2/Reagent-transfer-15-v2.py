from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-15-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Adapters
    source_adapter = protocol.load_adapter('opentrons_96_flat_bottom_adapter', 1)
    dest_adapter = protocol.load_adapter('opentrons_96_flat_bottom_adapter', 5)

    # Labware
    source = source_adapter.load_labware('nest_96_wellplate_200ul_flat')
    destination = dest_adapter.load_labware('nest_96_wellplate_200ul_flat')
    tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', 4)

    # Pipette
    p300m = protocol.load_instrument('p300_multi_gen2', 'left', tip_racks=[tiprack])

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred',
        display_color='#0000FF',
    )

    # Parameters
    transfer_vol = 88
    src_col_names = ['4', '3', '6', '1', '11']
    dest_col_names = ['5', '9', '1', '10', '2']

    src_cols = [source.columns_by_name()[c] for c in src_col_names]
    dest_cols = [destination.columns_by_name()[c] for c in dest_col_names]

    # Load reagent into every source well used (before any pipetting)
    for col in src_cols:
        for well in col:
            well.load_liquid(liquid=reagent, volume=150)

    # Transfer with a new tip for each transfer
    p300m.transfer(transfer_vol, src_cols, dest_cols, new_tip='always')
