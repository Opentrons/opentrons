from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-1-v2',
    'author': 'Bob',
    'description': 'Transfer',
}

requirements = {"robotType": "OT-2", "apiLevel": "2.28"}


def run(protocol: protocol_api.ProtocolContext):
    # labware
    source = protocol.load_labware('thermoscientificnunc_96_wellplate_1300ul', 9)
    destination = protocol.load_labware('opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat', 10)

    tiprack_1 = protocol.load_labware('opentrons_96_filtertiprack_1000ul', 8)
    tiprack_2 = protocol.load_labware('opentrons_96_tiprack_1000ul', 3)

    # pipettes
    p1000_left = protocol.load_instrument('p1000_single_gen2', 'left', tip_racks=[tiprack_1])
    p1000_right = protocol.load_instrument('p1000_single_gen2', 'right', tip_racks=[tiprack_2])

    # liquids
    reagent_1 = protocol.define_liquid(
        name='Reagent 1',
        description='Reagent transferred by left-mounted pipette',
        display_color='#FF0000'
    )
    reagent_2 = protocol.define_liquid(
        name='Reagent 2',
        description='Liquid transferred by right-mounted pipette',
        display_color='#0000FF'
    )

    # well setup
    source_wells_1 = [source.wells_by_name()[well] for well in ['A7', 'A6', 'A5', 'A2', 'A3']]
    destination_wells_1 = [destination.wells_by_name()[well] for well in ['A5', 'A9', 'A1', 'A10', 'A2']]

    source_wells_2 = [source.wells_by_name()[well] for well in ['A9', 'A12', 'A6', 'A10', 'A3']]
    destination_wells_2 = [destination.wells_by_name()[well] for well in ['A7', 'A11', 'A6', 'A3', 'A9']]

    # load liquids into source wells before pipetting
    for well in source_wells_1:
        well.load_liquid(liquid=reagent_1, volume=196)
    for well in source_wells_2:
        well.load_liquid(liquid=reagent_2, volume=8)

    # volumes
    transfer_vol_1 = 196
    transfer_vol_2 = 8

    # commands
    # M: left-mounted pipette, new tip each transfer
    p1000_left.transfer(transfer_vol_1, source_wells_1, destination_wells_1, new_tip='always')

    # N: right-mounted pipette, same tip for all transfers
    p1000_right.transfer(transfer_vol_2, source_wells_2, destination_wells_2, new_tip='once')
