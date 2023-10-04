import csv
import random
from datetime import datetime
from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "gripper-deck-drop-offset-test"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

DECK = True
MAG_BLOCK = False
TEMP_DECK = False
THERMOCYCLER = False
HEATER_SHAKER = False

num_cycles = 500
xy_offset = 1.0
offset_types = ["Drop", "Pick-Up"]
axes = ["X", "Y"]

test_name = "gripper_deck_drop_offset"
test_time = datetime.utcnow().strftime("%y-%m-%d-%H-%M-%S")
test_id = f"_run-{test_time}"

file_format = ".csv"
file_name = test_name + test_id + file_format
file_path = "/data/" + file_name
file_header = ["Cycle", "Axis", "Type", "Offset", "From", "To"]

def run(protocol: ProtocolContext) -> None:
    mag_block = protocol.load_module("magneticBlockV1", "B3")
    heater_shaker = protocol.load_module("heaterShakerModuleV1", "D1")
    temp_deck = protocol.load_module("temperatureModuleV2", "D3")
    thermocycler = protocol.load_module("thermocyclerModuleV2", "B1")

    labware = "opentrons_96_wellplate_200ul_pcr_full_skirt"
    plate = protocol.load_labware(labware, "C2")
    td_adapter = temp_deck.load_adapter("opentrons_96_well_aluminum_block")
    hs_adapter = heater_shaker.load_adapter("opentrons_96_pcr_adapter")

    heater_shaker.open_labware_latch()
    thermocycler.open_lid()

    locations = []
    location_names = []
    if DECK:
        locations.append("D2")
        location_names.append("Deck")
    if TEMP_DECK:
        locations.append(td_adapter)
        location_names.append("TempDeck")
    if HEATER_SHAKER:
        locations.append(hs_adapter)
        location_names.append("Heater-Shaker")
    if MAG_BLOCK:
        locations.append(mag_block)
        location_names.append("MagBlock")
    if THERMOCYCLER:
        locations.append(thermocycler)
        location_names.append("Thermocycler")

    from_location_name = "Deck"
    if not protocol.is_simulating():
        with open(file_path, 'a+') as f:
            writer = csv.writer(f)
            writer.writerow(file_header)
    for i in range(len(locations)):
        origin = plate.parent
        to_location_name = location_names[i]
        for cycle in range(num_cycles):
                offset = round(random.uniform(-xy_offset, xy_offset), 2)
                offset_type = random.choice(offset_types)
                axis = random.choice(axes)
                protocol.comment(f"Axis: {axis}, Offset Type: {offset_type}, Offset Value: {offset} mm, From: {from_location_name}, To: {to_location_name}, Cycle: {cycle+1}/{num_cycles}")
                test_data = [cycle+1, axis, offset_type, offset, from_location_name, to_location_name]
                if offset_type == "Drop":
                    # testing DROP on Y-axis
                    if axis == "Y":
                        protocol.move_labware(plate, locations[i], use_gripper=True, drop_offset={"x": 0, "y": offset, "z": 0})
                        protocol.move_labware(plate, origin, use_gripper=True, drop_offset={"x": 0, "y": offset, "z": 0})
                    # testing DROP on X-axis
                    elif axis == "X":
                        protocol.move_labware(plate, locations[i], use_gripper=True, drop_offset={"x": offset, "y": 0, "z": 0})
                        protocol.move_labware(plate, origin, use_gripper=True, drop_offset={"x": offset, "y": 0, "z": 0})
                elif offset_type == "Pick-Up":
                    # testing DROP on Y-axis
                    if axis == "Y":
                        protocol.move_labware(plate, locations[i], use_gripper=True, pick_up_offset={"x": 0, "y": offset, "z": 0})
                        protocol.move_labware(plate, origin, use_gripper=True, pick_up_offset={"x": 0, "y": offset, "z": 0})
                    # testing DROP on X-axis
                    elif axis == "X":
                        protocol.move_labware(plate, locations[i], use_gripper=True, pick_up_offset={"x": offset, "y": 0, "z": 0})
                        protocol.move_labware(plate, origin, use_gripper=True, pick_up_offset={"x": offset, "y": 0, "z": 0})
                from_location_name = to_location_name
                if not protocol.is_simulating():
                    with open(file_path, 'a+') as f:
                        writer = csv.writer(f)
                        writer.writerow(test_data)
