# flake8: noqa

from opentrons import protocol_api
from opentrons import types
import random

metadata = {
    'ctxName': 'QC_Protocol',
    'author': 'Jon Klar <jonathan.klar@opentrons.com',
}
requirements = {
    'robotType': 'OT-3',
    'apiLevel': '2.15'
}




def run(protocol: protocol_api.ProtocolContext):



    # DECK SETUP AND LABWARE
    pcr_plate = protocol.load_labware('armadillo_96_wellplate_200ul_pcr_full_skirt', 1)
    plate_396_1 = protocol.load_labware('biorad_384_wellplate_50ul', 3)
    plate_396_2 = protocol.load_labware('biorad_384_wellplate_50ul', 10)
    reservoir = protocol.load_labware('nest_12_reservoir_15ml', 7)
    tiprack_50 = protocol.load_labware('opentrons_ot3_96_tiprack_50ul',  '5')
    tiprack_200 = protocol.load_labware('opentrons_ot3_96_tiprack_200ul', '8')
    tiprack_1000 = protocol.load_labware('opentrons_ot3_96_tiprack_1000ul', '11')

    # LOAD PIPETTES
    p1000 = protocol.load_instrument("p1000_single_gen3", "left", tip_racks=[tiprack_1000, tiprack_200, tiprack_50])
    m50 = protocol.load_instrument("p1000_multi_gen3", "right", tip_racks=[tiprack_1000, tiprack_200, tiprack_50])

    # COMMANDS
    m50.pick_up_tip(tiprack_1000.wells_by_name()['A1'])
    m50.aspirate(50, reservoir.wells_by_name()['A1'])
    m50.dispense(50, pcr_plate.wells_by_name()['A1'])
    m50.drop_tip()
    m50.pick_up_tip(tiprack_1000.wells_by_name()['A2'])
    m50.aspirate(50, reservoir.wells_by_name()['A2'])
    m50.dispense(50, pcr_plate.wells_by_name()['A2'])
    m50.drop_tip()
    m50.pick_up_tip(tiprack_1000.wells_by_name()['A3'])
    m50.aspirate(50, reservoir.wells_by_name()['A3'])
    m50.dispense(50, pcr_plate.wells_by_name()['A3'])
    m50.drop_tip()

    m50.pick_up_tip(tiprack_200.wells_by_name()['A1'])
    m50.aspirate(50, reservoir.wells_by_name()['A4'])
    m50.dispense(50, pcr_plate.wells_by_name()['A4'])
    m50.drop_tip()
    m50.pick_up_tip(tiprack_200.wells_by_name()['A2'])
    m50.aspirate(50, reservoir.wells_by_name()['A5'])
    m50.dispense(50, pcr_plate.wells_by_name()['A5'])
    m50.drop_tip()
    m50.pick_up_tip(tiprack_200.wells_by_name()['A3'])
    m50.aspirate(50, reservoir.wells_by_name()['A6'])
    m50.dispense(50, pcr_plate.wells_by_name()['A6'])
    m50.drop_tip()

    m50.pick_up_tip(tiprack_50.wells_by_name()['A1'])
    m50.aspirate(25, reservoir.wells_by_name()['A7'])
    m50.dispense(25, pcr_plate.wells_by_name()['A7'])
    m50.drop_tip()
    m50.pick_up_tip(tiprack_50.wells_by_name()['A2'])
    m50.aspirate(25, reservoir.wells_by_name()['A8'])
    m50.dispense(25, pcr_plate.wells_by_name()['A8'])
    m50.drop_tip()
    m50.pick_up_tip(tiprack_50.wells_by_name()['A3'])
    m50.aspirate(25, reservoir.wells_by_name()['A9'])
    m50.dispense(25, pcr_plate.wells_by_name()['A9'])
    m50.drop_tip()

    p1000.pick_up_tip(tiprack_1000.wells_by_name()['A4'])
    p1000.aspirate(100, reservoir.wells_by_name()['A10'])
    p1000.dispense(100, pcr_plate.wells_by_name()['A10'])
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_1000.wells_by_name()['B4'])
    p1000.aspirate(100, reservoir.wells_by_name()['A10'])
    p1000.dispense(100, pcr_plate.wells_by_name()['B10'])
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_1000.wells_by_name()['C4'])
    p1000.aspirate(100, reservoir.wells_by_name()['A10'])
    p1000.dispense(100, pcr_plate.wells_by_name()['C10'])
    p1000.drop_tip()
    
    p1000.pick_up_tip(tiprack_200.wells_by_name()['A4'])
    p1000.aspirate(100, reservoir.wells_by_name()['A11'])
    p1000.dispense(100, pcr_plate.wells_by_name()['A11'])
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_200.wells_by_name()['B4'])
    p1000.aspirate(100, reservoir.wells_by_name()['A11'])
    p1000.dispense(100, pcr_plate.wells_by_name()['B11'])
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_200.wells_by_name()['C4'])
    p1000.aspirate(100, reservoir.wells_by_name()['A11'])
    p1000.dispense(100, pcr_plate.wells_by_name()['C11'])
    p1000.drop_tip()

    p1000.pick_up_tip(tiprack_50.wells_by_name()['A4'])
    p1000.aspirate(50, reservoir.wells_by_name()['A12'])
    p1000.dispense(50, pcr_plate.wells_by_name()['A12'])
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_50.wells_by_name()['B4'])
    p1000.aspirate(50, reservoir.wells_by_name()['A12'])
    p1000.dispense(50, pcr_plate.wells_by_name()['B12'])
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_50.wells_by_name()['C4'])
    p1000.aspirate(50, reservoir.wells_by_name()['A12'])
    p1000.dispense(50, pcr_plate.wells_by_name()['C12'])
    p1000.drop_tip()

    m50.pick_up_tip(tiprack_200.wells_by_name()['A5'])
    m50.aspirate(50, reservoir.wells_by_name()['A1'])
    m50.dispense(50, plate_396_1.wells_by_name()['A1'])
    m50.drop_tip()
    m50.pick_up_tip(tiprack_50.wells_by_name()['A5'])
    m50.aspirate(25, reservoir.wells_by_name()['A1'])
    m50.dispense(25, plate_396_1.wells_by_name()['B1'])
    m50.drop_tip()
    m50.pick_up_tip(tiprack_200.wells_by_name()['A6'])
    m50.aspirate(50, reservoir.wells_by_name()['A1'])
    m50.dispense(50, plate_396_1.wells_by_name()['A24'])
    m50.drop_tip()
    m50.pick_up_tip(tiprack_50.wells_by_name()['A6'])
    m50.aspirate(25, reservoir.wells_by_name()['A1'])
    m50.dispense(25, plate_396_1.wells_by_name()['B24'])
    m50.drop_tip()
    
    m50.pick_up_tip(tiprack_200.wells_by_name()['A7'])
    m50.aspirate(50, reservoir.wells_by_name()['A2'])
    m50.dispense(50, plate_396_2.wells_by_name()['A1'])
    m50.drop_tip()
    m50.pick_up_tip(tiprack_50.wells_by_name()['A7'])
    m50.aspirate(25, reservoir.wells_by_name()['A2'])
    m50.dispense(25, plate_396_2.wells_by_name()['B1'])
    m50.drop_tip()
    m50.pick_up_tip(tiprack_200.wells_by_name()['A8'])
    m50.aspirate(50, reservoir.wells_by_name()['A2'])
    m50.dispense(50, plate_396_2.wells_by_name()['A24'])
    m50.drop_tip()
    m50.pick_up_tip(tiprack_50.wells_by_name()['A8'])
    m50.aspirate(25, reservoir.wells_by_name()['A2'])
    m50.dispense(25, plate_396_2.wells_by_name()['B24'])
    m50.drop_tip()
    
    p1000.pick_up_tip(tiprack_200.wells_by_name()['D4'])
    p1000.aspirate(50, reservoir.wells_by_name()['A12'])
    p1000.dispense(50, plate_396_1.wells_by_name()['H2'])
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_50.wells_by_name()['D4'])
    p1000.aspirate(25, reservoir.wells_by_name()['A12'])
    p1000.dispense(25, plate_396_1.wells_by_name()['I2'])
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_200.wells_by_name()['E4'])
    p1000.aspirate(50, reservoir.wells_by_name()['A12'])
    p1000.dispense(50, plate_396_1.wells_by_name()['H23'])
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_50.wells_by_name()['E4'])
    p1000.aspirate(25, reservoir.wells_by_name()['A12'])
    p1000.dispense(25, plate_396_1.wells_by_name()['I23'])
    p1000.drop_tip()

    p1000.pick_up_tip(tiprack_200.wells_by_name()['F4'])
    p1000.aspirate(50, reservoir.wells_by_name()['A12'])
    p1000.dispense(50, plate_396_2.wells_by_name()['H2'])
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_50.wells_by_name()['F4'])
    p1000.aspirate(25, reservoir.wells_by_name()['A12'])
    p1000.dispense(25, plate_396_2.wells_by_name()['I2'])
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_200.wells_by_name()['G4'])
    p1000.aspirate(50, reservoir.wells_by_name()['A12'])
    p1000.dispense(50, plate_396_2.wells_by_name()['H23'])
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_50.wells_by_name()['G4'])
    p1000.aspirate(25, reservoir.wells_by_name()['A12'])
    p1000.dispense(25, plate_396_2.wells_by_name()['I23'])
    p1000.drop_tip()

