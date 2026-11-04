from opentrons import protocol_api

metadata = {
    'protocolName': 'PCR-5-v2',
    'author': 'OpentronsAI',
    'description': 'PCR amplification on Flex with 96-channel pipette, thermocycler, and two temperature modules (25 cycles).',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Parameters
    sample_volume_ul = 20
    master_mix_volume_ul = 20
    mix_cycles = 5
    total_mix_volume_ul = sample_volume_ul + master_mix_volume_ul
    return_slot = 'C3'

    sample_temperature_c = 37
    master_mix_temperature_c = 10
    initial_block_temperature_c = 22
    lid_temperature_c = 95
    final_hold_temperature_c = 4

    # Modules
    thermocycler_module = protocol.load_module('thermocyclerModuleV2')  # occupies A1+B1
    sample_temperature_module = protocol.load_module('temperature module gen2', 'D1')
    master_mix_temperature_module = protocol.load_module('temperature module gen2', 'D3')

    # Adapters
    sample_adapter = sample_temperature_module.load_adapter('opentrons_96_well_aluminum_block')
    master_mix_adapter = master_mix_temperature_module.load_adapter('opentrons_96_well_aluminum_block')

    # Labware
    sample_plate = sample_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    master_mix_plate = master_mix_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    destination_plate = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'C3')
    tips_50ul = [
        protocol.load_labware(
            'opentrons_flex_96_filtertiprack_50ul',
            slot,
            adapter='opentrons_flex_96_tiprack_adapter'
        )
        for slot in ['A2', 'B2', 'C2']
    ]

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Pipette (96-channel occupies both mounts)
    pipette_96channel = protocol.load_instrument('flex_96channel_1000', tip_racks=tips_50ul)

    # Well allocation
    sample_source_well = sample_plate['A1']
    master_mix_source_well = master_mix_plate['A1']
    destination_well = destination_plate['A1']

    # Liquids
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='DNA/RNA sample in source plate',
        display_color='#FF5733',
    )
    master_mix_liquid = protocol.define_liquid(
        name='Mastermix',
        description='PCR mastermix in mastermix plate',
        display_color='#33A1FF',
    )
    for well in sample_plate.wells():
        well.load_liquid(liquid=sample_liquid, volume=sample_volume_ul + 10)
    for well in master_mix_plate.wells():
        well.load_liquid(liquid=master_mix_liquid, volume=master_mix_volume_ul + 10)

    # Q. Thermocycler block temperature
    thermocycler_module.set_block_temperature(initial_block_temperature_c)
    # R. Open thermocycler lid
    thermocycler_module.open_lid()
    # S. Thermocycler lid temperature
    thermocycler_module.set_lid_temperature(lid_temperature_c)

    # T. Sample temperature module
    sample_temperature_module.set_temperature(sample_temperature_c)
    # U. Mastermix temperature module
    master_mix_temperature_module.set_temperature(master_mix_temperature_c)

    # V. Mastermix transfer: 5 mm below top of source -> 2 mm above bottom of destination
    pipette_96channel.transfer(
        master_mix_volume_ul,
        master_mix_source_well.top(-5),
        destination_well.bottom(2),
        new_tip='once'
    )

    # W. Sample transfer at half flow rate, mix, slow retract
    pipette_96channel.pick_up_tip()
    pipette_96channel.aspirate(sample_volume_ul, sample_source_well.bottom(3), rate=0.5)
    pipette_96channel.dispense(sample_volume_ul, destination_well.top(-7), rate=0.5)
    pipette_96channel.mix(mix_cycles, total_mix_volume_ul, destination_well)
    pipette_96channel.move_to(destination_well.top(), speed=5)
    pipette_96channel.drop_tip()

    # X. Move destination plate into thermocycler
    protocol.move_labware(destination_plate, thermocycler_module, use_gripper=True)

    # Y. Close lid
    thermocycler_module.close_lid()

    # Z. 74 C for 65 s, 1 cycle
    thermocycler_module.execute_profile(
        steps=[{'temperature': 74, 'hold_time_seconds': 65}],
        repetitions=1,
        block_max_volume=total_mix_volume_ul
    )

    # AA. 25 cycles
    thermocycler_module.execute_profile(
        steps=[
            {'temperature': 60, 'hold_time_seconds': 7},
            {'temperature': 84, 'hold_time_seconds': 19},
            {'temperature': 57, 'hold_time_seconds': 44},
        ],
        repetitions=25,
        block_max_volume=total_mix_volume_ul
    )

    # AB. 75 C for 480 s, 1 cycle
    thermocycler_module.execute_profile(
        steps=[{'temperature': 75, 'hold_time_seconds': 480}],
        repetitions=1,
        block_max_volume=total_mix_volume_ul
    )

    # AC. Hold block at 4 C
    thermocycler_module.set_block_temperature(final_hold_temperature_c, block_max_volume=total_mix_volume_ul)

    # AD. Open lid
    thermocycler_module.open_lid()

    # AE. Move plate back to C3
    protocol.move_labware(destination_plate, return_slot, use_gripper=True)

    # AF. Pause for user
    protocol.pause('Pick up the destination plate, seal it, and refrigerate it at 4 C.')

    # AG/AH. Deactivate temperature modules
    sample_temperature_module.deactivate()
    master_mix_temperature_module.deactivate()
