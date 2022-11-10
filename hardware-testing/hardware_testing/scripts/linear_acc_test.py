"""OT3 Homing Accuracy Test."""
import argparse
import asyncio
import os, time, random

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import Axis

from hardware_testing import data
from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
    home_ot3,
    get_endstop_position_ot3,
)

from hardware_testing.drivers import mitutoyo_digimatic_indicator as dial

MOUNT = OT3Mount.RIGHT
LOAD = GantryLoad.NONE
CYCLES = 25
SPEED_XY = 500
SPEED_Z = 65

SETTINGS = {
    OT3Axis.X: GantryLoadSettings(
        max_speed=SPEED_XY,
        acceleration=1000,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Y: GantryLoadSettings(
        max_speed=SPEED_XY,
        acceleration=500,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Z_L: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=500,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.4,
    ),
    OT3Axis.Z_R: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=500,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.4,
    ),
}

async def _main(is_simulating: bool) -> None:
    api = await build_async_ot3_hardware_api(is_simulating=is_simulating)
    await set_gantry_load_per_axis_settings_ot3(api, SETTINGS, load=LOAD)

    test_tag = input("Enter test tag:\n\t>> ")

    test_name = "linear-acc"
    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    await home_ot3(api, [OT3Axis.X])
    # await api.move_rel(mount=MOUNT, delta=Point(y=-60), speed=200)
    await api.disengage_axes([OT3Axis.Y])

    input("Set Y-Axis\n\n\t>> Continue...")
    await api.engage_axes([OT3Axis.Y])

    print(f"Set digital scale parallel to X-Axis")
    input("\n\t>> Continue...")

    # await api.engage_axes([OT3Axis.Y])
    starting_read_pos = gauge.read()

    print(f"Attach and set digital scale to 0\n\t>> Current position: {starting_read_pos}")
    await api.disengage_axes([OT3Axis.Y])
    input("\n\t>> Continue...")
    await api.engage_axes([OT3Axis.Y])

    init_reading = gauge.read()
    print(f"Initial gauge read {test_tag}: {init_reading} mm\n")
    init_pos = 'Initial Position'
    test_axis = test_tag

    init_encoder_pos = await api.encoder_current_position(MOUNT)
    # for key in init_encoder_pos:
    #     print(key)
    #     print(init_encoder_pos[key])
    # keys = init_encoder_pos.keys()
    # print(keys)
    init_encoder_pos = init_encoder_pos[Axis.X]
    # init_encoder_pos = init_encoder_pos["<Axis.X>"]

    if test_axis == "Z":
        test_speed = SPEED_Z
    else:
        test_speed = 400 # SPEED_XY

    input("Press enter to begin test...\n")

    header = ['Cycle', 'Test Axis', 'Start Position (mm)', 'Position Read (mm)', 'Distance Moved (mm)', 'Encoder position (mm)','Speed (mm/s)']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    init_reading_data = ['0', test_axis, init_reading, '', init_pos, init_encoder_pos, test_speed]
    init_reading_str = data.convert_list_to_csv_line(init_reading_data)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=init_reading_str)

    # distances = [440*0.25, 440*0.5, 440*0.75, 440]
    cur_pos = await api.current_position(MOUNT)
    # print(cur_pos.keys())
    distances = [cur_pos[Axis.X]*0.25, cur_pos[Axis.X]*0.25, cur_pos[Axis.X]*0.25, cur_pos[Axis.X]*0.25]
    count = 0
    for cycle in range(CYCLES):
        print(f"Cycle: {cycle+1} out of {CYCLES}")
        # coordinates = await random_move(api)
        time.sleep(2)
        start_pos = gauge.read()
        print(f"\tStart position:\n\t {start_pos} mm")
        for distance in distances:
            count += 1
            # if count == 1:
            #     time.sleep(2)
            #     start_pos = gauge.read()
            await api.move_rel(mount=MOUNT, delta=Point(x=-distance), speed=400)
            time.sleep(2)
            pos_reading = gauge.read() - start_pos
            print(f"\tCurrent position reading:\n\t {pos_reading} mm")
            encoder_pos = await api.encoder_current_position(MOUNT)
            encoder_pos = init_encoder_pos - encoder_pos[Axis.X]
            print(f"\tCurrent encoder position reading:\n\t {encoder_pos} mm")
            # await home_ot3(api, [OT3Axis.X])
            time.sleep(2)
            # if count > 1:
            #     start_pos = ''
            cycle_data = [cycle+1, '', start_pos, pos_reading, distance*count, encoder_pos, test_speed]
            cycle_data_str = data.convert_list_to_csv_line(cycle_data)
            data.append_data_to_file(test_name=test_name, file_name=file_name, data=cycle_data_str)
        await home_ot3(api, [OT3Axis.X])
        count = 0

    await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])

if __name__ == "__main__":
    print("\nSTART TEST\n")

    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")

    parser.add_argument("--equal_distance", action="store_true") ###
    parser.add_argument("--test_z_axis", action="store_true") ###

    parser.add_argument("--cycles", type=int, default=CYCLES)
    parser.add_argument("--speed-xy", type=int, default=SPEED_XY)
    parser.add_argument("--speed-z", type=int, default=SPEED_Z)
    parser.add_argument("--test_home_speed", type=int, default=40)
    parser.add_argument("--mod_port", type=str, required=False, \
                        default = "/dev/ttyUSB0")
    args = parser.parse_args()

    CYCLES = args.cycles
    SPEED_XY = args.speed_xy
    SPEED_Z = args.speed_z
    SETTINGS[OT3Axis.X].max_speed = SPEED_XY
    SETTINGS[OT3Axis.Y].max_speed = SPEED_XY
    SETTINGS[OT3Axis.Z_L].max_speed = SPEED_Z
    SETTINGS[OT3Axis.Z_R].max_speed = SPEED_Z

    gauge = dial.Mitutoyo_Digimatic_Indicator(port=args.mod_port)
    gauge.connect()

    asyncio.run(_main(args.simulate))
