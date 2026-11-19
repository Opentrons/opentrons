from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-20-v2',
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
    source_1 = protocol.load_labware('nest_1_reservoir_195ml', 'B1')
    source_2 = protocol.load_labware('biorad_384_wellplate_50ul', 'B2')
    source_3 = protocol.load_labware('biorad_96_wellplate_200ul_pcr', 'B3')
    dest_1 = protocol.load_labware('corning_384_wellplate_112ul_flat', 'D1')
    dest_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D2')

    tiprack_200 = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'A1')
    tiprack_50 = protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', 'A2')

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Pipettes
    p1000 = protocol.load_instrument('flex_1channel_1000', 'right', tip_racks=[tiprack_200])
    p50 = protocol.load_instrument('flex_1channel_50', 'left', tip_racks=[tiprack_50])

    # Liquids
    reagent_a = protocol.define_liquid(
        name='Reagent A',
        description='Reagent in source reservoir (slot B1)',
        display_color='#00AAFF',
    )
    reagent_b = protocol.define_liquid(
        name='Reagent B',
        description='Liquid in 384-well source plate (slot B2)',
        display_color='#FF8800',
    )
    reagent_c = protocol.define_liquid(
        name='Reagent C',
        description='Liquid in 96-well PCR source plate (slot B3)',
        display_color='#33CC33',
    )

    # Load liquids (volumes in uL)
    # Reservoir: 15 uL x (384 + 96) wells = 7200 uL needed; load 10000 uL
    source_1.load_liquid(wells=['A1'], liquid=reagent_a, volume=10000)
    # 384-well plate: 20 uL per well needed; wells hold max 50 uL
    source_2.load_liquid(wells=source_2.wells(), liquid=reagent_b, volume=40)
    # 96-well PCR plate: 100 uL per well needed
    source_3.load_liquid(wells=source_3.wells(), liquid=reagent_c, volume=150)

    # Step P: 15 uL from reservoir A1 to every well in destination 1 and 2, same tip
    p50.transfer(
        15,
        source_1['A1'],
        dest_1.wells() + dest_2.wells(),
        new_tip='once',
    )

    # Step Q: 20 uL from each well in source 2 to each well in destination 1, same tip
    p50.transfer(
        20,
        source_2.wells(),
        dest_1.wells(),
        new_tip='once',
    )

    # Step R: 100 uL from each well in source 3 to each well in destination 2, new tip each time
    p1000.transfer(
        100,
        source_3.wells(),
        dest_2.wells(),
        new_tip='always',
    )
