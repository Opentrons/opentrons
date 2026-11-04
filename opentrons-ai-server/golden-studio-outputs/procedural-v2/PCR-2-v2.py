from opentrons import protocol_api

metadata = {
    'protocolName': 'PCR-2-v2',
    'author': 'OpentronsAI',
    'description': 'PCR setup of 24 samples with mastermix on an OT-2 using a temperature module and thermocycler',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Protocol parameters
    number_of_samples = 24
    mastermix_volume_ul = 8
    sample_volume_ul = 7
    total_mix_volume_ul = mastermix_volume_ul + sample_volume_ul  # 15 uL
    mix_cycles = 4

    block_temperature_c = 8
    lid_temperature_c = 90
    sample_temperature_c = 4
    hold_temperature_c = 4

    # Modules
    thermocycler_module = protocol.load_module('thermocyclerModuleV2')  # slot 7
    sample_temp_module = protocol.load_module('temperature module gen2', 1)

    # Labware
    sample_rack = sample_temp_module.load_labware('opentrons_24_aluminumblock_nest_1.5ml_snapcap')
    mastermix_rack = protocol.load_labware('opentrons_24_tuberack_nest_1.5ml_snapcap', 3)
    destination_plate = thermocycler_module.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    tiprack = protocol.load_labware('opentrons_96_filtertiprack_20ul', 4)

    # Pipette
    p20 = protocol.load_instrument('p20_single_gen2', 'right', tip_racks=[tiprack])

    # Well allocation
    sample_source_wells = sample_rack.wells()[:number_of_samples]
    mastermix_source_wells = mastermix_rack.wells()[:number_of_samples]
    destination_wells = destination_plate.wells()[:number_of_samples]

    # Liquids
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='DNA/RNA samples in 1.5 mL tubes on the temperature module',
        display_color='#FF0000',
    )
    mastermix_liquid = protocol.define_liquid(
        name='Mastermix',
        description='PCR mastermix in 1.5 mL tubes',
        display_color='#0000FF',
    )
    for well in sample_source_wells:
        well.load_liquid(liquid=sample_liquid, volume=50)
    for well in mastermix_source_wells:
        well.load_liquid(liquid=mastermix_liquid, volume=100)

    # Thermocycler setup
    thermocycler_module.set_block_temperature(block_temperature_c)
    thermocycler_module.set_lid_temperature(lid_temperature_c)
    thermocycler_module.open_lid()

    # Sample temperature module
    sample_temp_module.set_temperature(sample_temperature_c)

    # Transfer mastermix (same tip for all transfers)
    p20.transfer(
        mastermix_volume_ul,
        mastermix_source_wells,
        destination_wells,
        new_tip='once',
    )

    # Transfer samples, mix, blow out in destination well (new tip each transfer)
    p20.transfer(
        sample_volume_ul,
        sample_source_wells,
        destination_wells,
        new_tip='always',
        mix_after=(mix_cycles, total_mix_volume_ul),
        blow_out=True,
        blowout_location='destination well',
    )

    # PCR
    thermocycler_module.close_lid()

    thermocycler_module.execute_profile(
        steps=[{'temperature': 72, 'hold_time_seconds': 57}],
        repetitions=1,
        block_max_volume=total_mix_volume_ul,
    )

    thermocycler_module.execute_profile(
        steps=[
            {'temperature': 75, 'hold_time_seconds': 9},
            {'temperature': 84, 'hold_time_seconds': 10},
            {'temperature': 65, 'hold_time_seconds': 43},
        ],
        repetitions=12,
        block_max_volume=total_mix_volume_ul,
    )

    thermocycler_module.execute_profile(
        steps=[{'temperature': 62, 'hold_time_seconds': 180}],
        repetitions=1,
        block_max_volume=total_mix_volume_ul,
    )

    # Hold and finish
    thermocycler_module.set_block_temperature(hold_temperature_c)
    thermocycler_module.open_lid()

    sample_temp_module.deactivate()
