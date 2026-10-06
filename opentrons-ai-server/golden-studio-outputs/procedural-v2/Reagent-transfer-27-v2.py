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

    # Pipette
    p1000s = protocol.load_instrument('flex_1channel_1000', mount='left', tip_racks=[tiprack])

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Parameters
    transfer_vol = 195.0
    src_well_names = ['H10', 'F12', 'D7', 'B1', 'C8']
    src_wells = [source.wells_by_name()[well] for well in src_well_names]
    dest_well = destination.wells()[0]

    # Define liquid
    reagent_liquid = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred to destination labware',
        display_color='#00FFFF',
    )

    # Load liquid into every source well used
    for well in src_wells:
        well.load_liquid(liquid=reagent_liquid, volume=transfer_vol)

    # Transfer 195.0 uL of reagent from source wells to the first well in the destination labware
    # Use a new tip for each transfer
    p1000s.transfer(transfer_vol, src_wells, dest_well, new_tip='always')
