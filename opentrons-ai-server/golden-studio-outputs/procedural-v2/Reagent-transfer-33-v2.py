from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-33-v2',
    'author': 'OpentronsAI',
    'description': "Transfer liquids between reservoir, PCR plate, and heater shaker module's plate.",
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28',
}


def run(protocol: protocol_api.ProtocolContext):
    # Trash
    trash = protocol.load_trash_bin('A3')

    # Modules
    heater_shaker = protocol.load_module('heaterShakerModuleV1', 'D1')

    # Labware
    heater_shaker_plate = heater_shaker.load_labware('corning_96_wellplate_360ul_flat')
    reservoir = protocol.load_labware('nest_1_reservoir_195ml', 'C1')
    pcr_plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 'D2')

    tiprack_200 = protocol.load_labware(
        'opentrons_flex_96_tiprack_200ul', 'A2',
        adapter='opentrons_flex_96_tiprack_adapter')
    tiprack_1000 = protocol.load_labware(
        'opentrons_flex_96_tiprack_1000ul', 'B2',
        adapter='opentrons_flex_96_tiprack_adapter')
    tiprack_50 = protocol.load_labware(
        'opentrons_flex_96_tiprack_50ul', 'C2',
        adapter='opentrons_flex_96_tiprack_adapter')

    # Pipette (96-channel occupies both mounts)
    pipette = protocol.load_instrument('flex_96channel_1000')

    # Liquids
    reagent = protocol.define_liquid(
        name='Reagent',
        description='Reagent in the 1-well reservoir',
        display_color='#00AAFF',
    )
    sample = protocol.define_liquid(
        name='Sample',
        description='Sample in the PCR plate',
        display_color='#FF5500',
    )
    reservoir['A1'].load_liquid(liquid=reagent, volume=10000)
    for well in pcr_plate.wells():
        well.load_liquid(liquid=sample, volume=50)

    # Steps M-O: load the Heater-Shaker plate
    protocol.comment('Opening Heater-Shaker labware latch')
    heater_shaker.open_labware_latch()
    protocol.pause('Please load the Corning 96 well plate onto the Heater-Shaker, then resume the protocol.')
    protocol.comment('Closing Heater-Shaker labware latch')
    heater_shaker.close_labware_latch()

    # Step P: 70 uL reservoir -> Heater-Shaker plate with 200 uL tips
    protocol.comment('Transferring 70 uL from reservoir to Heater-Shaker plate (200 uL tips)')
    pipette.configure_nozzle_layout(style=protocol_api.ALL, tip_racks=[tiprack_200])
    pipette.transfer(70, reservoir['A1'], heater_shaker_plate['A1'], new_tip='always')

    # Step Q: 10 uL PCR plate -> Heater-Shaker plate with 50 uL tips
    protocol.comment('Transferring 10 uL from PCR plate to Heater-Shaker plate (50 uL tips)')
    pipette.configure_nozzle_layout(style=protocol_api.ALL, tip_racks=[tiprack_50])
    pipette.transfer(10, pcr_plate['A1'], heater_shaker_plate['A1'], new_tip='always')

    # Steps R-S: shake and deactivate
    protocol.comment('Shaking at 2000 rpm for 1 minute')
    heater_shaker.set_and_wait_for_shake_speed(rpm=2000)
    protocol.delay(minutes=1)
    heater_shaker.deactivate_shaker()
    protocol.comment('Protocol complete')
