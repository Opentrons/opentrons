from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-5-v2',
    'author': 'Bob',
    'description': 'Transfer',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28'
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source = protocol.load_labware('agilent_1_reservoir_290ml', 1)
    destination = protocol.load_labware(
        'opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat', 5
    )
    tiprack = protocol.load_labware('opentrons_96_tiprack_20ul', 4)

    # Pipette
    p20m = protocol.load_instrument('p20_multi_gen2', mount='right', tip_racks=[tiprack])

    # Define liquid
    reagent_liquid = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred to destination plate',
        display_color='#00FFFF'
    )

    # Load liquid into source well (first column, full reservoir)
    source_well = source.wells_by_name()['A1']
    source_well.load_liquid(liquid=reagent_liquid, volume=0.8 * source_well.max_volume)

    # Load liquid into destination wells that will receive reagent (columns 5, 9, 1, 10, 2)
    transfer_vol = 4
    dest_cols = [destination.columns_by_name()[idx] for idx in ['5', '9', '1', '10', '2']]
    for col in dest_cols:
        for well in col:
            well.load_liquid(liquid=reagent_liquid, volume=0)

    # Source wells setup
    source_wells_1 = source.columns_by_name()['1']

    # Commands
    p20m.transfer(transfer_vol, source_wells_1, dest_cols, new_tip='once')
