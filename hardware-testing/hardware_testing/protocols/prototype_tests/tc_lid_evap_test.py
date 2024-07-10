from typing import List, Dict, Any, Optional
from enum import Enum
import sys
from datetime import datetime
from opentrons.protocol_api import ProtocolContext, Labware
import requests
from opentrons.drivers.command_builder import CommandBuilder

metadata = {"protocolName": "tc-lid-march-2024-v1"}
requirements = {"robotType": "Flex", "apiLevel": "2.16"}

"""
Setup:
 - 1-5x lids are stacked in deck D3
 - Thermocycler installed

Run:
 - For each lid in the stack (1-5x)
   - Move lid in D2 to Thermocycler
     - Remove top-most lid
     - PAUSE, wait for tester to press continue
   - Move lid from Thermocycler to new slot C2
     - Stacked onto any previously placed lids
     - PAUSE, wait for tester to press continue
"""

LID_STARTING_SLOT = "D2"
LID_COUNT = 2
LID_DEFINITION = "tc_lid_march_2024_v1"
LID_BOTTOM_DEFINITION = "tc_lid_march_2024_v1"
ip = "10.14.19.38"

EVAP_TEST = True
QUICK_TEST = False
LONG_HOLD_TEST = False

OFFSET_DECK = {
    "pick-up": {"x": 0, "y": 0, "z": 0},
    "drop": {"x": 0, "y": 0, "z": 0},
}
OFFSET_THERMOCYCLER = {
    "pick-up": {"x": 0, "y": 0, "z": -4},
    "drop": {"x": 0, "y": 0, "z": 0}
}

# THERMOCYLCER VARIABLES
SERIAL_ACK = "\r\n"
TC_COMMAND_TERMINATOR = SERIAL_ACK
TC_ACK = "ok" + SERIAL_ACK + "ok" + SERIAL_ACK
DEFAULT_TC_TIMEOUT = 40
DEFAULT_COMMAND_RETRIES = 3
class GCODE(str, Enum):
    PLATE_LIFT_CODE = "M128"


def _move_labware_with_offset(
    protocol: ProtocolContext,
    labware: Labware,
    destination: Any,
    pick_up_offset: Optional[Dict[str, float]] = None,
    drop_offset: Optional[Dict[str, float]] = None,
) -> None:
    protocol.move_labware(
        labware,
        destination,
        use_gripper=True,
        pick_up_offset=pick_up_offset,
        drop_offset=drop_offset,
    )

def run(protocol: ProtocolContext):
    
    # PLATE LIFT FUNCTIONS
    async def _driver_plate_lift():
        """Get Raw Power Output for each Thermocycler element."""
        c = (
            CommandBuilder(terminator=TC_COMMAND_TERMINATOR)
            .add_gcode(gcode=GCODE.PLATE_LIFT_CODE)
        )
        if not protocol.is_simulating():
            response = await tc_driver._connection.send_command(command=c, retries=DEFAULT_COMMAND_RETRIES)
        else:
            response = TC_ACK  # SimulatingDriver has no `._connection` so need to return _something_ for that case
        return response

    async def _get_plate_lift():
        await tc_async_module_hardware.wait_for_is_running()
        response = await _driver_plate_lift()
        return str(response)
    
    def tc_plate_lift():
        tc_async_module_hardware._get_plate_lift = _get_plate_lift
        tc_sync_module_hardware._get_plate_lift()
    
    # GET SERIAL NUMBERS
    # THERMOCYCLER
    response = requests.get(
        f"http://{ip}:31950/modules", headers={"opentrons-version": "3"}
    )
    module_data = response.json()
    thermocycler_serial = module_data["data"][0].get("serialNumber", "")
    # Instruments Attached
    response = requests.get(
        f"http://{ip}:31950/instruments", headers={"opentrons-version": "3"}
    )
    instrument_data = response.json()
    instruments = {}
    for instrument in instrument_data["data"]:
        instruments[instrument["mount"]] = instrument["serialNumber"]
    pipette = instruments.get("left", "")
    gripper = instruments.get("extension", "")
    things_attached = f"TC: {thermocycler_serial} pipette: {pipette} gripper: {gripper}"
    protocol.comment(things_attached)
    try:
        sys.path.insert(0, "/var/lib/jupyter/notebooks")
        import google_sheets_tool  # type: ignore[import]
        credentials_path = "/var/lib/jupyter/notebooks/abr.json"
    except:
            protocol.comment("Run on robot. Make sure google_sheets_tool.py is in jupyter notebook."
        )
    try:
        google_sheet = google_sheets_tool.google_sheet(
            credentials_path, "EVT-DVT lid testing", tab_number=0
        )
        protocol.comment("Connected to the google sheet.")
    except:
        protocol.comment(
            "There are no google sheets credentials. Make sure credentials in jupyter notebook."
        )
    date = datetime.now()
    data_row = [date, thermocycler_serial, pipette, gripper]
    #google_sheet.write_to_row(data_row)
    # SETUP
    thermocycler = protocol.load_module("thermocyclerModuleV2")
    tc_sync_module_hardware = thermocycler._core._sync_module_hardware
    tc_async_module_hardware = tc_sync_module_hardware._obj_to_adapt
    tc_driver = tc_async_module_hardware._driver
    tiprack_50_1    = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'D1')
    p1000 = protocol.load_instrument("flex_8channel_1000", "left", tip_racks = [tiprack_50_1])
    trashA1 = protocol.load_trash_bin("A3") 
    wasteChute = protocol.load_waste_chute()
    
    thermocycler.open_lid()
    plate_in_cycler = thermocycler.load_labware(
        "armadillo_96_wellplate_200ul_pcr_full_skirt"
    )
    
    reservoir       = protocol.load_labware('nest_12_reservoir_15ml','A2')
    lids: List[Labware] = [protocol.load_labware(LID_BOTTOM_DEFINITION, LID_STARTING_SLOT)]
    for i in range(LID_COUNT - 1):
        lids.append(lids[-1].load_labware(LID_DEFINITION))
    lids.reverse()
    top_lid = lids[0]
    bottom_lid = lids[1]
    
    # DEFINE TESTS #
    def long_hold_test():
        # Long hold test
        thermocycler.set_block_temperature(4, hold_time_minutes=5)
        thermocycler.set_lid_temperature(105, hold_time_minutes = 5)
        thermocycler.set_block_temperature(98, hold_time_minutes=5)
        thermocycler.set_block_temperature(4, hold_time_minutes=5)
        thermocycler.open_lid()    
        
    def fill_with_liquid_and_measure():
        # Fill plate and measure
        locations = [plate_in_cycler['A1'].bottom(z=0.5),
                plate_in_cycler['A2'].bottom(z=0.5),
                plate_in_cycler['A3'].bottom(z=0.5),
                plate_in_cycler['A4'].bottom(z=0.5),
                plate_in_cycler['A5'].bottom(z=0.5),
                plate_in_cycler['A6'].bottom(z=0.5),
                plate_in_cycler['A7'].bottom(z=0.5),
                plate_in_cycler['A8'].bottom(z=0.5),
                plate_in_cycler['A9'].bottom(z=0.5),
                plate_in_cycler['A10'].bottom(z=0.5),
                plate_in_cycler['A11'].bottom(z=0.5),
                plate_in_cycler['A12'].bottom(z=0.5)]
        volumes = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]
        protocol.pause('Weight Armadillo Plate, place on thermocycler')
        # pipette 10uL into Armadillo wells-
        p1000.distribute(volume = volumes, source = reservoir['A1'], dest = locations, return_tips = True, blow_out = False)
        protocol.pause('Weight Armadillo Plate, place on thermocycler, put on lid')
    
    def pcr_cycle(num_of_cycles: int = 30):
        # 30x cycles of: 70° for 30s 72° for 30s 95° for 10s 
        profile_TAG2 = [{'temperature': 70, 'hold_time_seconds': 30}, {'temperature': 72, 'hold_time_seconds': 30}, {'temperature': 95, 'hold_time_seconds': 10}]
        thermocycler.execute_profile(steps = profile_TAG2, repetitions = num_of_cycles,block_max_volume=50)
    
    def move_lid():
        # Move lid from thermocycler to deck to stack to waste chute
        thermocycler.open_lid()
        tc_plate_lift()
        # Move Lid to Deck
        _move_labware_with_offset(protocol, top_lid, "B2", pick_up_offset = OFFSET_THERMOCYCLER["pick-up"], drop_offset=OFFSET_DECK["drop"])
        #google_sheet.update_cell("Sheet1", 2, 6, "Y")
        # Move Lid to Stack
        _move_labware_with_offset(protocol, top_lid, bottom_lid, pick_up_offset = OFFSET_THERMOCYCLER["pick-up"], drop_offset=OFFSET_DECK["drop"])
        #google_sheet.update_cell("Sheet1", 2, 7, "Y")
        # Move Lid to Waste Chute
        _move_labware_with_offset(protocol, top_lid, wasteChute, pick_up_offset = OFFSET_DECK["pick-up"])
        #google_sheet.update_cell("Sheet1", 2, 8, "Y")
    thermocycler.set_block_temperature(4)
    thermocycler.set_lid_temperature(105)
        
    #hold at 95° for 3 minutes
    profile_TAG = [{'temperature': 95, 'hold_time_minutes': 3}]
    #hold at 72° for 5min 
    profile_TAG3 = [{'temperature': 72, 'hold_time_minutes': 5}]
    
    if QUICK_TEST:
        thermocycler.set_block_temperature(4)
        thermocycler.set_lid_temperature(105)
        _move_labware_with_offset(protocol, top_lid, plate_in_cycler, pick_up_offset = OFFSET_DECK["pick-up"], drop_offset=OFFSET_THERMOCYCLER["drop"])
        thermocycler.close_lid()
    
    if LONG_HOLD_TEST:
        _move_labware_with_offset(protocol, top_lid, plate_in_cycler, pick_up_offset = OFFSET_DECK["pick-up"], drop_offset=OFFSET_THERMOCYCLER["drop"])
        long_hold_test()
        _move_labware_with_offset(protocol, top_lid, "B2", pick_up_offset = OFFSET_THERMOCYCLER["pick-up"], drop_offset=OFFSET_DECK["drop"])
        long_hold_test()
        fill_with_liquid_and_measure()
        thermocycler.close_lid()
        pcr_cycle()
        move_lid()
        
    # Go through PCR cycle
    if EVAP_TEST:
        fill_with_liquid_and_measure()
        _move_labware_with_offset(protocol, top_lid, plate_in_cycler, pick_up_offset = OFFSET_DECK["pick-up"], drop_offset=OFFSET_THERMOCYCLER["drop"])
        thermocycler.close_lid()
        thermocycler.execute_profile(steps = profile_TAG, repetitions = 1,block_max_volume=50)
        pcr_cycle()
        thermocycler.execute_profile(steps = profile_TAG3, repetitions = 1,block_max_volume=50)
        # # # Cool to 4° 
        thermocycler.set_block_temperature(4)
        thermocycler.set_lid_temperature(105)
        # Open lid
    thermocycler.open_lid()
    move_lid()
    protocol.pause("Weigh armadillo plate.")
