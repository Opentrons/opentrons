from opentrons import protocol_api

metadata = {
    'protocolName': 'Serial-dilution-6-v2',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',  # 2.29 is above this platform's supported ceiling
}


def run(protocol: protocol_api.ProtocolContext):

    # Constants
    DILUTION_FACTOR = 3
    NUM_DILUTIONS = 10
    TOTAL_MIXING_VOLUME = 150.0
    AIR_GAP_VOLUME = 10

    # Calculated volumes
    transfer_volume = TOTAL_MIXING_VOLUME / DILUTION_FACTOR  # 50 uL
    diluent_volume = TOTAL_MIXING_VOLUME - transfer_volume   # 100 uL

    # Labware
    reservoir = protocol.load_labware('nest_12_reservoir_15ml', 'D2')
    plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 'D3')
    tipracks = [
        protocol.load_labware('opentrons_flex_96_filtertiprack_1000ul', slot)
        for slot in ['C1', 'D1']
    ]

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Pipette
    pipette = protocol.load_instrument(
        'flex_1channel_1000', 'right', tip_racks=tipracks
    )

    # Liquid definitions
    diluent_liquid = protocol.define_liquid(
        name='Diluent',
        description='Diluent liquid loaded in the reservoir',
        display_color='#33FF33',
    )
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='Undiluted sample loaded in the first column of the plate',
        display_color='#FF0000',
    )

    # Load liquids (labels only) before pipetting
    diluent_well = reservoir.wells()[0]
    diluent_well.load_liquid(
        liquid=diluent_liquid, volume=0.8 * diluent_well.max_volume
    )
    for well in plate.columns()[0]:
        well.load_liquid(liquid=sample_liquid, volume=TOTAL_MIXING_VOLUME)

    # Well groups (flattened column by column for the single-channel pipette)
    # Columns 2-11 (indices 1..10)
    dilution_destination_wells = [
        well for col in plate.columns()[1:NUM_DILUTIONS + 1] for well in col
    ]
    # Columns 1-10 (indices 0..9)
    dilution_source_wells = [
        well for col in plate.columns()[:NUM_DILUTIONS] for well in col
    ]
    # Column 12 (index 11)
    blank_wells = plate.columns()[NUM_DILUTIONS + 1]

    # R. Distribute diluent to columns 2-11 (one tip, air gap)
    pipette.transfer(
        diluent_volume,
        diluent_well,
        dilution_destination_wells,
        air_gap=AIR_GAP_VOLUME,
        new_tip='once',
    )

    # S. Serial dilutions: columns 1-10 -> columns 2-11 (one tip, air gap, mix)
    pipette.transfer(
        transfer_volume,
        dilution_source_wells,
        dilution_destination_wells,
        air_gap=AIR_GAP_VOLUME,
        mix_after=(5, TOTAL_MIXING_VOLUME / 2),
        new_tip='once',
    )

    # T. Add blank diluent to column 12 (one tip, air gap)
    pipette.transfer(
        diluent_volume,
        diluent_well,
        blank_wells,
        air_gap=AIR_GAP_VOLUME,
        new_tip='once',
    )
