from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-10-v2',
    'author': 'Bob',
    'description': 'Transfer',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28'
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_1 = protocol.load_labware('nest_1_reservoir_195ml', 7)
    destination_1 = protocol.load_labware('corning_96_wellplate_360ul_flat', 1)
    destination_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 2)
    tiprack300 = protocol.load_labware('opentrons_96_tiprack_300ul', 10)

    # Pipette
    p300m = protocol.load_instrument('p300_multi_gen2', mount='left', tip_racks=[tiprack300])

    # Volumes setup
    transfer_vol_1 = 50
    transfer_vol_2 = 100

    # Wells setup
    source_wells_1 = source_1.columns()[0]
    destination_wells_1 = destination_1.columns()
    destination_wells_2 = destination_2.columns()

    # Define liquids
    reagent_liquid = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred to destination plates',
        display_color='#33FF33'
    )

    # Load liquid into source well (reservoir max volume is 195 mL; loading 150 mL to cover both transfers)
    source_1.wells_by_name()['A1'].load_liquid(liquid=reagent_liquid, volume=150000)

    # Commands
    p300m.transfer(transfer_vol_1, source_wells_1, destination_wells_1, new_tip='once')
    p300m.transfer(transfer_vol_2, source_wells_1, destination_wells_2, new_tip='once')
