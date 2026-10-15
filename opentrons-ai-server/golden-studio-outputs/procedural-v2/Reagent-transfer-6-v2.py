from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-6-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Adapter, then labware on the adapter (slot 1)
    adapter = protocol.load_adapter('opentrons_96_flat_bottom_adapter', 1)
    plate = adapter.load_labware('nest_96_wellplate_200ul_flat')

    # Tip rack (slot 4)
    tiprack = protocol.load_labware('opentrons_96_tiprack_20ul', 4)

    # Pipette
    p20_multi = protocol.load_instrument('p20_multi_gen2', 'left', tip_racks=[tiprack])

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred between plate columns',
        display_color='#0077FF',
    )

    # Source columns (1-based names): 4, 3, 6, 1, 11
    src_names = ['4', '3', '6', '1', '11']
    # Destination columns (1-based names): 5, 9, 1, 10, 2
    dest_names = ['5', '9', '1', '10', '2']

    columns = plate.columns_by_name()

    # Label reagent in every source well before it is used
    for name in src_names:
        for well in columns[name]:
            well.load_liquid(liquid=reagent, volume=100)

    src_cols = [columns[n] for n in src_names]
    dest_cols = [columns[n] for n in dest_names]

    # Transfer 14 uL, new tip each time
    p20_multi.transfer(14.0, src_cols, dest_cols, new_tip='always')
