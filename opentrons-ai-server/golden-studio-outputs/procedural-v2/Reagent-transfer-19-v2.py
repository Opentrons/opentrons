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
    source_rack = protocol.load_labware(
        'opentrons_24_tuberack_nest_1.5ml_snapcap', 'D3'
    )
    dest_plate = protocol.load_labware(
        'opentrons_96_wellplate_200ul_pcr_full_skirt', 'B3'
    )
    tiprack = protocol.load_labware(
        'opentrons_flex_96_filtertiprack_50ul', 'D2'
    )

    # Pipette
    p50 = protocol.load_instrument(
        'flex_1channel_50', 'right', tip_racks=[tiprack]
    )

    # Trash
    trash = protocol.load_trash_bin('A3')

    # Define liquid
    reagent_liquid = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred from source tube',
        display_color='#33FF33'
    )

    # Assign liquid to source well (first tube, A1) before pipetting
    source_well = source_rack.wells_by_name()['A1']
    source_well.load_liquid(liquid=reagent_liquid, volume=1500)

    # Destination wells start empty of this liquid; no load_liquid needed
    # since they are destinations, not pre-loaded sources.
    destination_wells = dest_plate.wells()

    # Transfer 1 uL of reagent from the first tube to each well in the
    # destination plate, using the same tip for all transfers.
    p50.transfer(
        1,
        source_well,
        destination_wells,
        new_tip='once'
    )
