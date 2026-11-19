from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-10-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source = protocol.load_labware('nest_1_reservoir_195ml', 7)
    dest_1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 1)
    dest_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 2)
    tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', 10)

    # Pipette
    p300m = protocol.load_instrument('p300_multi_gen2', 'left', tip_racks=[tiprack])

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be distributed to both destination plates',
        display_color='#0077FF',
    )
    # 12 columns x 8 channels x (50 + 100) uL = 14,400 uL needed in total; label 20 mL
    source['A1'].load_liquid(liquid=reagent, volume=20000)

    # Well setup (multi-channel -> columns)
    source_col = source.columns()[0]
    dest_1_cols = dest_1.columns()
    dest_2_cols = dest_2.columns()

    # Step 1: 50 uL to all columns of destination 1, same tips throughout
    p300m.transfer(50, source_col, dest_1_cols, new_tip='once')

    # Step 2: 100 uL to all columns of destination 2, same tips throughout
    p300m.transfer(100, source_col, dest_2_cols, new_tip='once')
