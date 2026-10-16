from opentrons import protocol_api

metadata = {
    'protocolName': 'Serial-dilution-7-v2',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):

    # Constants
    DILUTION_FACTOR = 3
    NUM_DILUTIONS = 10
    TOTAL_MIXING_VOLUME = 150.0
    AIR_GAP_VOLUME = 10

    # Calculated volumes
    transfer_volume = TOTAL_MIXING_VOLUME / DILUTION_FACTOR
    diluent_volume = TOTAL_MIXING_VOLUME - transfer_volume

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
    pipette = protocol.load_instrument('flex_8channel_1000', 'right', tip_racks=tipracks)

    # Liquids
    diluent_liquid = protocol.define_liquid(
        name='Diluent',
        description='Diluent liquid is filled in the reservoir',
        display_color='#33FF33',
    )
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='Non-diluted samples are loaded in the 1st column',
        display_color='#FF0000',
    )

    diluent_well = reservoir['A1']
    diluent_well.load_liquid(liquid=diluent_liquid, volume=0.8 * diluent_well.max_volume)
    for well in plate.columns()[0]:
        well.load_liquid(liquid=sample_liquid, volume=TOTAL_MIXING_VOLUME)

    # Well sets (row A of the plate; the 8-channel pipette addresses full columns)
    row_a = plate.rows()[0]
    dilution_sources = row_a[:NUM_DILUTIONS]          # A1-A10
    dilution_destinations = row_a[1:NUM_DILUTIONS + 1]  # A2-A11
    blank_well = row_a[NUM_DILUTIONS + 1]             # A12

    # R. Distribute diluent to wells 2-11 (one tip, reused)
    pipette.pick_up_tip()
    pipette.transfer(
        diluent_volume,
        diluent_well,
        dilution_destinations,
        air_gap=AIR_GAP_VOLUME,
        new_tip='never',
    )
    pipette.drop_tip()

    # S. Serial dilution A1->A2, ..., A10->A11 (one tip, reused)
    pipette.pick_up_tip()
    pipette.transfer(
        transfer_volume,
        dilution_sources,
        dilution_destinations,
        air_gap=AIR_GAP_VOLUME,
        mix_after=(5, TOTAL_MIXING_VOLUME / 2),
        new_tip='never',
    )
    pipette.drop_tip()

    # T. Add blank to well A12 (one tip)
    pipette.pick_up_tip()
    pipette.transfer(
        diluent_volume,
        diluent_well,
        blank_well,
        air_gap=AIR_GAP_VOLUME,
        new_tip='never',
    )
    pipette.drop_tip()
