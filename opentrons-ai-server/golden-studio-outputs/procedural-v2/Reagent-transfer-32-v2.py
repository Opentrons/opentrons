from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-32-v2',
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
    source_1_slots = ['D1', 'D2', 'D3']
    dest_slots = ['C1', 'C2', 'C3']
    tiprack_200_slots = ['B1', 'B2', 'B3']

    source_1_plates = [
        protocol.load_labware('corning_96_wellplate_360ul_flat', slot)
        for slot in source_1_slots
    ]
    source_2 = protocol.load_labware('nest_1_reservoir_195ml', 'A1')
    dest_plates = [
        protocol.load_labware('corning_96_wellplate_360ul_flat', slot)
        for slot in dest_slots
    ]
    tipracks_200 = [
        protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', slot)
        for slot in tiprack_200_slots
    ]
    tiprack_50 = protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', 'A2')

    # Trash bin (Flex, apiLevel >= 2.16)
    trash = protocol.load_trash_bin('A3')

    # Pipettes
    p50 = protocol.load_instrument('flex_1channel_50', 'right', tip_racks=[tiprack_50])
    p1000 = protocol.load_instrument('flex_1channel_1000', 'left', tip_racks=tipracks_200)

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent dispensed into every destination well',
        display_color='#00AAFF',
    )
    sample = protocol.define_liquid(
        name='Sample',
        description='Sample in source labware 1 wells',
        display_color='#FF5533',
    )

    # Load liquids before any pipetting (volumes are labels only)
    source_2.load_liquid(wells=[source_2['A1']], volume=20 * 288 + 5000, liquid=reagent)
    for plate in source_1_plates:
        plate.load_liquid(wells=plate.wells(), volume=200, liquid=sample)

    # Wells
    reagent_source = source_2['A1']
    all_dest_wells = [well for plate in dest_plates for well in plate.wells()]
    all_source_1_wells = [well for plate in source_1_plates for well in plate.wells()]

    # Step N: 20 uL reagent to all destination wells, same tip
    p50.transfer(20, reagent_source, all_dest_wells, new_tip='once')

    # Step O: well to well 100 uL, new tip for each transfer
    p1000.transfer(100, all_source_1_wells, all_dest_wells, new_tip='always')
