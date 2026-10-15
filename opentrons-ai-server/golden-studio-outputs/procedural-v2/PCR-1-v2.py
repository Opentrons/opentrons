import math
from opentrons import protocol_api

metadata = {
    'protocolName': 'PCR-1-v2',
    'author': 'Bob',
    'description': 'PCR setup and amplification with temperature modules and thermocycler (64 samples)',
    'source': 'OpentronsAI',
}

requirements = {"robotType": "OT-2", "apiLevel": "2.28"}


def run(protocol: protocol_api.ProtocolContext):
    # Parameters
    number_of_samples = 64  # O
    sample_volume_ul = 5
    master_mix_volume_ul = 7
    mixing_cycles = 9
    total_mix_volume_ul = sample_volume_ul + master_mix_volume_ul  # 12 uL

    sample_temperature_c = 4
    master_mix_temperature_c = 10
    lid_temperature_c = 55
    initial_block_temperature_c = 6
    hold_temperature_c = 4

    # Modules
    thermocycler_module = protocol.load_module('thermocyclerModuleV2')  # slot 7
    sample_temperature_module = protocol.load_module('temperature module gen2', 1)
    master_mix_temperature_module = protocol.load_module('temperature module gen2', 3)

    # Adapters (PCR plates need a thermal adapter on the temperature modules)
    sample_adapter = sample_temperature_module.load_adapter('opentrons_96_well_aluminum_block')
    master_mix_adapter = master_mix_temperature_module.load_adapter('opentrons_96_well_aluminum_block')

    # Labware
    sample_plate = sample_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    master_mix_plate = master_mix_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    pcr_plate = thermocycler_module.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    tips_20ul = protocol.load_labware('opentrons_96_filtertiprack_20ul', 4)

    # Pipette
    multi_channel_pipette = protocol.load_instrument('p20_multi_gen2', 'left', tip_racks=[tips_20ul])

    # Well allocation (multi-channel -> columns)
    number_of_columns = math.ceil(number_of_samples / 8)
    sample_source_wells = sample_plate.columns()[:number_of_columns]
    master_mix_source_wells = master_mix_plate.columns()[:number_of_columns]
    destination_wells = pcr_plate.columns()[:number_of_columns]

    # Liquids
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='PCR samples on the sample temperature module',
        display_color='#FF0000',
    )
    master_mix_liquid = protocol.define_liquid(
        name='Mastermix',
        description='PCR mastermix on the mastermix temperature module',
        display_color='#0000FF',
    )
    # Label every well in the columns used (multi-channel pipette draws from all 8 rows)
    for column in sample_source_wells:
        for well in column:
            well.load_liquid(liquid=sample_liquid, volume=sample_volume_ul * 2)
    for column in master_mix_source_wells:
        for well in column:
            well.load_liquid(liquid=master_mix_liquid, volume=master_mix_volume_ul * 2)

    # P: open thermocycler lid
    thermocycler_module.open_lid()

    # Q: thermocycler block temperature
    thermocycler_module.set_block_temperature(initial_block_temperature_c)

    # R: thermocycler lid temperature
    thermocycler_module.set_lid_temperature(lid_temperature_c)

    # S: sample temperature module
    sample_temperature_module.set_temperature(sample_temperature_c)

    # T: mastermix temperature module
    master_mix_temperature_module.set_temperature(master_mix_temperature_c)

    # U: transfer mastermix, same tip for all transfers
    multi_channel_pipette.transfer(
        master_mix_volume_ul,
        master_mix_source_wells,
        destination_wells,
        new_tip='once'
    )

    # V: transfer samples, mix, blow out in destination well, new tip each transfer
    multi_channel_pipette.transfer(
        sample_volume_ul,
        sample_source_wells,
        destination_wells,
        new_tip='always',
        mix_after=(mixing_cycles, total_mix_volume_ul),
        blow_out=True,
        blowout_location='destination well'
    )

    # W: close thermocycler lid
    thermocycler_module.close_lid()

    # X: 74C for 65 s, 1 cycle
    thermocycler_module.execute_profile(
        steps=[{'temperature': 74, 'hold_time_seconds': 65}],
        repetitions=1,
        block_max_volume=total_mix_volume_ul
    )

    # Y: 13 cycles
    thermocycler_module.execute_profile(
        steps=[
            {'temperature': 60, 'hold_time_seconds': 7},
            {'temperature': 84, 'hold_time_seconds': 19},
            {'temperature': 57, 'hold_time_seconds': 44},
        ],
        repetitions=13,
        block_max_volume=total_mix_volume_ul
    )

    # Z: 75C for 480 s, 1 cycle
    thermocycler_module.execute_profile(
        steps=[{'temperature': 75, 'hold_time_seconds': 480}],
        repetitions=1,
        block_max_volume=total_mix_volume_ul
    )

    # AA: hold block at 4C
    thermocycler_module.set_block_temperature(hold_temperature_c)

    # AB: open thermocycler lid
    thermocycler_module.open_lid()

    # AC, AD: deactivate temperature modules
    master_mix_temperature_module.deactivate()
    sample_temperature_module.deactivate()
