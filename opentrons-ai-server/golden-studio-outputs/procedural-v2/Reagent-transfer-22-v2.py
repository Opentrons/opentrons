from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-22-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Modules
    hs_mod = protocol.load_module('heaterShakerModuleV1', 'D1')

    # Adapters
    hs_adapter = hs_mod.load_adapter('opentrons_96_flat_bottom_adapter')

    # Labware
    plate = hs_adapter.load_labware('nest_96_wellplate_200ul_flat')
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', 'C1')

    # Pipettes
    pipette = protocol.load_instrument('flex_8channel_50', 'left', tip_racks=[tiprack])

    # Trash
    trash = protocol.load_trash_bin('A3')

    # Column definitions (1-based column names)
    source_col_names = ['3', '2', '5', '1', '10']
    dest_col_names = ['4', '8', '1', '9', '2']

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent transferred between columns',
        display_color='#0000FF',
    )

    # Load reagent into every source column
    for col_name in source_col_names:
        for well in plate.columns_by_name()[col_name]:
            well.load_liquid(liquid=reagent, volume=100)

    # Heater-Shaker latch must be closed before pipetting
    hs_mod.close_labware_latch()

    # Transfers
    source_cols = [plate.columns_by_name()[c] for c in source_col_names]
    dest_cols = [plate.columns_by_name()[c] for c in dest_col_names]

    pipette.transfer(14.0, source_cols, dest_cols, new_tip='always')
