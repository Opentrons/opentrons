from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-21-v2',
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
    source = protocol.load_labware('agilent_1_reservoir_290ml', 'D1')
    adapter = protocol.load_adapter('opentrons_96_flat_bottom_adapter', 'C2')
    destination = adapter.load_labware('nest_96_wellplate_200ul_flat')
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', 'C1')

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Pipette
    p50m = protocol.load_instrument('flex_8channel_50', 'right', tip_racks=[tiprack])

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred to the destination plate',
        display_color='#0074D9',
    )
    source['A1'].load_liquid(liquid=reagent, volume=20000)

    # Transfer 4 uL from source column 1 to destination columns 4, 8, 1, 9, 2 with one tip
    dest_cols = [destination.columns_by_name()[idx] for idx in ['4', '8', '1', '9', '2']]
    p50m.transfer(4, source['A1'], dest_cols, new_tip='once')
