from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-4-v2',
    'author': 'Bob',
    'description': 'Transfer',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28'
}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    source_1 = protocol.load_labware('nest_1_reservoir_195ml', 7)
    source_2 = protocol.load_labware('biorad_384_wellplate_50ul', 8)
    source_3 = protocol.load_labware('biorad_96_wellplate_200ul_pcr', 9)
    destination_1 = protocol.load_labware('corning_384_wellplate_112ul_flat', 1)
    destination_2 = protocol.load_labware('corning_96_wellplate_360ul_flat', 2)

    tiprack300 = protocol.load_labware('opentrons_96_tiprack_300ul', 10)
    tiprack20 = protocol.load_labware('opentrons_96_tiprack_20ul', 11)

    # Pipettes
    p300s = protocol.load_instrument('p300_single_gen2', mount='left', tip_racks=[tiprack300])
    p20s = protocol.load_instrument('p20_single_gen2', mount='right', tip_racks=[tiprack20])

    # Liquid definitions
    reagent_1 = protocol.define_liquid(
        name='Reagent 1',
        description='Reagent transferred from the reservoir to destination plates 1 and 2',
        display_color='#33FF33'
    )
    reagent_2 = protocol.define_liquid(
        name='Reagent 2',
        description='Reagent transferred from the 384-well source plate to destination plate 1',
        display_color='#FF33F5'
    )
    reagent_3 = protocol.define_liquid(
        name='Reagent 3',
        description='Reagent transferred from the 96-well PCR source plate to destination plate 2',
        display_color='#3399FF'
    )

    # Load liquids into source wells
    source_1.wells_by_name()['A1'].load_liquid(liquid=reagent_1, volume=0.8 * source_1.wells_by_name()['A1'].max_volume)

    for well in source_2.wells():
        well.load_liquid(liquid=reagent_2, volume=20)

    for well in source_3.wells():
        well.load_liquid(liquid=reagent_3, volume=100)

    # volumes setup
    transfer_vol_1 = 15
    transfer_vol_2 = 20
    transfer_vol_3 = 100

    # wells setup
    source_wells_1 = source_1.wells_by_name()['A1']
    source_wells_2 = source_2.wells()
    source_wells_3 = source_3.wells()
    destination_wells_1 = destination_1.wells()
    destination_wells_2 = destination_2.wells()
    all_destinations = destination_wells_1 + destination_wells_2

    # Command P: transfer 15 uL from source 1 to all wells of destination 1 and 2, reuse same tip
    p20s.transfer(transfer_vol_1, source_wells_1, all_destinations, new_tip="once")

    # Command Q: transfer 20 uL from each well of source 2 to each well of destination 1, reuse same tip
    p20s.transfer(transfer_vol_2, source_wells_2, destination_wells_1, new_tip="once")

    # Command R: transfer 100 uL from each well of source 3 to each well of destination 2, new tip each time
    p300s.transfer(transfer_vol_3, source_wells_3, destination_wells_2, new_tip="always")
