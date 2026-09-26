from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-24-v2',
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
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_1000ul', 'C1')
    # Assumption: "4-in-1 Tube Rack Set 15" is not a standard Opentrons load name.
    # Using the closest standard 15-tube rack as a substitute.
    source_rack = protocol.load_labware('opentrons_15_tuberack_nest_15ml_conical', 'C2')
    dest_plate = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'D1')

    # Pipette
    pipette = protocol.load_instrument('flex_1channel_1000', 'left', tip_racks=[tiprack])

    # Trash
    trash = protocol.load_trash_bin('A3')

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent transferred from source tube rack to destination plate',
        display_color='#33FF33'
    )

    source_well = source_rack.wells_by_name()['A1']
    source_well.load_liquid(liquid=reagent, volume=2000)

    dest_wells = dest_plate.wells()

    # Transfer 90 uL of reagent from first tube to each well in destination plate
    transfer_vol = 90
    pipette.transfer(transfer_vol, source_well, dest_wells, new_tip='once')
