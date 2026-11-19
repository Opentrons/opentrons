from opentrons import protocol_api

metadata = {
    'protocolName': 'Serial-dilution-5-v2',
    'author': 'OpentronsAI',
    'description': 'Execute serial dilution protocol',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):

    # Constants
    PLATE_TYPE = 'opentrons_96_aluminumblock_nest_wellplate_100ul'
    DILUTION_FACTOR = 1.5
    NUM_DILUTIONS = 10
    TOTAL_MIXING_VOLUME = 150
    AIR_GAP = 10

    # Calculated volumes
    transfer_volume = TOTAL_MIXING_VOLUME / DILUTION_FACTOR   # 100 uL
    diluent_volume = TOTAL_MIXING_VOLUME - transfer_volume    # 50 uL

    # Modules
    temp_module = protocol.load_module('temperature module gen2', 4)

    # Labware
    reservoir = protocol.load_labware('nest_12_reservoir_15ml', 1)
    dilution_plate = temp_module.load_labware(PLATE_TYPE)
    tipracks = [
        protocol.load_labware('opentrons_96_tiprack_300ul', slot)
        for slot in [2, 3]
    ]

    # Pipette
    pipette = protocol.load_instrument(
        'p300_multi_gen2',
        mount='left',
        tip_racks=tipracks
    )

    # Liquids
    diluent_liquid = protocol.define_liquid(
        name='Diluent',
        description='Diluent in reservoir well A1',
        display_color='#33FF33'
    )
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='Undiluted sample in well A1 of the dilution plate',
        display_color='#FF0000'
    )

    row_a = dilution_plate.rows()[0]
    diluent_well = reservoir.wells()[0]

    diluent_well.load_liquid(liquid=diluent_liquid, volume=12000)
    row_a[0].load_liquid(liquid=sample_liquid, volume=TOTAL_MIXING_VOLUME)

    # 1. Distribute diluent to wells 2-10 of row A (new tip each transfer)
    pipette.transfer(
        diluent_volume,
        diluent_well,
        row_a[1:NUM_DILUTIONS],
        air_gap=AIR_GAP,
        new_tip='always'
    )

    # 2. Serial dilution: well 1->2, 2->3, ... 9->10
    sources = row_a[:NUM_DILUTIONS - 1]
    dests = row_a[1:NUM_DILUTIONS]
    pipette.transfer(
        transfer_volume,
        sources,
        dests,
        air_gap=AIR_GAP,
        mix_after=(5, TOTAL_MIXING_VOLUME - 5),
        new_tip='always'
    )

    # 3. Blank in last well of row A
    pipette.transfer(
        diluent_volume,
        diluent_well,
        row_a[-1],
        air_gap=AIR_GAP,
        new_tip='always'
    )
