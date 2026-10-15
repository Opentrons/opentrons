from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-5-v2',
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
    # (loaded onto the deck first, then the plate goes on top of the adapter)
    dest_adapter = protocol.load_adapter('opentrons_96_flat_bottom_adapter', 5)

    # Labware
    source = protocol.load_labware('agilent_1_reservoir_290ml', 1)
    dest_plate = dest_adapter.load_labware('nest_96_wellplate_200ul_flat')
    tiprack = protocol.load_labware('opentrons_96_tiprack_20ul', 4)

    # Pipette
    p20_multi = protocol.load_instrument('p20_multi_gen2', 'right', tip_racks=[tiprack])

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred to the destination plate',
        display_color='#33AAFF',
    )

    # Source reservoir holds the reagent (single well, A1)
    source['A1'].load_liquid(liquid=reagent, volume=100000)

    # Parameters
    transfer_vol = 4  # uL
    src_col = source.columns_by_name()['1']
    dest_col_names = ['5', '9', '1', '10', '2']
    dest_cols = [dest_plate.columns_by_name()[c] for c in dest_col_names]

    # Transfer 4 uL from first column of source to the destination columns, same tip
    p20_multi.transfer(transfer_vol, src_col, dest_cols, new_tip='once')
