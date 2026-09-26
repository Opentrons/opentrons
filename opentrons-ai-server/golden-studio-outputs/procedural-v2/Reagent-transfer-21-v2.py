from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-21-v2',
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
    source = protocol.load_labware('agilent_1_reservoir_290ml', 'D1')
    destination = protocol.load_labware(
        'opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat', 'C2'
    )
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', 'C1')

    # Pipette
    p50m = protocol.load_instrument('flex_8channel_50', mount='right', tip_racks=[tiprack])

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Define liquid
    reagent_liquid = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred to destination plate',
        display_color='#33A5FF'
    )

    # Load liquid into source well (first column of reservoir, well A1)
    source_well = source.wells_by_name()['A1']
    source_well.load_liquid(liquid=reagent_liquid, volume=290000)

    # Parameters
    transfer_vol = 4
    src_col = source.columns_by_name()['1']
    dest_cols = [destination.columns_by_name()[idx] for idx in ['4', '8', '1', '9', '2']]

    # Command: transfer reagent, same tip for all transfers
    p50m.transfer(transfer_vol, src_col, dest_cols, new_tip='once')
