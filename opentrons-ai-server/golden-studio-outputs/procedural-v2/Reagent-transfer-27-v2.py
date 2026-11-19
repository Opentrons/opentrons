from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-27-v2',
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
    source = protocol.load_labware('thermoscientificnunc_96_wellplate_2000ul', 'B1')
    destination = protocol.load_labware('opentrons_24_aluminumblock_nest_0.5ml_screwcap', 'D3')
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_200ul', 'C1')

    # Trash bin (required on Flex for apiLevel >= 2.16)
    trash = protocol.load_trash_bin('A3')

    # Pipette
    pipette = protocol.load_instrument('flex_1channel_1000', 'left', tip_racks=[tiprack])

    # Parameters
    transfer_vol = 195.0
    source_well_names = ['H10', 'F12', 'D7', 'B1', 'C8']

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred to the destination well',
        display_color='#0074D9',
    )

    source_wells = [source.wells_by_name()[name] for name in source_well_names]
    dest_well = destination.wells_by_name()['A1']

    # Load liquid labels before any pipetting step
    for well in source_wells:
        well.load_liquid(liquid=reagent, volume=transfer_vol)
    # Destination label (volume 0, since it starts empty)
    dest_well.load_liquid(liquid=reagent, volume=0)

    # Transfer with a new tip for each transfer
    pipette.transfer(transfer_vol, source_wells, dest_well, new_tip='always')
