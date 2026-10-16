from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-4-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_1 = protocol.load_labware('nest_1_reservoir_195ml', 7)
    source_2 = protocol.load_labware('biorad_384_wellplate_50ul', 8)
    source_3 = protocol.load_labware('biorad_96_wellplate_200ul_pcr', 9)
    destination_1 = protocol.load_labware('corning_384_wellplate_112ul_flat', 1)
    destination_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 2)

    tiprack_300 = protocol.load_labware('opentrons_96_tiprack_300ul', 10)
    tiprack_20 = protocol.load_labware('opentrons_96_tiprack_20ul', 11)

    # Pipettes
    p300 = protocol.load_instrument('p300_single_gen2', 'left', tip_racks=[tiprack_300])
    p20 = protocol.load_instrument('p20_single_gen2', 'right', tip_racks=[tiprack_20])

    # Liquids
    reagent_liquid = protocol.define_liquid(
        name='Reagent',
        description='Bulk reagent in the reservoir (source labware 1)',
        display_color='#00AAFF',
    )
    sample_384_liquid = protocol.define_liquid(
        name='Sample 384',
        description='Samples in the 384 well source plate (source labware 2)',
        display_color='#FF8800',
    )
    sample_96_liquid = protocol.define_liquid(
        name='Sample 96',
        description='Samples in the 96 well PCR source plate (source labware 3)',
        display_color='#33CC33',
    )

    # Load liquids into source wells
    source_1['A1'].load_liquid(liquid=reagent_liquid, volume=15 * (384 + 96) + 500)
    for well in source_2.wells():
        well.load_liquid(liquid=sample_384_liquid, volume=20)
    for well in source_3.wells():
        well.load_liquid(liquid=sample_96_liquid, volume=100)

    # Volumes
    vol_reagent = 15
    vol_384 = 20
    vol_96 = 100

    # Wells
    source_well_1 = source_1.wells_by_name()['A1']
    all_destinations = destination_1.wells() + destination_2.wells()

    # Step P: P20 (right), 15 uL from reservoir A1 to every well in both destination plates, same tip
    p20.transfer(vol_reagent, source_well_1, all_destinations, new_tip='once')

    # Step Q: P20 (right), 20 uL from each well of source 2 to each well of destination 1, same tip
    p20.transfer(vol_384, source_2.wells(), destination_1.wells(), new_tip='once')

    # Step R: P300 (left), 100 uL from each well of source 3 to each well of destination 2, new tip each time
    p300.transfer(vol_96, source_3.wells(), destination_2.wells(), new_tip='always')
