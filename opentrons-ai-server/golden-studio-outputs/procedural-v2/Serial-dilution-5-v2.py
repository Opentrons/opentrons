from opentrons import protocol_api

metadata = {
    'protocolName': 'Serial-dilution-5-v2',
    'author': 'John C. Lynch',
    'description': 'Execute serial dilution protocol',
    'source': 'Custom Protocol Request',
}

requirements = {
    "robotType": "OT-2",
    "apiLevel": "2.28"
}


def run(protocol: protocol_api.ProtocolContext):

    # Constants
    PLATE_TYPE = 'opentrons_96_aluminumblock_nest_wellplate_100ul'
    DILUTION_FACTOR = 1.5
    NUM_DILUTIONS = 10
    TOTAL_MIXING_VOLUME = 150

    # Calculated volumes
    transfer_volume = TOTAL_MIXING_VOLUME / DILUTION_FACTOR
    diluent_volume = TOTAL_MIXING_VOLUME - transfer_volume

    # Load temperature module and labware
    temp_module = protocol.load_module('temperature module gen2', '4')
    reservoir = protocol.load_labware('nest_12_reservoir_15ml', '1')
    dilution_plate = temp_module.load_labware(PLATE_TYPE)

    # Load tipracks
    tipracks = [
        protocol.load_labware('opentrons_96_tiprack_300ul', slot)
        for slot in ['2', '3']
    ]

    # Load pipette
    pipette = protocol.load_instrument(
        'p300_multi_gen2',
        mount='left',
        tip_racks=tipracks
    )

    # Define liquids
    diluent_liquid = protocol.define_liquid(
        name="Diluent",
        description="Diluent liquid used for serial dilution",
        display_color="#33FF33"
    )
    sample_liquid = protocol.define_liquid(
        name="Sample",
        description="Non-diluted sample loaded in the first well of the dilution plate row",
        display_color="#FF0000"
    )

    # Assign liquids to wells
    reservoir.wells_by_name()['A1'].load_liquid(
        liquid=diluent_liquid,
        volume=0.8 * reservoir.wells_by_name()['A1'].max_volume
    )

    # First row, first well of dilution plate contains sample
    for well in dilution_plate.rows()[0][0:1]:
        well.load_liquid(liquid=sample_liquid, volume=TOTAL_MIXING_VOLUME)

    # Remaining wells 2-10 will receive diluent (loaded empty until diluent added)
    for well in dilution_plate.rows()[0][1:NUM_DILUTIONS]:
        well.load_liquid(liquid=diluent_liquid, volume=0)

    # Blank well (well 12, index 11) will receive diluent only
    dilution_plate.rows()[0][NUM_DILUTIONS + 1].load_liquid(liquid=diluent_liquid, volume=0)

    # 1. Distribute diluent to wells 2-10
    pipette.transfer(
        diluent_volume,
        reservoir.wells()[0],
        dilution_plate.rows()[0][1:NUM_DILUTIONS],
        air_gap=10,
        new_tip='always'
    )

    # 2. Perform serial dilutions
    sources = dilution_plate.rows()[0][:NUM_DILUTIONS - 1]
    dests = dilution_plate.rows()[0][1:NUM_DILUTIONS]

    pipette.transfer(
        transfer_volume,
        sources,
        dests,
        air_gap=10,
        mix_after=(5, TOTAL_MIXING_VOLUME - 5),
        new_tip='always'
    )

    # 3. Add blank
    pipette.transfer(
        diluent_volume,
        reservoir.wells()[0],
        dilution_plate.rows()[0][-1],
        air_gap=10,
        new_tip='always'
    )
