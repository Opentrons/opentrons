import csv
import random
from datetime import datetime
from opentrons.protocol_api import ProtocolContext

metadata = {"protocolName": "gripper-random-offset-location"}
requirements = {"robotType": "Flex", "apiLevel": "2.15"}

DECK = True
MAG_BLOCK = True
TEMP_DECK = True
THERMOCYCLER = True
HEATER_SHAKER = True

num_cycles = 500 # cycles
drop_offsets = {
    "Deck":1,
    "TempDeck":1,
    "HeaterShaker":1,
    "MagBlock":1,
    "Thermocycler":1,
}
pickup_offsets = {
    "Deck":1,
    "TempDeck":0.3,
    "HeaterShaker":1,
    "MagBlock":1,
    "Thermocycler":1,
}
offset_types = ["Drop", "Pick-Up"]

test_name = "gripper_random_offset_location"
test_time = datetime.utcnow().strftime("%y-%m-%d-%H-%M-%S")
test_id = f"_run-{test_time}"

file_format = ".csv"
file_name = test_name + test_id + file_format
file_path = "/data/" + file_name
file_header = ["Cycle", "Axis", "Type", "Offset", "Location"]

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
    max_drop_offsets = []
    max_pickup_offsets = []
    if DECK:
        name = "Deck"
        locations.append("C2")
        location_names.append(name)
        max_drop_offsets.append(drop_offsets[name])
        max_pickup_offsets.append(pickup_offsets[name])
    if TEMP_DECK:
        name = "TempDeck"
        locations.append(td_adapter)
        location_names.append(name)
        max_drop_offsets.append(drop_offsets[name])
        max_pickup_offsets.append(pickup_offsets[name])
    if HEATER_SHAKER:
        name = "HeaterShaker"
        locations.append(hs_adapter)
        location_names.append(name)
        max_drop_offsets.append(drop_offsets[name])
        max_pickup_offsets.append(pickup_offsets[name])
    if MAG_BLOCK:
        name = "MagBlock"
        locations.append(mag_block)
        location_names.append(name)
        max_drop_offsets.append(drop_offsets[name])
        max_pickup_offsets.append(pickup_offsets[name])
    if THERMOCYCLER:
        name = "Thermocycler"
        locations.append(thermocycler)
        location_names.append(name)
        max_drop_offsets.append(drop_offsets[name])
        max_pickup_offsets.append(pickup_offsets[name])

    if not protocol.is_simulating():
        with open(file_path, 'a+') as f:
            writer = csv.writer(f)
            writer.writerow(file_header)
    location = random.choice(locations)
    axis = "Y"
    for cycle in range(num_cycles):
        while location == plate.parent:
            location = random.choice(locations)
        index = locations.index(location)
        offset_type = random.choice(offset_types)
        if offset_type == "Drop":
            offset = round(random.uniform(-max_drop_offsets[index], max_drop_offsets[index]), 2)
            protocol.comment(f"Axis: {axis}, Drop Offset: {offset} mm, Location: {location_names[index]}, Cycle: {cycle+1}/{num_cycles}")
            protocol.move_labware(plate, location, use_gripper=True, drop_offset={"x": 0, "y": offset, "z": 0})
        elif offset_type == "Pick-Up":
            offset = round(random.uniform(-max_pickup_offsets[index], max_pickup_offsets[index]), 2)
            protocol.comment(f"Axis: {axis}, Pick-Up Offset: {offset} mm, Location: {location_names[index]}, Cycle: {cycle+1}/{num_cycles}")
            protocol.move_labware(plate, location, use_gripper=True, pick_up_offset={"x": 0, "y": offset, "z": 0})
        test_data = [cycle+1, axis, offset_type, offset, location_names[index]]
        if not protocol.is_simulating():
            with open(file_path, 'a+') as f:
                writer = csv.writer(f)
                writer.writerow(test_data)
