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

    RUN_COUNT = 1
    # MODULES
    temp_mod = protocol.load_module('temperature module gen2', '3')
    # temp_mod.load_labware("Opentrons 96 PCR Adapter")
    thermocycler = protocol.load_module('thermocycler module gen2')
    heater_shaker = protocol.load_module('heaterShakerModuleV1', '1')
    # heater_shaker.load_labware("Opentrons 96 PCR Adapter")
    mag_block = protocol.load_module('magneticBlockV1', '2')
    
    #These are z-axis offsets in addition to whatever is default for these modules
    TC_HEIGHT = 3
    HS_HEIGHT = 5
    MAG_HEIGHT = 0
    TMOD_HEIGHT = 5
    
    
    SLOT_LIST = [5, mag_block, temp_mod, heater_shaker]
    HEAT_DELAY = 0 #Time to wait on heated element in seconds
    HEAT_TEMP = 95 #Temperature to set heated elements in degrees Celsius

    # LABWARE
    pcr_plate = protocol.load_labware('armadillo_96_wellplate_200ul_pcr_full_skirt', 5)
    deepwell_plate = protocol.load_labware('nest_96_wellplate_2ml_deep', 6)
    tip_rack = protocol.load_labware('opentrons_96_tiprack_1000ul', 9)



    def dropoff_z_offset(slot):
        if slot is mag_block:
            return MAG_HEIGHT
        elif slot is thermocycler:
            return TC_HEIGHT
        elif slot is temp_mod:
            return TMOD_HEIGHT
        elif slot is heater_shaker:
            return HS_HEIGHT
        else:
            return 0
        
    def pickup_z_offset(labware):
        if isinstance(labware.parent, protocol_api.module_contexts.MagneticBlockContext):
            return MAG_HEIGHT
        elif isinstance(labware.parent, protocol_api.module_contexts.ThermocyclerContext):
            return TC_HEIGHT
        elif isinstance(labware.parent, protocol_api.module_contexts.TemperatureModuleContext):
            return TMOD_HEIGHT
        elif isinstance(labware.parent, protocol_api.module_contexts.HeaterShakerContext):
            return HS_HEIGHT
        else:
            return 0

    def move_to_slot(labware, slot, p_x_off=0, p_y_off=0, p_z_off=None, d_x_off=0, d_y_off=0, d_z_off=None):
        protocol.move_labware(
            labware=labware,
            new_location=slot,
            use_gripper=True,
            pick_up_offset={"x": p_x_off, "y": p_y_off, "z": (p_z_off or pickup_z_offset(labware))},
            drop_offset={"x": d_x_off, "y": d_y_off, "z": (d_z_off or dropoff_z_offset(slot=slot))}
        )

    def to_all_from_slot_and_back(labware, i=0):
        for x in SLOT_LIST[i+1:]:
            move_to_slot(labware, x)
            if x is heater_shaker:
                heater_shaker.close_labware_latch()
                protocol.delay(seconds=HEAT_DELAY)
                heater_shaker.open_labware_latch()
            elif x is temp_mod:
                protocol.delay(seconds=HEAT_DELAY)
            move_to_slot(labware, SLOT_LIST[i])
    
    def from_all_to_all(labware):
        to_all_from_slot_and_back(labware)
        i = 1
        for y in SLOT_LIST[1:]:
            move_to_slot(labware, y)
            to_all_from_slot_and_back(labware, i)
            i += 1
        move_to_slot(labware, temp_mod)






    # # OPEN/CLOSE THERMOCYCLER
    thermocycler.open_lid()
    heater_shaker.open_labware_latch()
    # heater_shaker.set_and_wait_for_temperature(celsius=HEAT_TEMP)
    # temp_mod.set_temperature(celsius=HEAT_TEMP)
    # thermocycler.set_block_temp(celsius=HEAT_TEMP)
    # thermocycler.set_lid_temp(celsius=105)
   
    for i in range(RUN_COUNT):
        move_to_slot(pcr_plate, thermocycler)
        thermocycler.close_lid()
        protocol.delay(seconds=HEAT_DELAY)
        thermocycler.open_lid()
        move_to_slot(pcr_plate, mag_block)
        move_to_slot(pcr_plate, thermocycler)
        thermocycler.close_lid()
        protocol.delay(seconds=HEAT_DELAY)
        thermocycler.open_lid()
        move_to_slot(pcr_plate, 5)
        
        from_all_to_all(pcr_plate)
        move_to_slot(deepwell_plate, mag_block)
        move_to_slot(deepwell_plate, 6)
        move_to_slot(tip_rack, 5, p_z_off=-11, d_z_off=-20)
        move_to_slot(tip_rack, 9, p_z_off=-20, d_z_off=-11)
        move_to_slot(pcr_plate, 5)

    
