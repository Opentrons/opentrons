from opentrons import protocol_api

metadata = {
    'protocolName': 'PCR-4-v2',
    'author': 'Bob',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28'
}


def run(protocol: protocol_api.ProtocolContext):
    # Protocol parameters
    num_samples = 72
    num_cols = num_samples // 8  # 9 columns

    mastermix_vol = 15  # uL
    sample_vol = 10  # uL
    mix_cycles = 9
    total_mix_vol = sample_vol + mastermix_vol  # 25 uL total

    sample_temp_c = 37
    mastermix_temp_c = 10

    block_initial_temp_c = 6
    lid_temp_c = 55
    hold_temp_c = 4

    # Modules
    thermocycler_module = protocol.load_module('thermocyclerModuleV2')
    sample_temp_module = protocol.load_module('temperature module gen2', 'D1')
    mastermix_temp_module = protocol.load_module('temperature module gen2', 'D3')

    # Adapters
    sample_adapter = sample_temp_module.load_adapter('opentrons_96_well_aluminum_block')
    mastermix_adapter = mastermix_temp_module.load_adapter('opentrons_96_well_aluminum_block')

    # Labware
    sample_plate = sample_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    mastermix_plate = mastermix_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    dest_plate = thermocycler_module.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')

    # Tip racks
    tiprack_1000 = protocol.load_labware('opentrons_flex_96_filtertiprack_1000ul', 'C1')
    tiprack_50 = protocol.load_labware('opentrons_flex_96_filtertiprack_50ul', 'C2')

    # Pipettes
    left_pipette = protocol.load_instrument('flex_8channel_1000', 'left', tip_racks=[tiprack_1000])
    right_pipette = protocol.load_instrument('flex_8channel_50', 'right', tip_racks=[tiprack_50])

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Well allocation (first 9 columns)
    mastermix_source_wells = mastermix_plate.columns()[:num_cols]
    sample_source_wells = sample_plate.columns()[:num_cols]
    destination_wells = dest_plate.columns()[:num_cols]

    # Define liquids
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='PCR sample liquid',
        display_color='#FF0000'
    )
    mastermix_liquid = protocol.define_liquid(
        name='Mastermix',
        description='PCR mastermix liquid',
        display_color='#0000FF'
    )

    # Load liquids into wells (first 9 columns of source plates)
    for column in sample_plate.columns()[:num_cols]:
        for well in column:
            well.load_liquid(liquid=sample_liquid, volume=sample_vol)

    for column in mastermix_plate.columns()[:num_cols]:
        for well in column:
            well.load_liquid(liquid=mastermix_liquid, volume=mastermix_vol)

    # Thermocycler initial setup
    thermocycler_module.set_block_temperature(block_initial_temp_c)
    thermocycler_module.set_lid_temperature(lid_temp_c)
    thermocycler_module.open_lid()

    # Temperature module setup
    sample_temp_module.set_temperature(sample_temp_c)
    mastermix_temp_module.set_temperature(mastermix_temp_c)

    # Transfer mastermix (right pipette, same tip for all transfers)
    right_pipette.transfer(
        mastermix_vol,
        mastermix_source_wells,
        destination_wells,
        new_tip='once'
    )

    # Transfer samples and mix (left pipette, new tip each transfer)
    left_pipette.transfer(
        sample_vol,
        sample_source_wells,
        destination_wells,
        new_tip='always',
        mix_after=(mix_cycles, total_mix_vol),
        blow_out=True,
        blowout_location='destination well'
    )

    # Close lid and run PCR profile
    thermocycler_module.close_lid()

    thermocycler_module.execute_profile(
        steps=[{'temperature': 74, 'hold_time_seconds': 65}],
        repetitions=1,
        block_max_volume=total_mix_vol
    )

    thermocycler_module.execute_profile(
        steps=[
            {'temperature': 60, 'hold_time_seconds': 7},
            {'temperature': 84, 'hold_time_seconds': 19},
            {'temperature': 57, 'hold_time_seconds': 44}
        ],
        repetitions=25,
        block_max_volume=total_mix_vol
    )

    thermocycler_module.execute_profile(
        steps=[{'temperature': 75, 'hold_time_seconds': 480}],
        repetitions=1,
        block_max_volume=total_mix_vol
    )

    thermocycler_module.set_block_temperature(hold_temp_c)
    thermocycler_module.open_lid()

    # Deactivate temperature modules
    mastermix_temp_module.deactivate()
    sample_temp_module.deactivate()
