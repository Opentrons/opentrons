from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-14-v2',
    'author': 'Bob',
    'description': 'Transfer',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source = protocol.load_labware('agilent_1_reservoir_290ml', 1)
    tiprack = protocol.load_labware('opentrons_96_tiprack_20ul', 4)

    # Adapter, then plate on the adapter (combination definition is deprecated at apiLevel >= 2.15)
    adapter = protocol.load_adapter('opentrons_96_flat_bottom_adapter', 5)
    dest_plate = adapter.load_labware('nest_96_wellplate_200ul_flat')

    # Pipette
    p20_multi = protocol.load_instrument('p20_multi_gen2', 'right', tip_racks=[tiprack])

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred to the destination plate',
        display_color='#33AAFF',
    )
    source['A1'].load_liquid(liquid=reagent, volume=20000)

    # Parameters
    transfer_volume = 4  # uL
    dest_column_numbers = ['5', '9', '1', '10', '2']

    # Wells
    source_column = source.columns()[0]
    dest_columns = [dest_plate.columns_by_name()[c] for c in dest_column_numbers]

    # Transfer 4 uL from source column 1 to destination columns 5, 9, 1, 10, 2 (new tips each transfer)
    p20_multi.transfer(
        transfer_volume,
        source_column,
        dest_columns,
        new_tip='always',
    )
