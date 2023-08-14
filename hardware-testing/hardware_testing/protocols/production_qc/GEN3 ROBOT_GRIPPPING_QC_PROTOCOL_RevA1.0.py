# flake8: noqa

from opentrons import protocol_api
from opentrons import types
import random

metadata = {
    'ctxName': 'gripper test',
}
requirements = {
    'robotType': 'OT-3',
    'apiLevel': '2.15'
}

def run(protocol: protocol_api.ProtocolContext):

    # LABWARE
    pcr_plate = protocol.load_labware('armadillo_96_wellplate_200ul_pcr_full_skirt', 4)
    deepwell_plate = protocol.load_labware('nest_96_wellplate_2ml_deep', 7)
    tip_rack = protocol.load_labware('opentrons_96_tiprack_1000ul', 10)


    def move_to_slot(labware, slot, p_x_off=0, p_y_off=0, p_z_off=0, d_x_off=0, d_y_off=0, d_z_off=0):
        protocol.move_labware(
            labware=labware,
            new_location=slot,
            use_gripper=True,
            pick_up_offset={ "x": p_x_off, "y": p_y_off, "z": p_z_off },
            drop_offset={ "x": d_x_off, "y": d_y_off, "z": d_z_off }
        )

    move_to_slot(pcr_plate, 1)
    move_to_slot(pcr_plate, 2)
    move_to_slot(pcr_plate, 3)
    move_to_slot(pcr_plate, 6)
    move_to_slot(pcr_plate, 5)
    move_to_slot(pcr_plate, 8)
    move_to_slot(pcr_plate, 9)
    move_to_slot(pcr_plate, 11)

    move_to_slot(deepwell_plate, 4)
    move_to_slot(deepwell_plate, 1)
    move_to_slot(tip_rack, 7)
    move_to_slot(tip_rack, 4)
    move_to_slot(pcr_plate, 10)
    move_to_slot(pcr_plate, 7)

    move_to_slot(deepwell_plate, 2)
    move_to_slot(deepwell_plate, 3)
    move_to_slot(deepwell_plate, 6)
    move_to_slot(deepwell_plate, 5)
    move_to_slot(deepwell_plate, 8)
    move_to_slot(deepwell_plate, 9)
    move_to_slot(deepwell_plate, 11)
    move_to_slot(deepwell_plate, 10)

    move_to_slot(tip_rack, 1)
    move_to_slot(tip_rack, 2)
    move_to_slot(tip_rack, 3)
    move_to_slot(tip_rack, 6)
    move_to_slot(tip_rack, 5)
    move_to_slot(tip_rack, 8)
    move_to_slot(tip_rack, 9)
    move_to_slot(tip_rack, 11)

    
