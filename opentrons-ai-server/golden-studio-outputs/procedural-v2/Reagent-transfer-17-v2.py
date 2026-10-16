from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-17-v2',
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
    source = protocol.load_labware('thermoscientificnunc_96_wellplate_1300ul', 'B3')
    dest_adapter = protocol.load_adapter('opentrons_96_flat_bottom_adapter', 'A1')
    destination = dest_adapter.load_labware('nest_96_wellplate_200ul_flat')
    tiprack_left = protocol.load_labware('opentrons_flex_96_filtertiprack_1000ul', 'B2')
    tiprack_right = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'D3')

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Pipettes
    left_pipette = protocol.load_instrument('flex_1channel_1000', 'left', tip_racks=[tiprack_left])
    right_pipette = protocol.load_instrument('flex_1channel_1000', 'right', tip_racks=[tiprack_right])

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent transferred by the left pipette',
        display_color='#0000FF',
    )
    liquid = protocol.define_liquid(
        name='Liquid',
        description='Liquid transferred by the right pipette',
        display_color='#00AA00',
    )

    # Command M wells
    left_src_names = ['A7', 'A6', 'A5', 'A2', 'A3']
    left_dest_names = ['A5', 'A9', 'A1', 'A10', 'A2']
    # Command N wells
    right_src_names = ['A9', 'A12', 'A6', 'A10', 'A3']
    right_dest_names = ['A7', 'A11', 'A6', 'A3', 'A9']

    # Load liquids into source wells (A6 and A3 are shared by both commands)
    shared = set(left_src_names) & set(right_src_names)
    for name in left_src_names:
        vol = 196.0 + (8 if name in shared else 0) + 100
        source[name].load_liquid(liquid=reagent, volume=vol)
    for name in right_src_names:
        if name not in shared:
            source[name].load_liquid(liquid=liquid, volume=8 + 100)

    # Command M: new tip for each transfer
    left_src = [source[n] for n in left_src_names]
    left_dest = [destination[n] for n in left_dest_names]
    left_pipette.transfer(196.0, left_src, left_dest, new_tip='always')

    # Command N: same tip for all transfers
    right_src = [source[n] for n in right_src_names]
    right_dest = [destination[n] for n in right_dest_names]
    right_pipette.transfer(8, right_src, right_dest, new_tip='once')
