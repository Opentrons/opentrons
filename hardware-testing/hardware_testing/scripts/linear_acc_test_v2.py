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
Z_DIST = 215
INIT_MOVE = 5

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

    # while True:
    test_tag = input("Enter test tag:\n\t>> ").upper()
    #     if (test_tag == "X" or test_tag == "Y" or test_tag == "Z"):
    #         break
    #     else:
    #         print("Enter X, Y, or Z for test tag")
    #         continue

    test_robot = input("Enter robot ID:\n\t>> ")

    test_name = "linear-acc"
    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    test_axis_dict = {
        "X": OT3Axis.X,
        "Y": OT3Axis.Y,
        "Z": OT3Axis.Z_R
    }

    encoder_axis_dict = {
        "X": Axis.X,
        "Y": Axis.Y,
        "Z": Axis.A
    }

    # test_point_dict = {
    #     "X": Point(x=-INIT_MOVE),
    #     "Y": Point(y=-INIT_MOVE),
    #     "Z": Point(z=-INIT_MOVE)
    # }

    await home_ot3(api, [test_axis_dict[test_tag]])

    if test_tag == "Z":
        await api.move_rel(mount=OT3Mount.LEFT, delta=Point(z=-(Z_DIST+INIT_MOVE)), speed=100)
        test_speed = SPEED_Z
    else:
        test_speed = 400 # SPEED_XY

    time.sleep(0.5)
    starting_read_pos = gauge.read()

    print(f"Set digital scale to 0\n\t>> Current position: {starting_read_pos}")
    input("\n\t>> Continue...")

    init_reading = gauge.read()
    print(f"Initial gauge read {test_tag}: {init_reading} mm\n")
    init_pos = 'Initial Position'

    init_encoder_pos = await api.encoder_current_position(MOUNT)
    init_encoder_pos = init_encoder_pos[encoder_axis_dict[test_tag]]

    input("Press enter to begin test...\n")

    header = ['Cycle', 'Test Robot', 'Test Axis', 'Start Position (mm)', 'Position Read (mm)', 'Distance Moved (mm)', 'Encoder position (mm)','Speed (mm/s)']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    init_reading_data = ['0', test_robot, test_tag, init_reading, '', init_pos, init_encoder_pos, test_speed]
    init_reading_str = data.convert_list_to_csv_line(init_reading_data)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=init_reading_str)

    cur_pos = await api.current_position(MOUNT)
    print(f"Max {test_tag}-Axis Travel: {cur_pos[encoder_axis_dict[test_tag]]}") ###, use: 510.2")

    test_distances = {
        "X": 510.2, ### cur_pos[encoder_axis_dict[test_tag]]
        "Y": cur_pos[encoder_axis_dict[test_tag]]-22.56,
        "Z": Z_DIST
    }

    distances = [(test_distances[test_tag]-INIT_MOVE)*0.25, (test_distances[test_tag]-INIT_MOVE)*0.25, (test_distances[test_tag]-INIT_MOVE)*0.25, (test_distances[test_tag]-INIT_MOVE)*0.25]
    print(f"Distance increments: {(test_distances[test_tag]-INIT_MOVE)*0.25}")
    count = 0
    for cycle in range(CYCLES):
        print(f"Cycle: {cycle+1} out of {CYCLES}")

        time.sleep(2)
        start_pos = gauge.read()
        print(f"\tStart position:\n\t {start_pos} mm")

        print(f"\tInitial Move: {INIT_MOVE} mm")

        # await api.move_rel(mount=MOUNT, delta=test_point_dict[test_tag], speed=50)
        if test_tag == "X":
            await api.move_rel(mount=MOUNT, delta=Point(x=-INIT_MOVE), speed=50)
        elif test_tag == "Y":
            await api.move_rel(mount=MOUNT, delta=Point(y=-INIT_MOVE), speed=50)
        elif test_tag == "Z":
            await api.move_rel(mount=MOUNT, delta=Point(z=-INIT_MOVE), speed=50)

        time.sleep(2)
        backlash_pos = gauge.read() - start_pos
        print(f"\tBacklash position reading:\n\t {backlash_pos} mm")
        backlash_enc_pos = await api.encoder_current_position(MOUNT)
        backlash_enc_pos = init_encoder_pos - backlash_enc_pos[encoder_axis_dict[test_tag]]
        print(f"\tBacklash encoder position reading:\n\t {backlash_enc_pos} mm")
        time.sleep(2)

        backlash_data = [cycle+1, '', '', start_pos, backlash_pos, INIT_MOVE, backlash_enc_pos, test_speed]
        backlash_data_str = data.convert_list_to_csv_line(backlash_data)
        data.append_data_to_file(test_name=test_name, file_name=file_name, data=backlash_data_str)

        for distance in distances:
            count += 1
            print(f"\tMove to: {distance*count} mm")

            if test_tag == "X":
                await api.move_rel(mount=MOUNT, delta=Point(x=-distance), speed=test_speed)
            elif test_tag == "Y":
                await api.move_rel(mount=MOUNT, delta=Point(y=-distance), speed=test_speed)
            elif test_tag == "Z":
                await api.move_rel(mount=MOUNT, delta=Point(z=-distance), speed=test_speed)

            time.sleep(2)
            pos_reading = gauge.read() - backlash_pos # start_pos
            print(f"\tCurrent position reading:\n\t {pos_reading} mm")
            encoder_pos = await api.encoder_current_position(MOUNT)
            encoder_pos = init_encoder_pos - encoder_pos[encoder_axis_dict[test_tag]] - backlash_enc_pos
            print(f"\tCurrent encoder position reading:\n\t {encoder_pos} mm")
            time.sleep(2)

            cycle_data = [cycle+1, '', '', start_pos, pos_reading, distance*count, encoder_pos, test_speed]
            cycle_data_str = data.convert_list_to_csv_line(cycle_data)
            data.append_data_to_file(test_name=test_name, file_name=file_name, data=cycle_data_str)

        await home_ot3(api, [test_axis_dict[test_tag]])
        count = 0

    await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])

if __name__ == "__main__":
    print("\nSTART TEST\n")

    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--cycles", type=int, default=CYCLES)
    parser.add_argument("--speed-xy", type=int, default=SPEED_XY)
    parser.add_argument("--speed-z", type=int, default=SPEED_Z)
    # parser.add_argument("--test_axis", type=str, default="X")
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
