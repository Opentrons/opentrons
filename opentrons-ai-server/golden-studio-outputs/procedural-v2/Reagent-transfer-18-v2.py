from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-18-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Adapters
    source_adapter = protocol.load_adapter('opentrons_96_pcr_adapter', 'D1')
    dest_adapter = protocol.load_adapter('opentrons_96_well_aluminum_block', 'C2')

    # Labware
    source_plate = source_adapter.load_labware('nest_96_wellplate_100ul_pcr_full_skirt')
    dest_plate = dest_adapter.load_labware('biorad_96_wellplate_200ul_pcr')
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_1000ul', 'C1')

    # Pipette
    pipette = protocol.load_instrument('flex_1channel_1000', 'left', tip_racks=[tiprack])

    # Trash
    trash = protocol.load_trash_bin('A3')

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred to destination wells',
        display_color='#3366FF',
    )
    source_well = source_plate['A1']
    source_well.load_liquid(liquid=reagent, volume=100)

    # Transfer parameters
    transfer_vol = 117.0
    dest_wells = [dest_plate[w] for w in ['E12', 'G12', 'B9', 'A6', 'D7']]

    # Command K: 117 uL from first source well to each destination well, new tip each time
    pipette.transfer(transfer_vol, source_well, dest_wells, new_tip='always')
