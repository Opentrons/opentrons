from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-14-v2',
    'author': 'Bob',
    'description': 'Transfer',
}

requirements = {"robotType": "OT-2", "apiLevel": "2.28"}


def run(protocol: protocol_api.ProtocolContext):
    # labware
    source = protocol.load_labware('agilent_1_reservoir_290ml', 1)
    destination = protocol.load_labware(
        'opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat', 5
    )
    tiprack = protocol.load_labware('opentrons_96_tiprack_20ul', 4)

    # pipette
    p20m = protocol.load_instrument('p20_multi_gen2', mount='right', tip_racks=[tiprack])

    # parameters
    transfer_vol = 4
    src_col = source.columns_by_name()['1']
    dest_cols = [destination.columns_by_name()[idx] for idx in ['5', '9', '1', '10', '2']]

    # define and load liquid
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred to destination plate',
        display_color='#00FFFF'
    )

    for well in src_col:
        well.load_liquid(liquid=reagent, volume=0.8 * well.max_volume)

    # commands
    p20m.transfer(transfer_vol, src_col, dest_cols, new_tip='always')
