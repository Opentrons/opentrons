from opentrons import protocol_api

metadata = {
    'protocolName': 'PCR-3-v2',
    'author': 'OpentronsAI',
    'description': 'PCR setup protocol with sample and mastermix temperature modules and thermocycler',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Sample parameters
    num_samples = 64
    num_cols = num_samples // 8
    sample_volume_ul = 5
    master_mix_volume_ul = 7
    mix_cycles = 9
    total_mix_volume_ul = sample_volume_ul + master_mix_volume_ul  # 12 uL total

    # Temperature settings
    sample_temperature_c = 4
    master_mix_temperature_c = 10

    # Thermocycler parameters
    lid_temperature_c = 55
    initial_block_temperature_c = 6
    final_hold_temperature_c = 4

    # Modules
    thermocycler_module = protocol.load_module('thermocyclerModuleV2')
    sample_temperature_module = protocol.load_module('temperature module gen2', 'D1')
    master_mix_temperature_module = protocol.load_module('temperature module gen2', 'D3')

    # Adapters
    sample_adapter = sample_temperature_module.load_adapter('opentrons_96_well_aluminum_block')
    master_mix_adapter = master_mix_temperature_module.load_adapter('opentrons_96_well_aluminum_block')

    # Labware
    sample_plate = sample_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    master_mix_plate = master_mix_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    destination_plate = thermocycler_module.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    tiprack = protocol.load_labware('opentrons_flex_96_filtertiprack_1000ul', 'C1')

    # Pipette
    pipette = protocol.load_instrument('flex_1channel_1000', 'left', tip_racks=[tiprack])

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Well allocation - first 64 wells column-wise
    sample_source_wells = sample_plate.wells()[:num_samples]
    master_mix_source_wells = master_mix_plate.wells()[:num_samples]
    destination_wells = destination_plate.wells()[:num_samples]

    # Define liquids
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='PCR sample liquid',
        display_color='#FF0000',
    )
    master_mix_liquid = protocol.define_liquid(
        name='Mastermix',
        description='PCR mastermix liquid',
        display_color='#00FF00',
    )

    # Assign liquids to wells before pipetting
    for well in sample_source_wells:
        well.load_liquid(liquid=sample_liquid, volume=sample_volume_ul)
    for well in master_mix_source_wells:
        well.load_liquid(liquid=master_mix_liquid, volume=master_mix_volume_ul)

    # Set thermocycler block and lid temperature, open lid
    thermocycler_module.set_block_temperature(initial_block_temperature_c)
    thermocycler_module.set_lid_temperature(lid_temperature_c)
    thermocycler_module.open_lid()

    # Set sample and mastermix temperature modules
    sample_temperature_module.set_temperature(sample_temperature_c)
    master_mix_temperature_module.set_temperature(master_mix_temperature_c)

    # Transfer mastermix to destination wells (same tip for all transfers)
    pipette.transfer(
        master_mix_volume_ul,
        master_mix_source_wells,
        destination_wells,
        new_tip='once'
    )

    # Transfer sample to destination wells, mix, blow out (same tip for all transfers)
    pipette.transfer(
        sample_volume_ul,
        sample_source_wells,
        destination_wells,
        new_tip='once',
        mix_after=(mix_cycles, total_mix_volume_ul),
        blow_out=True,
        blowout_location='destination well'
    )

    # Close thermocycler lid
    thermocycler_module.close_lid()

    # PCR cycling
    thermocycler_module.execute_profile(
        steps=[{'temperature': 74, 'hold_time_seconds': 65}],
        repetitions=1,
        block_max_volume=total_mix_volume_ul
    )

    thermocycler_module.execute_profile(
        steps=[
            {'temperature': 60, 'hold_time_seconds': 7},
            {'temperature': 84, 'hold_time_seconds': 19},
            {'temperature': 57, 'hold_time_seconds': 44}
        ],
        repetitions=13,
        block_max_volume=total_mix_volume_ul
    )

    thermocycler_module.execute_profile(
        steps=[{'temperature': 75, 'hold_time_seconds': 480}],
        repetitions=1,
        block_max_volume=total_mix_volume_ul
    )

    # Hold at final temperature, open lid
    thermocycler_module.set_block_temperature(final_hold_temperature_c)
    thermocycler_module.open_lid()

    # Deactivate temperature modules
    master_mix_temperature_module.deactivate()
    sample_temperature_module.deactivate()
