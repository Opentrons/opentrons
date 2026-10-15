from opentrons import protocol_api

metadata = {
    'protocolName': 'PCR-4-v2',
    'author': 'OpentronsAI',
    'description': 'PCR setup with temperature modules and thermocycler, 72 samples (9 columns) using 8-channel pipettes',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Protocol parameters
    NUM_SAMPLES = 72
    NUM_COLUMNS = NUM_SAMPLES // 8  # 9 columns
    MASTERMIX_VOL = 15  # uL
    SAMPLE_VOL = 10  # uL
    TOTAL_VOL = MASTERMIX_VOL + SAMPLE_VOL  # 25 uL
    MIX_REPS = 9

    TC_BLOCK_TEMP = 6
    TC_LID_TEMP = 55
    SAMPLE_TEMP = 37
    MASTERMIX_TEMP = 10
    HOLD_TEMP = 4

    # Modules
    thermocycler = protocol.load_module('thermocyclerModuleV2')
    sample_temp_mod = protocol.load_module('temperature module gen2', 'D1')
    mastermix_temp_mod = protocol.load_module('temperature module gen2', 'D3')

    # Adapters
    sample_adapter = sample_temp_mod.load_adapter('opentrons_96_well_aluminum_block')
    mastermix_adapter = mastermix_temp_mod.load_adapter('opentrons_96_well_aluminum_block')

    # Labware
    sample_plate = sample_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    mastermix_plate = mastermix_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    dest_plate = thermocycler.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    tips_1000 = protocol.load_labware('opentrons_flex_96_filtertiprack_1000ul', 'C1')
    tips_50 = protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', 'C2')

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Pipettes
    left_pipette = protocol.load_instrument('flex_8channel_1000', 'left', tip_racks=[tips_1000])
    right_pipette = protocol.load_instrument('flex_8channel_50', 'right', tip_racks=[tips_50])

    # Well allocation (multi-channel -> columns)
    mastermix_src = mastermix_plate.columns()[:NUM_COLUMNS]
    sample_src = sample_plate.columns()[:NUM_COLUMNS]
    dest_cols = dest_plate.columns()[:NUM_COLUMNS]

    # Liquids
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='DNA/RNA samples in the sample plate',
        display_color='#FF0000',
    )
    mastermix_liquid = protocol.define_liquid(
        name='Mastermix',
        description='PCR mastermix in the mastermix plate',
        display_color='#0000FF',
    )
    for column in sample_src:
        for well in column:
            well.load_liquid(liquid=sample_liquid, volume=100)
    for column in mastermix_src:
        for well in column:
            well.load_liquid(liquid=mastermix_liquid, volume=150)

    # Thermocycler setup
    thermocycler.set_block_temperature(TC_BLOCK_TEMP)
    thermocycler.set_lid_temperature(TC_LID_TEMP)
    thermocycler.open_lid()

    # Temperature modules
    sample_temp_mod.set_temperature(SAMPLE_TEMP)
    mastermix_temp_mod.set_temperature(MASTERMIX_TEMP)

    # Transfer mastermix (right pipette, same tip for all transfers)
    right_pipette.transfer(
        MASTERMIX_VOL,
        mastermix_src,
        dest_cols,
        new_tip='once',
    )

    # Transfer samples (left pipette, new tip each time, mix, blow out in destination)
    left_pipette.transfer(
        SAMPLE_VOL,
        sample_src,
        dest_cols,
        new_tip='always',
        mix_after=(MIX_REPS, TOTAL_VOL),
        blow_out=True,
        blowout_location='destination well',
    )

    # PCR
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
        repetitions=25,
        block_max_volume=TOTAL_VOL,
    )
    thermocycler.execute_profile(
        steps=[{'temperature': 75, 'hold_time_seconds': 480}],
        repetitions=1,
        block_max_volume=TOTAL_VOL,
    )

    # Hold and open lid
    thermocycler.set_block_temperature(HOLD_TEMP)
    thermocycler.open_lid()

    # Deactivate temperature modules
    mastermix_temp_mod.deactivate()
    sample_temp_mod.deactivate()
