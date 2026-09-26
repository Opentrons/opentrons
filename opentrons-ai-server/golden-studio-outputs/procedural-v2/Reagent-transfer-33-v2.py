from opentrons import protocol_api

metadata = {
    'protocolName': 'Reagent-transfer-33-v2',
    'author': 'OpentronsAI',
    'description': "Transfer liquids between reservoir, PCR plate, and heater shaker module's plate.",
    'source': 'OpentronsAI',
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.28'
}


def run(protocol: protocol_api.ProtocolContext):
    # Load trash bin
    trash = protocol.load_trash_bin('A3')

    # Modules
    heater_shaker = protocol.load_module('heaterShakerModuleV1', 'D1')
    heater_shaker_plate = heater_shaker.load_labware('corning_96_wellplate_360ul_flat')

    # Labware
    reservoir = protocol.load_labware('nest_1_reservoir_195ml', 'C1')
    pcr_plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 'D2')

    # Tip racks (all use the Opentrons Flex 96 Tip Rack Adapter)
    tiprack_200 = protocol.load_labware(
        'opentrons_flex_96_tiprack_200ul', 'A2', adapter='opentrons_flex_96_tiprack_adapter'
    )
    tiprack_1000 = protocol.load_labware(
        'opentrons_flex_96_tiprack_1000ul', 'B2', adapter='opentrons_flex_96_tiprack_adapter'
    )
    tiprack_50 = protocol.load_labware(
        'opentrons_flex_96_tiprack_50ul', 'C2', adapter='opentrons_flex_96_tiprack_adapter'
    )

    # Pipette
    pipette = protocol.load_instrument(
        'flex_96channel_1000',
        'left',
        tip_racks=[tiprack_200, tiprack_1000, tiprack_50]
    )

    # Define liquids
    reservoir_liquid = protocol.define_liquid(
        name='Reservoir Reagent',
        description='Reagent transferred from the reservoir to the heater-shaker plate',
        display_color='#33FF33'
    )
    pcr_liquid = protocol.define_liquid(
        name='PCR Plate Reagent',
        description='Reagent transferred from the PCR plate to the heater-shaker plate',
        display_color='#FF0000'
    )

    # Load liquids into their source wells before any pipetting step uses them
    reservoir['A1'].load_liquid(liquid=reservoir_liquid, volume=70)
    pcr_plate['A1'].load_liquid(liquid=pcr_liquid, volume=10)

    # Steps
    # 1. Open the Heater Shaker Module's labware latch
    heater_shaker.open_labware_latch()

    # 2. Pause for user to load the plate
    protocol.comment('Waiting for user to load the Corning 96 well plate onto the Heater-Shaker Module.')
    protocol.pause('Please load the Corning 96 well plate onto the Heater Shaker Module and resume the protocol.')

    # 3. Close the Heater Shaker Module's labware latch
    heater_shaker.close_labware_latch()

    # 4. Transfer 70 µL from reservoir to Heater Shaker plate using 200 µL tips
    protocol.comment('Transferring 70 uL from reservoir (A1) to Heater Shaker plate (A1) using 200 uL tips.')
    pipette.tip_racks = [tiprack_200]
    pipette.transfer(70, reservoir['A1'], heater_shaker_plate['A1'], new_tip='always')

    # 5. Transfer 10 µL from PCR plate to Heater Shaker plate using 50 µL tips
    protocol.comment('Transferring 10 uL from PCR plate (A1) to Heater Shaker plate (A1) using 50 uL tips.')
    pipette.tip_racks = [tiprack_50]
    pipette.transfer(10, pcr_plate['A1'], heater_shaker_plate['A1'], new_tip='always')

    # 6. Shake the plate
    protocol.comment('Shaking the plate at 2000 rpm for 1 minute.')
    heater_shaker.set_and_wait_for_shake_speed(rpm=2000)
    protocol.delay(minutes=1)

    # 7. Deactivate the shaker
    heater_shaker.deactivate_shaker()
