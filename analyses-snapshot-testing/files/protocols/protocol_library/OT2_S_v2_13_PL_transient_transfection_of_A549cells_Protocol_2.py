from opentrons import protocol_api
from opentrons import types
import numpy as np
from opentrons.types import Location, Point

# metadata
metadata = {
    'protocolName': 'Transfection using Lipofectamine 3000 and Fugene HD Reagent',
    'author': 'Opentrons',
    'description': 'Protocol to transfect A549 cells using the OT-2',
    'apiLevel': '2.13'
}
NUM_SAMPLES = 6
# protocol run function
def run(protocol: protocol_api.ProtocolContext):

    def custom_mix(no_of_mix, p1000, vol, well, top_height=25):
        for i in range(no_of_mix):
            p1000.aspirate(vol, well.bottom())
            p1000.dispense(vol, well.bottom(top_height))

    # labware
    tiprack = protocol.load_labware('opentrons_96_filtertiprack_20ul', 11)
    tiprack.set_offset(x=-0.20, y=0.00, z=-0.00)
    tiprack1 = protocol.load_labware('opentrons_96_tiprack_1000ul', 5)
    tiprack1.set_offset(x=-0.70, y=1.30, z=-0.80)
    tubes = protocol.load_labware('opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 7)
    falcontubes = protocol.load_labware('opentrons_15_tuberack_nest_15ml_conical', 9)
    hs_module = protocol.load_module('heaterShakerModuleV1', 1)
    hs_module.close_labware_latch()
    plate1 = hs_module.load_labware('corning_6_wellplate_16.8ml_flat')
    plate1.set_offset(x=0.00, y=0.00, z=-2.70)
    #plate2 = hs_module.load_labware('corning_6_wellplate_16.8ml_flat')
    #plate2.set_offset(x=0.00, y=0.00, z=-2.70)

    # pipettes
    p1000 = protocol.load_instrument(
        'p1000_single_gen2', mount='left', tip_racks=[tiprack1])
    p20 = protocol.load_instrument(
        'p20_single_gen2', mount='right', tip_racks=[tiprack])

    # commands

    # Transfection protocol using Lipofectamine 3000 and FugeneHD (after 24 hours of plating)

    # Removing complete medium from cells, add OptiMEM(manually)

    # Preparing the DNA-lipofectamine mix
    # Addition of OptiMEM to tubes

    p1000.pick_up_tip()
    p1000.aspirate(375, falcontubes['A1'])
    p1000.dispense(375, tubes['B1'])
    p1000.aspirate(375, falcontubes['A1'])
    p1000.dispense(375, tubes['B2'])
    p1000.aspirate(375, falcontubes['A1'])
    p1000.dispense(375, tubes['B3'])
    p1000.aspirate(375, falcontubes['A1'])
    p1000.dispense(375, tubes['B4'])
    p1000.aspirate(870, falcontubes['A2'])
    p1000.dispense(870, tubes['B5'])
    p1000.aspirate(870, falcontubes['A3'])
    p1000.dispense(870, tubes['B6'])
    p1000.drop_tip()

    # Addition of DNA to tubes no. B1,B3,B5,B6

    p20.pick_up_tip()
    p20.aspirate(3.375, tubes['D1'])
    p20.dispense(3.375, tubes['B1'])
    p20.drop_tip()
    p1000.pick_up_tip()
    custom_mix(2, p1000, 300, tubes['B1'])
    p1000.drop_tip()

    p20.pick_up_tip()
    p20.aspirate(5.92, tubes['D1'])
    p20.dispense(5.92, tubes['B3'])
    p20.drop_tip()
    p1000.pick_up_tip()
    custom_mix(2, p1000, 300, tubes['B3'])
    p1000.drop_tip()

    p20.pick_up_tip()
    p20.aspirate(3.375, tubes['D1'])
    p20.dispense(3.375, tubes['B5'])
    p20.drop_tip()
    p1000.pick_up_tip()
    custom_mix(2, p1000, 800, tubes['B5'])
    p1000.drop_tip()

    p20.pick_up_tip()
    p20.aspirate(5.92, tubes['D1'])
    p20.dispense(5.92, tubes['B6'])
    p20.drop_tip()
    p1000.pick_up_tip()
    custom_mix(2, p1000, 800, tubes['B6'])
    p1000.drop_tip()

    # Addition of P-3000 to tubes no. B1 and B3

    p20.pick_up_tip()
    p20.aspirate(12, tubes['A5'])
    p20.dispense(12, tubes['B1'])
    p20.drop_tip()
    p1000.pick_up_tip()
    custom_mix(2, p1000, 300, tubes['B1'])
    p1000.drop_tip()

    p20.pick_up_tip()
    p20.aspirate(11, tubes['A5'])
    p20.dispense(11, tubes['B3'])
    p20.aspirate(10, tubes['A5'])
    p20.dispense(10, tubes['B3'])
    p20.drop_tip()
    p1000.pick_up_tip()
    custom_mix(2, p1000, 300, tubes['B3'])
    p1000.drop_tip()
 
    # Addition of Lipofectamine3000

    p20.pick_up_tip()
    p20.aspirate(18, tubes['A4'])
    p20.dispense(18, tubes['B2'])
    p20.drop_tip()
    p1000.pick_up_tip()
    custom_mix(2, p1000, 200, tubes['B2'])
    p1000.drop_tip()

    p20.pick_up_tip()
    p20.aspirate(15.75, tubes['A4'])
    p20.dispense(15.75, tubes['B4'])
    p20.aspirate(15.75, tubes['A4'])
    p20.dispense(15.75, tubes['B4'])
    p20.drop_tip()
    p1000.pick_up_tip()
    custom_mix(2, p1000, 200, tubes['B4'])
    p1000.drop_tip()

    # Addition of contents of tube B1 to B2 and B3 to B4 ( DNA-Lipofectamine3000 complex formation)

    p1000.pick_up_tip()
    p1000.aspirate(375, tubes['B1'])
    p1000.dispense(375, tubes['B2'])
    custom_mix(2, p1000, 200, tubes['B2'])
    p1000.drop_tip()
    p1000.pick_up_tip()
    p1000.aspirate(380, tubes['B3'])
    p1000.dispense(380, tubes['B4'])
    custom_mix(2, p1000, 200, tubes['B4'])
    p1000.drop_tip()

    # Addition of FugeneHD to tubes B5 and B6

    p20.pick_up_tip()
    p20.aspirate(18, tubes['A6'])
    p20.dispense(18, tubes['B5'])
    p20.drop_tip()
    p1000.pick_up_tip()
    custom_mix(2, p1000, 500, tubes['B5'])
    p1000.drop_tip()

    p20.pick_up_tip()
    p20.aspirate(15.75, tubes['A6'])
    p20.dispense(15.75, tubes['B6'])
    p20.aspirate(15.75, tubes['A6'])
    p20.dispense(15.75, tubes['B6'])
    p20.drop_tip()
    p1000.pick_up_tip()
    custom_mix(2, p1000, 500, tubes['B6'])
    p1000.drop_tip()

    # Incubate for complexes for 10-15 min at RT

    # pause protocol for 15 min-------Incubate

    protocol.delay(minutes=12)

    # Addition of DNA-lipid complexes to cells
    p1000.pick_up_tip()
    p1000.aspirate(245, tubes['B2'])
    p1000.dispense(245, plate1['A1'].top(5))
    p1000.aspirate(245, tubes['B2'])
    p1000.dispense(245, plate1['A2'].top(5))
    p1000.aspirate(245, tubes['B2'])
    p1000.dispense(245, plate1['A3'].top(5))
    p1000.drop_tip()

    hs_module.close_labware_latch()
    hs_module.set_and_wait_for_shake_speed(200)
    protocol.delay(minutes=0.4)
    hs_module.deactivate_shaker()

    p1000.pick_up_tip()
    p1000.aspirate(245, tubes['B4'])
    p1000.dispense(245, plate1['B1'].top(5))
    p1000.aspirate(245, tubes['B4'])
    p1000.dispense(245, plate1['B2'].top(5))
    p1000.aspirate(245, tubes['B4'])
    p1000.dispense(245, plate1['B3'].top(5))
    p1000.drop_tip()

    hs_module.close_labware_latch()
    hs_module.set_and_wait_for_shake_speed(200)
    protocol.delay(minutes=0.4)
    hs_module.deactivate_shaker()
    
    # Open labware latch of the Heater-Shaker Module
    hs_module.open_labware_latch()
    protocol.delay(minutes=3.0)
    hs_module.close_labware_latch()

    # Addition of DNA-Fugene complexes to cells
    p1000.pick_up_tip()
    p1000.aspirate(290, tubes['B5'])
    p1000.dispense(290, plate1['A1'].top(5))
    p1000.aspirate(290, tubes['B5'])
    p1000.dispense(290, plate1['A2'].top(5))
    p1000.aspirate(290, tubes['B5'])
    p1000.dispense(290, plate1['A3'].top(5))
    p1000.drop_tip()

    hs_module.close_labware_latch()
    hs_module.set_and_wait_for_shake_speed(200)
    protocol.delay(minutes=0.4)
    hs_module.deactivate_shaker()

    p1000.pick_up_tip()
    p1000.aspirate(290, tubes['B6'])
    p1000.dispense(290, plate1['B1'].top(5))
    p1000.aspirate(290, tubes['B6'])
    p1000.dispense(290, plate1['B2'].top(5))
    p1000.aspirate(290, tubes['B6'])
    p1000.dispense(290, plate1['B3'].top(5))
    p1000.drop_tip()

    hs_module.close_labware_latch()
    hs_module.set_and_wait_for_shake_speed(200)
    protocol.delay(minutes=0.4)
    hs_module.deactivate_shaker()
