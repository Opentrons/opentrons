from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-28-v2',
    'author': 'OpentronsAI',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'C1')
    source_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'C2')
    destination_1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D1')
    destination_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D2')
    tiprack_200 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'B2')
    tiprack_50 = protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', 'A2')

    # Trash bin (required on Flex for apiLevel >= 2.16)
    trash = protocol.load_trash_bin('A3')

    # Pipettes
    p1000 = protocol.load_instrument('flex_1channel_1000', 'left', tip_racks=[tiprack_200])
    p50 = protocol.load_instrument('flex_1channel_50', 'right', tip_racks=[tiprack_50])

    # Liquids
    reagent_a = protocol.define_liquid(
        name='Reagent A',
        description='Reagent in source labware 1 (wells A1, A2)',
        display_color='#FF0000',
    )
    reagent_b = protocol.define_liquid(
        name='Reagent B',
        description='Reagent in source labware 2 (wells C4, C6)',
        display_color='#0000FF',
    )

    # Load liquids into every source well before any pipetting step
    for well_name in ['A1', 'A2']:
        source_1[well_name].load_liquid(liquid=reagent_a, volume=200)
    for well_name in ['C4', 'C6']:
        source_2[well_name].load_liquid(liquid=reagent_b, volume=200)

    # Well setup
    # Step O: source 1 (A1, A2) -> source 2 (B6, B7)
    step_o_src = [source_1[w] for w in ['A1', 'A2']]
    step_o_dest = [source_2[w] for w in ['B6', 'B7']]
    # Step P: source 2 (C4, C6) -> source 1 (A3, A4)
    step_p_src = [source_2[w] for w in ['C4', 'C6']]
    step_p_dest = [source_1[w] for w in ['A3', 'A4']]
    # Step Q: source 2 (B6, B7) -> destination 1 (A1, B1)
    step_q_src = [source_2[w] for w in ['B6', 'B7']]
    step_q_dest = [destination_1[w] for w in ['A1', 'B1']]
    # Step R: source 2 (C4, C6) -> destination 2 (A1, B1)
    step_r_src = [source_2[w] for w in ['C4', 'C6']]
    step_r_dest = [destination_2[w] for w in ['A1', 'B1']]

    # Step O: 50 uL, same tip
    p1000.transfer(50, step_o_src, step_o_dest, new_tip='once')

    # Step P: 15 uL, same tip
    p50.transfer(15, step_p_src, step_p_dest, new_tip='once')

    # Step Q: 10 uL, new tip for each transfer
    p50.transfer(10, step_q_src, step_q_dest, new_tip='always')

    # Step R: 10 uL, new tip for each transfer
    p50.transfer(10, step_r_src, step_r_dest, new_tip='always')
