from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-1-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {'robotType': 'OT-2', 'apiLevel': '2.28'}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source = protocol.load_labware('thermoscientificnunc_96_wellplate_1300ul', 9)
    adapter = protocol.load_adapter('opentrons_96_flat_bottom_adapter', 10)
    destination = adapter.load_labware('nest_96_wellplate_200ul_flat')
    tiprack_left = protocol.load_labware('opentrons_96_filtertiprack_1000ul', 8)
    tiprack_right = protocol.load_labware('opentrons_96_tiprack_1000ul', 3)

    # Pipettes
    left_pip = protocol.load_instrument('p1000_single_gen2', 'left', tip_racks=[tiprack_left])
    right_pip = protocol.load_instrument('p1000_single_gen2', 'right', tip_racks=[tiprack_right])

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

    # Wells used by each step
    left_src_names = ['A7', 'A6', 'A5', 'A2', 'A3']
    left_dest_names = ['A5', 'A9', 'A1', 'A10', 'A2']
    right_src_names = ['A9', 'A12', 'A6', 'A10', 'A3']
    right_dest_names = ['A7', 'A11', 'A6', 'A3', 'A9']

    # Label source liquids before any pipetting.
    # Source wells A6 and A3 are used by both steps, so they are labeled with both liquids.
    source_volumes_reagent = {'A7': 300, 'A6': 300, 'A5': 300, 'A2': 300, 'A3': 300}
    source_volumes_liquid = {'A9': 100, 'A12': 100, 'A6': 100, 'A10': 100, 'A3': 100}
    source.load_liquid_by_well(source_volumes_reagent, reagent)
    source.load_liquid_by_well(source_volumes_liquid, liquid)

    # Step M: left pipette, new tip for each transfer
    left_src = [source[w] for w in left_src_names]
    left_dest = [destination[w] for w in left_dest_names]
    left_pip.transfer(196, left_src, left_dest, new_tip='always')

    # Step N: right pipette, same tip for all transfers
    right_src = [source[w] for w in right_src_names]
    right_dest = [destination[w] for w in right_dest_names]
    right_pip.transfer(8, right_src, right_dest, new_tip='once')
