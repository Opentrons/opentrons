from opentrons import protocol_api

metadata = {
    'protocolName': 'PCR-2-v2',
    'author': 'Bob',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'OT-2',
    'apiLevel': '2.28'
}


def run(protocol: protocol_api.ProtocolContext):
    # Sample parameters
    num_samples = 24
    sample_vol = 7  # uL
    mastermix_vol = 8  # uL
    mix_cycles = 4
    total_mix_vol = sample_vol + mastermix_vol  # 15 uL total

    # Temperature settings
    sample_temp_c = 4
    tc_block_temp_c = 8
    tc_lid_temp_c = 90
    tc_hold_temp_c = 4

    # Modules
    thermocycler_module = protocol.load_module('thermocyclerModuleV2')
    sample_temperature_module = protocol.load_module('temperature module gen2', 1)

    # Labware
    sample_plate = sample_temperature_module.load_labware(
        'opentrons_24_aluminumblock_nest_1.5ml_snapcap'
    )
    mastermix_rack = protocol.load_labware(
        'opentrons_24_tuberack_nest_1.5ml_snapcap', 3
    )
    dest_plate = thermocycler_module.load_labware(
        'opentrons_96_wellplate_200ul_pcr_full_skirt'
    )
    tiprack = protocol.load_labware('opentrons_96_filtertiprack_20ul', 4)

    # Pipette
    p20_single = protocol.load_instrument(
        'p20_single_gen2', 'right', tip_racks=[tiprack]
    )

    # Well allocation
    sample_wells = sample_plate.wells()[:num_samples]
    mastermix_wells = mastermix_rack.wells()[:num_samples]
    dest_wells = dest_plate.wells()[:num_samples]

    # Define liquids
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='PCR sample liquid',
        display_color='#FF0000'
    )
    mastermix_liquid = protocol.define_liquid(
        name='Mastermix',
        description='PCR mastermix liquid',
        display_color='#00FF00'
    )

    # Load liquids into wells
    for well in sample_wells:
        well.load_liquid(liquid=sample_liquid, volume=sample_vol)
    for well in mastermix_wells:
        well.load_liquid(liquid=mastermix_liquid, volume=mastermix_vol)

    # Command O: Set thermocycler block temperature
    thermocycler_module.set_block_temperature(tc_block_temp_c)

    # Command P: Set thermocycler lid temperature
    thermocycler_module.set_lid_temperature(tc_lid_temp_c)

    # Command Q: Open thermocycler lid
    thermocycler_module.open_lid()

    # Command R: Set sample temperature module
    sample_temperature_module.set_temperature(sample_temp_c)

    # Command S: Transfer mastermix, same tip for all transfers
    p20_single.transfer(
        mastermix_vol,
        mastermix_wells,
        dest_wells,
        new_tip='once'
    )

    # Command T: Transfer sample, mix, blow out, new tip each transfer
    p20_single.transfer(
        sample_vol,
        sample_wells,
        dest_wells,
        new_tip='always',
        mix_after=(mix_cycles, total_mix_vol),
        blow_out=True,
        blowout_location='destination well'
    )

    # Command U: Close thermocycler lid
    thermocycler_module.close_lid()

    # Command V: PCR cycling - step 1
    thermocycler_module.execute_profile(
        steps=[{'temperature': 72, 'hold_time_seconds': 57}],
        repetitions=1,
        block_max_volume=total_mix_vol
    )

    # Command W: PCR cycling - step 2
    thermocycler_module.execute_profile(
        steps=[
            {'temperature': 75, 'hold_time_seconds': 9},
            {'temperature': 84, 'hold_time_seconds': 10},
            {'temperature': 65, 'hold_time_seconds': 43}
        ],
        repetitions=12,
        block_max_volume=total_mix_vol
    )

    # Command X: PCR cycling - step 3
    thermocycler_module.execute_profile(
        steps=[{'temperature': 62, 'hold_time_seconds': 180}],
        repetitions=1,
        block_max_volume=total_mix_vol
    )

    # Command Y: Hold thermocycler block
    thermocycler_module.set_block_temperature(tc_hold_temp_c)

    # Command Z: Open thermocycler lid
    thermocycler_module.open_lid()

    # Command AA: Deactivate sample temperature module
    sample_temperature_module.deactivate()
