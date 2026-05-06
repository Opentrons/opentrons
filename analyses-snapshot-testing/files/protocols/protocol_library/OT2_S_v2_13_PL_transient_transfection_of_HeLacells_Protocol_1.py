from opentrons import protocol_api
from opentrons import types
import numpy as np
from opentrons.types import Location, Point

# metadata
metadata = {
    'protocolName': 'Transfection using Lipofectamine 3000 Reagent',
    'author': 'Opentrons',
    'description': 'Protocol to transfect HeLa and A549 cells using the OT-2',
    'apiLevel': '2.13'
}
NUM_SAMPLES = 9
# protocol run function
def run(protocol: protocol_api.ProtocolContext):

    def custom_mix1(no_of_mix1, p1000, vol1, well1, top_height1=25):
        for i in range(no_of_mix1):
            p1000.aspirate(vol1, well1.bottom())
            p1000.dispense(vol1, well1.bottom(top_height))


    # labware
    tiprack1 = protocol.load_labware('opentrons_96_tiprack_1000ul', 5)
    falcontubes = protocol.load_labware('opentrons_15_tuberack_falcon_15ml_conical', 7)
    hs_module = protocol.load_module('heaterShakerModuleV1', 1)
    hs_module.close_labware_latch()
    plate1 = hs_module.load_labware('corning_6_wellplate_16.8ml_flat')

    # pipettes
    p1000 = protocol.load_instrument(
        'p1000_single_gen2', mount='left', tip_racks=[tiprack1])
    # p20 = protocol.load_instrument(
    #     'p20_single_gen2', mount='right', tip_racks=[tiprack])


    # commands

    # Seeding HeLa cells for transfection studies
    # (Seeding of Hela cells)--- 0.20 x 106 cells
    # Day 0
    p1000.pick_up_tip()
    p1000.aspirate(870, falcontubes['B1'])
    p1000.dispense(870, plate1['A1'].top(4))
    p1000.aspirate(870, falcontubes['B1'])
    p1000.dispense(870, plate1['A1'].top(4))
    p1000.drop_tip()

    hs_module.close_labware_latch()
    hs_module.set_and_wait_for_shake_speed(200)
    protocol.delay(minutes=0.4)
    hs_module.deactivate_shaker()

    p1000.pick_up_tip()
    p1000.aspirate(870, falcontubes['B2'])
    p1000.dispense(870, plate1['A2'].top(4))
    p1000.aspirate(870, falcontubes['B2'])
    p1000.dispense(870, plate1['A2'].top(4))
    p1000.drop_tip()

    hs_module.close_labware_latch()
    hs_module.set_and_wait_for_shake_speed(200)
    protocol.delay(minutes=0.4)
    hs_module.deactivate_shaker()

    p1000.pick_up_tip()
    p1000.aspirate(870, falcontubes['B3'])
    p1000.dispense(870, plate1['A3'].top(4))
    p1000.aspirate(870, falcontubes['B3'])
    p1000.dispense(870, plate1['A3'].top(4))
    p1000.drop_tip()

    hs_module.close_labware_latch()
    hs_module.set_and_wait_for_shake_speed(200)
    protocol.delay(minutes=0.4)
    hs_module.deactivate_shaker()

    p1000.pick_up_tip()
    p1000.aspirate(870, falcontubes['B4'])
    p1000.dispense(870, plate1['B1'])
    p1000.aspirate(870, falcontubes['B4'])
    p1000.dispense(870, plate1['B1'].top(4))
    p1000.drop_tip()

    hs_module.close_labware_latch()
    hs_module.set_and_wait_for_shake_speed(200)
    protocol.delay(minutes=0.4)
    hs_module.deactivate_shaker()

    p1000.pick_up_tip()
    p1000.aspirate(870, falcontubes['B5'])
    p1000.dispense(870, plate1['B2'])
    p1000.aspirate(870, falcontubes['B5'])
    p1000.dispense(870, plate1['B2'].top(4))
    p1000.drop_tip()

    hs_module.close_labware_latch()
    hs_module.set_and_wait_for_shake_speed(200)
    protocol.delay(minutes=0.4)
    hs_module.deactivate_shaker()

    p1000.pick_up_tip()
    p1000.aspirate(870, falcontubes['C1'])
    p1000.dispense(870, plate1['B3'])
    p1000.aspirate(870, falcontubes['C1'])
    p1000.dispense(870, plate1['B3'].top(4))
    p1000.drop_tip()

    hs_module.close_labware_latch()
    hs_module.set_and_wait_for_shake_speed(200)
    protocol.delay(minutes=0.4)
    hs_module.deactivate_shaker()

    