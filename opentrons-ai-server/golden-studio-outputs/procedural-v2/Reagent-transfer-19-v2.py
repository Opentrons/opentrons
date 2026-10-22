from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-19-v2',
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
    source_rack = protocol.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 'D3')
    dest_plate = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'B3')
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', 'D2')

    # Trash bin (Flex, apiLevel >= 2.16)
    trash = protocol.load_trash_bin('A3')

    # Pipette
    pipette = protocol.load_instrument('flex_1channel_50', 'right', tip_racks=[tiprack])

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent in source tube A1',
        display_color='#0000FF',
    )

    # Load liquid labels before any pipetting uses these wells
    source_well = source_rack['A1']
    source_well.load_liquid(liquid=reagent, volume=1000)

    dest_wells = dest_plate.wells()

    # Transfer 1 uL of reagent from tube A1 to every well of the plate, one tip
    pipette.transfer(1, source_well, dest_wells, new_tip='once')
