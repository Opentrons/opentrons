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
    source = protocol.load_labware(
        'thermoscientificnunc_96_wellplate_1300ul', 'B3'
    )
    destination = protocol.load_labware(
        'opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat', 'A1'
    )

    # Tip racks
    tiprack_left = protocol.load_labware(
        'opentrons_flex_96_filtertiprack_1000ul', 'B2'
    )
    tiprack_right = protocol.load_labware(
        'opentrons_flex_96_filtertiprack_200ul', 'D3'
    )

    # Pipettes
    left_pipette = protocol.load_instrument(
        'flex_1channel_1000', 'left', tip_racks=[tiprack_left]
    )
    right_pipette = protocol.load_instrument(
        'flex_1channel_1000', 'right', tip_racks=[tiprack_right]
    )

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Well setup for command M
    source_wells_1 = [source.wells_by_name()[well] for well in ['A7', 'A6', 'A5', 'A2', 'A3']]
    destination_wells_1 = [destination.wells_by_name()[well] for well in ['A5', 'A9', 'A1', 'A10', 'A2']]

    # Well setup for command N
    source_wells_2 = [source.wells_by_name()[well] for well in ['A9', 'A12', 'A6', 'A10', 'A3']]
    destination_wells_2 = [destination.wells_by_name()[well] for well in ['A7', 'A11', 'A6', 'A3', 'A9']]

    # Define liquids
    reagent_liquid = protocol.define_liquid(
        name='Reagent',
        description='Reagent transferred with left-mounted pipette',
        display_color='#33FF33',
    )
    other_liquid = protocol.define_liquid(
        name='Liquid',
        description='Liquid transferred with right-mounted pipette',
        display_color='#FF9900',
    )

    # Load liquids into their source wells before use
    for well in source_wells_1:
        well.load_liquid(liquid=reagent_liquid, volume=196.0)
    for well in source_wells_2:
        well.load_liquid(liquid=other_liquid, volume=8)

    # Command M: transfer 196.0 uL of reagent, new tip for all transfers
    left_pipette.transfer(
        196.0,
        source_wells_1,
        destination_wells_1,
        new_tip='always'
    )

    # Command N: transfer 8 uL of liquid, same tip for all transfers
    right_pipette.transfer(
        8,
        source_wells_2,
        destination_wells_2,
        new_tip='once'
    )
