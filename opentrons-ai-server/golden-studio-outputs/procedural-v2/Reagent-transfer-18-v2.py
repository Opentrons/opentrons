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
    # Labware
    source = protocol.load_labware(
        'opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt', 'D1'
    )
    destination = protocol.load_labware(
        'opentrons_96_aluminumblock_biorad_wellplate_200ul', 'C2'
    )
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_1000ul', 'C1')

    # Pipette
    pipette = protocol.load_instrument(
        'flex_1channel_1000', 'left', tip_racks=[tiprack]
    )

    # Trash
    trash = protocol.load_trash_bin('A3')

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent transferred from source plate to destination plate',
        display_color='#33A1FF',
    )

    # Wells
    source_well = source.wells_by_name()['A1']
    destination_wells = [destination.wells_by_name()[well] for well in ['E12', 'G12', 'B9', 'A6', 'D7']]

    # Load liquid into source well before pipetting (enough volume for 5 x 117.0 uL transfers)
    source_well.load_liquid(liquid=reagent, volume=117.0 * 5)

    # Volume setup
    transfer_vol = 117.0

    # Commands
    pipette.transfer(transfer_vol, source_well, destination_wells, new_tip='always')
