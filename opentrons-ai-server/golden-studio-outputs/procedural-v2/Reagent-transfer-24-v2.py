from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-24-v2',
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
    source_rack = protocol.load_labware('opentrons_15_tuberack_nest_15ml_conical', 'C2')
    dest_plate = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'D1')
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_1000ul', 'C1')

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Pipette
    pipette = protocol.load_instrument('flex_1channel_1000', 'left', tip_racks=[tiprack])

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be distributed to the destination plate',
        display_color='#0077FF',
    )
    source_well = source_rack['A1']
    source_well.load_liquid(liquid=reagent, volume=9000)

    # Transfer 90 uL from first tube to every well of the plate, same tip
    pipette.transfer(90, source_well, dest_plate.wells(), new_tip='once')
