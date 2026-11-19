from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-2-v2',
    'author': 'OpentronsAI',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Adapters
    source_adapter = protocol.load_adapter('opentrons_96_pcr_adapter', 1)

    # Labware
    source_plate = source_adapter.load_labware('nest_96_wellplate_100ul_pcr_full_skirt')
    dest_plate = protocol.load_labware('opentrons_96_aluminumblock_biorad_wellplate_200ul', 5)
    tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', 4)

    # Pipette
    p300 = protocol.load_instrument('p300_single_gen2', 'left', tip_racks=[tiprack])

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent to be transferred',
        display_color='#33AAFF',
    )

    TRANSFER_VOL = 117.0
    dest_names = ['E12', 'G12', 'B9', 'A6', 'D7']
    source_well = source_plate.wells_by_name()['A1']
    dest_wells = [dest_plate.wells_by_name()[w] for w in dest_names]

    # Load liquid label on the source well (before it's used as a source)
    source_well.load_liquid(liquid=reagent, volume=source_well.max_volume)

    # Transfer 117 uL to each destination well, new tip every time
    p300.transfer(TRANSFER_VOL, source_well, dest_wells, new_tip='always')
