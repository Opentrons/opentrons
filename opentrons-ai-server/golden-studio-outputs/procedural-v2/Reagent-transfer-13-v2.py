from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-13-v2',
    'author': 'Bob',
    'description': 'Transfer',
}

requirements = {"robotType": "OT-2", "apiLevel": "2.28"}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 4)
    source_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 5)
    destination_1 = protocol.load_labware('nest_1_reservoir_195ml', 1)
    tiprack1 = protocol.load_labware('opentrons_96_tiprack_300ul', 8)

    # Pipette
    p300s = protocol.load_instrument('p300_single_gen2', mount='left', tip_racks=[tiprack1])

    # Liquid definitions
    liquid_1 = protocol.define_liquid(
        name='Sample Liquid 1',
        description='Liquid pooled from source labware 1',
        display_color='#FF0000'
    )
    liquid_2 = protocol.define_liquid(
        name='Sample Liquid 2',
        description='Liquid pooled from source labware 2',
        display_color='#0000FF'
    )

    # Load liquids into source wells before pipetting
    for well in source_1.wells():
        well.load_liquid(liquid=liquid_1, volume=100)

    for well in source_2.wells():
        well.load_liquid(liquid=liquid_2, volume=100)

    # Wells setup
    source_wells_1 = source_1.wells()
    source_wells_2 = source_2.wells()
    destination_well_1 = destination_1.wells_by_name()['A1']

    # Volume setup
    transfer_vol = 100

    # Commands
    # L. Pool from source labware 1 to destination, same tip throughout
    p300s.transfer(transfer_vol, source_wells_1, destination_well_1, new_tip='once')

    # M. Pool from source labware 2 to destination, same tip throughout
    p300s.transfer(transfer_vol, source_wells_2, destination_well_1, new_tip='once')
