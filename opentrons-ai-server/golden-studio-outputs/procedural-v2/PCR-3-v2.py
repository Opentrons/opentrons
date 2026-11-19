from opentrons import protocol_api

metadata = {
    'protocolName': 'PCR-3-v2',
    'author': 'OpentronsAI',
    'description': 'PCR setup with temperature modules and thermocycler using a 1-channel pipette (64 samples)',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Parameters
    NUMBER_OF_SAMPLES = 64
    SAMPLE_VOL = 5          # uL
    MASTERMIX_VOL = 7       # uL
    MIX_CYCLES = 9
    TOTAL_VOL = SAMPLE_VOL + MASTERMIX_VOL  # 12 uL

    SAMPLE_TEMP = 4         # C
    MASTERMIX_TEMP = 10     # C
    TC_BLOCK_TEMP = 6       # C
    TC_LID_TEMP = 55        # C
    TC_HOLD_TEMP = 4        # C

    # Modules
    thermocycler = protocol.load_module('thermocyclerModuleV2')  # occupies A1+B1
    sample_temp_mod = protocol.load_module('temperature module gen2', 'D1')
    mastermix_temp_mod = protocol.load_module('temperature module gen2', 'D3')

    # Adapters
    sample_adapter = sample_temp_mod.load_adapter('opentrons_96_well_aluminum_block')
    mastermix_adapter = mastermix_temp_mod.load_adapter('opentrons_96_well_aluminum_block')

    # Labware
    sample_plate = sample_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    mastermix_plate = mastermix_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    dest_plate = thermocycler.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_1000ul', 'C1')

    # Trash bin (Flex, apiLevel >= 2.16)
    trash = protocol.load_trash_bin('A3')

    # Pipette
    pipette = protocol.load_instrument('flex_1channel_1000', 'left', tip_racks=[tiprack])

    # Well allocation (single-channel: first 64 wells, column-wise)
    sample_wells = sample_plate.wells()[:NUMBER_OF_SAMPLES]
    mastermix_wells = mastermix_plate.wells()[:NUMBER_OF_SAMPLES]
    dest_wells = dest_plate.wells()[:NUMBER_OF_SAMPLES]

    # Define liquids
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='PCR sample',
        display_color='#FF0000',
    )
    mastermix_liquid = protocol.define_liquid(
        name='Mastermix',
        description='PCR mastermix',
        display_color='#0000FF',
    )

    # Assign liquids to the wells that contain them (volumes are labels only)
    for well in sample_wells:
        well.load_liquid(liquid=sample_liquid, volume=SAMPLE_VOL + 5)
    for well in mastermix_wells:
        well.load_liquid(liquid=mastermix_liquid, volume=MASTERMIX_VOL + 5)

    # Thermocycler setup
    thermocycler.open_lid()
    thermocycler.set_block_temperature(TC_BLOCK_TEMP)
    thermocycler.set_lid_temperature(TC_LID_TEMP)

    # Temperature module setup
    sample_temp_mod.set_temperature(SAMPLE_TEMP)
    mastermix_temp_mod.set_temperature(MASTERMIX_TEMP)

    # Transfer mastermix (same tip for all transfers)
    pipette.transfer(
        MASTERMIX_VOL,
        mastermix_wells,
        dest_wells,
        new_tip='once',
    )

    # Transfer samples, mix, blow out in destination well (same tip for all transfers)
    pipette.transfer(
        SAMPLE_VOL,
        sample_wells,
        dest_wells,
        new_tip='once',
        mix_after=(MIX_CYCLES, TOTAL_VOL),
        blow_out=True,
        blowout_location='destination well',
    )

    # PCR cycling
    thermocycler.close_lid()

    thermocycler.execute_profile(
        steps=[{'temperature': 74, 'hold_time_seconds': 65}],
        repetitions=1,
        block_max_volume=TOTAL_VOL,
    )

    thermocycler.execute_profile(
        steps=[
            {'temperature': 60, 'hold_time_seconds': 7},
            {'temperature': 84, 'hold_time_seconds': 19},
            {'temperature': 57, 'hold_time_seconds': 44},
        ],
        repetitions=13,
        block_max_volume=TOTAL_VOL,
    )

    thermocycler.execute_profile(
        steps=[{'temperature': 75, 'hold_time_seconds': 480}],
        repetitions=1,
        block_max_volume=TOTAL_VOL,
    )

    # Hold and finish
    thermocycler.set_block_temperature(TC_HOLD_TEMP)
    thermocycler.open_lid()

    # Deactivate temperature modules
    mastermix_temp_mod.deactivate()
    sample_temp_mod.deactivate()
