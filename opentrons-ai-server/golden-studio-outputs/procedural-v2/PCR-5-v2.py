from opentrons import protocol_api

metadata = {
    'protocolName': 'PCR-5-v2',
    'author': 'Bob',
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28'
}


def run(protocol: protocol_api.ProtocolContext):
    # Sample parameters
    sample_volume_ul = 20
    master_mix_volume_ul = 20
    mix_cycles = 5
    total_mix_volume_ul = sample_volume_ul + master_mix_volume_ul  # 40 uL
    return_slot = 'C3'

    master_mix_temperature_c = 10
    sample_temperature_c = 37
    step1_cycles = 1
    step2_cycles = 25
    step3_cycles = 1

    # Thermocycler parameters
    lid_temperature_c = 95
    initial_block_temperature_c = 22
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
    destination_plate = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'C3')

    tips_50ul = [
        protocol.load_labware(
            'opentrons_flex_96_filtertiprack_50ul',
            slot,
            adapter="opentrons_flex_96_tiprack_adapter"
        )
        for slot in ['A2', 'B2', 'C2']
    ]

    # Pipette
    pipette_96channel = protocol.load_instrument('flex_96channel_1000', 'left', tip_racks=tips_50ul)

    # Trash bin
    trash = protocol.load_trash_bin('A3')

    # Well allocation
    sample_source_wells = sample_plate['A1']
    destination_wells = destination_plate['A1']
    master_mix_source_well = master_mix_plate['A1']

    # Define liquids
    sample_liquid = protocol.define_liquid(
        name='Sample',
        description='DNA sample for PCR',
        display_color='#FF0000'
    )
    mastermix_liquid = protocol.define_liquid(
        name='Mastermix',
        description='PCR mastermix reagent',
        display_color='#33FF33'
    )

    # Assign liquids to wells
    sample_source_wells.load_liquid(liquid=sample_liquid, volume=sample_volume_ul)
    master_mix_source_well.load_liquid(liquid=mastermix_liquid, volume=master_mix_volume_ul)

    # Set thermocycler block and lid temperature
    thermocycler_module.set_block_temperature(initial_block_temperature_c)
    thermocycler_module.open_lid()
    thermocycler_module.set_lid_temperature(lid_temperature_c)

    # Temperature module setup
    sample_temperature_module.set_temperature(sample_temperature_c)
    master_mix_temperature_module.set_temperature(master_mix_temperature_c)

    # Master mix transfer
    pipette_96channel.transfer(
        master_mix_volume_ul,
        master_mix_source_well.top(-5),
        destination_wells.bottom(2),
        new_tip='once'
    )

    # Sample transfer
    pipette_96channel.pick_up_tip()
    pipette_96channel.aspirate(sample_volume_ul, sample_source_wells.bottom(3), rate=0.5)
    pipette_96channel.dispense(sample_volume_ul, destination_wells.top(-7), rate=0.5)
    pipette_96channel.mix(mix_cycles, total_mix_volume_ul)
    pipette_96channel.move_to(destination_wells.top(), speed=5)
    pipette_96channel.drop_tip()

    # Moving the plate to the thermocycler
    protocol.move_labware(destination_plate, thermocycler_module, use_gripper=True)

    # PCR cycling
    thermocycler_module.close_lid()
    thermocycler_module.execute_profile(
        steps=[
            {'temperature': 74, 'hold_time_seconds': 65}
        ],
        repetitions=step1_cycles,
        block_max_volume=total_mix_volume_ul
    )

    thermocycler_module.execute_profile(
        steps=[
            {'temperature': 60, 'hold_time_seconds': 7},
            {'temperature': 84, 'hold_time_seconds': 19},
            {'temperature': 57, 'hold_time_seconds': 44}
        ],
        repetitions=step2_cycles,
        block_max_volume=total_mix_volume_ul
    )

    thermocycler_module.execute_profile(
        steps=[{'temperature': 75, 'hold_time_seconds': 480}],
        repetitions=step3_cycles,
        block_max_volume=total_mix_volume_ul
    )

    thermocycler_module.set_block_temperature(final_hold_temperature_c)
    thermocycler_module.open_lid()

    # Moving the plate back to its original location
    protocol.move_labware(destination_plate, return_slot, use_gripper=True)

    # Pause for manual intervention
    protocol.pause("Pick up the destination plate, seal it, and refrigerate at 4C.")

    # Deactivate temperature modules at the end of the protocol
    sample_temperature_module.deactivate()
    master_mix_temperature_module.deactivate()
