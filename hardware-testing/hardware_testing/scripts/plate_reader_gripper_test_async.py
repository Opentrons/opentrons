import asyncio
import csv
import time
from datetime import datetime
from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "Absorbance Plate Reader Gripper Test (Hardware Async)"}
requirements = {"robotType": "Flex", "apiLevel": "2.21"}

CYCLES = 100
LID_FORCE = 20
LID_OFFSET = 14
MOVE_LID = True

# Define Spreadsheet Parameters
test_name = "plate_reader_gripper_test"
test_time = datetime.utcnow().strftime("%y-%m-%d-%H-%M-%S")
test_id = f"_run-{test_time}"
file_format = ".csv"
file_name = test_name + test_id + file_format
file_path = "/data/" + file_name
file_header = ["Time","Cycle","Step","Lid Force","Lid Offset","Lid State","Plate State","Move State"]

# Define Timer
start_time = 0
elapsed_time = 0

def run(protocol: ProtocolContext) -> None:
    # Get Lid Status Function
    async def _get_lid_status():
        await plate_reader_async_module_hardware.wait_for_is_running()
        response = await plate_reader_driver.get_lid_status()
        return response

    # Get Plate Presence Function
    async def _get_plate_presence():
        await plate_reader_async_module_hardware.wait_for_is_running()
        response = await plate_reader_driver.get_plate_presence()
        return response

    # Record Test Data
    def record_data(cycle, move_state, step):
        print(f"Cycle: {cycle}, State: {move_state}")
        print("Recording...")
        if not protocol.is_simulating():
            elapsed_time = (time.time() - start_time)/60
            timestamp = round(elapsed_time, 3)
            lid_state = plate_reader_sync_module_hardware.get_lid_status()
            plate_state = plate_reader_sync_module_hardware.get_plate_presence()
            print(f"Lid State: {lid_state}, Plate State: {plate_state}")
            test_data = [timestamp, cycle, step, LID_FORCE, LID_OFFSET, lid_state, plate_state, move_state]
            with open(file_path, 'a+') as f:
                writer = csv.writer(f)
                writer.writerow(test_data)

    # Create Spreadsheet
    if not protocol.is_simulating():
        with open(file_path, 'a+') as f:
            writer = csv.writer(f)
            writer.writerow(file_header)

    # Load Modules
    plate_reader = protocol.load_module("absorbanceReaderV1", "D3")

    # Sync Modules
    plate_reader_sync_module_hardware = plate_reader._core._sync_module_hardware
    plate_reader_async_module_hardware = plate_reader_sync_module_hardware._obj_to_adapt
    plate_reader_driver = plate_reader_async_module_hardware._driver
    plate_reader_async_module_hardware.get_lid_status = _get_lid_status
    plate_reader_async_module_hardware.get_plate_presence = _get_plate_presence

    # Load Labware
    labware = "corning_96_wellplate_360ul_flat"
    plate = protocol.load_labware(labware, "C3")

    # Main Loop
    start_time = time.time()
    for i in range(CYCLES):
        cycle = i + 1
        print(f"Starting Test Cycle: {cycle}/{CYCLES}")
        # Step 1: Move the plate to the Plate Reader
        protocol.move_labware(plate, plate_reader, use_gripper=True)
        record_data(cycle, "Add Plate", 1)
        if MOVE_LID:
            # Step 2: Close Plate Reader lid
            plate_reader.close_lid()
            record_data(cycle, "Close Lid", 2)
            # Step 3: Open Plate Reader lid
            plate_reader.open_lid()
            record_data(cycle, "Open Lid", 3)
        # Step 4: Move the plate to the Deck slot
        protocol.move_labware(plate, "C3", use_gripper=True)
        record_data(cycle, "Remove Plate", 4)
