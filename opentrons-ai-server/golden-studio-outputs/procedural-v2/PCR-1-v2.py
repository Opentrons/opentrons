from opentrons import protocol_api

metadata = {
    'protocolName': 'PCR-1-v2',
    'author': 'Bob',
    'source': 'OpentronsAI',
}

requirements = {"robotType": "OT-2", "apiLevel": "2.28"}


def run(protocol: protocol_api.ProtocolContext):
    # Sample preparation parameters
    number_of_samples = 64
    sample_vol = 5  # uL
    mastermix_vol = 7  # uL
    mix_cycles = 9
    total_mix_vol = sample_vol + mastermix_vol  # 12 uL total

    # Temperature parameters
    sample_temp_c = 4
    mastermix_temp_c = 10

    # Thermocycler parameters
    lid_temperature_c = 55
    initial_block_temperature_c = 6
    hold_temperature_c = 4

    # Modules
    thermocycler_module = protocol.load_module('thermocyclerModuleV2')
    sample_temp_module = protocol.load_module('temperature module gen2', 1)
    mastermix_temp_module = protocol.load_module('temperature module gen2', 3)

    # Labware
    tiprack = protocol.load_labware('opentrons_96_filtertiprack_20ul', 4)
    sample_plate = sample_temp_module.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    mastermix_plate = mastermix_temp_module.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    dest_plate = thermocycler_module.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')

    # Pipette
    p20_multi = protocol.load_instrument('p20_multi_gen2', 'left', tip_racks=[tiprack])

    # Well allocation (column-wise, first 64 wells = 8 columns)
    num_columns = number_of_samples // 8
    sample_source_wells = sample_plate.columns()[:num_columns]
    mastermix_source_wells = mastermix_plate.columns()[:num_columns]
    destination_wells = dest_plate.columns()[:num_columns]

    # Define liquids
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='PCR sample',
        display_color='#FF0000'
    )
    mastermix_liquid = protocol.define_liquid(
        name='Mastermix',
        description='PCR mastermix',
        display_color='#33FF33'
    )

    # Load liquids into wells (first 64 wells column-wise on each source plate)
    sample_wells_flat = [well for col in sample_source_wells for well in col]
    mastermix_wells_flat = [well for col in mastermix_source_wells for well in col]

    for well in sample_wells_flat:
        well.load_liquid(liquid=sample_liquid, volume=sample_vol)

    for well in mastermix_wells_flat:
        well.load_liquid(liquid=mastermix_liquid, volume=mastermix_vol)

    # Open thermocycler lid
    thermocycler_module.open_lid()

    # Set thermocycler block temperature
    thermocycler_module.set_block_temperature(initial_block_temperature_c)

    # Set thermocycler lid temperature
    thermocycler_module.set_lid_temperature(lid_temperature_c)

    # Set sample temperature module
    sample_temp_module.set_temperature(sample_temp_c)

    # Set mastermix temperature module
    mastermix_temp_module.set_temperature(mastermix_temp_c)

    # Transfer mastermix to destination wells (same tip for all transfers)
    p20_multi.transfer(
        mastermix_vol,
        mastermix_source_wells,
        destination_wells,
        new_tip='once'
    )

    # Transfer samples to destination wells and mix (new tip for each transfer)
    p20_multi.transfer(
        sample_vol,
        sample_source_wells,
        destination_wells,
        new_tip='always',
        mix_after=(mix_cycles, total_mix_vol),
        blow_out=True,
        blowout_location='destination well'
    )

    # Close thermocycler lid
    thermocycler_module.close_lid()

    # PCR cycling
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
        repetitions=13,
        block_max_volume=total_mix_vol
    )

    thermocycler_module.execute_profile(
        steps=[{'temperature': 75, 'hold_time_seconds': 480}],
        repetitions=1,
        block_max_volume=total_mix_vol
    )

    # Hold thermocycler block temperature
    thermocycler_module.set_block_temperature(hold_temperature_c)

    # Open thermocycler lid
    thermocycler_module.open_lid()

    # Deactivate temperature modules
    mastermix_temp_module.deactivate()
    sample_temp_module.deactivate()
