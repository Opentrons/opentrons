"""OT3 Homing Accuracy Test."""
import argparse
import asyncio
import os, time, random

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import Axis
# from opentrons_hardware.hardware_control import encoder_hardware as encoder_hardware
# from hardware_testing.opentrons_api import encoder_hardware as encoder_hardware

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
    test_robot = input("Enter robot ID:\n\t>> ")

    test_name = "linear-acc"
    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    await home_ot3(api, [OT3Axis.Z_R]) # , [OT3Axis.Y])
    # await api.move_rel(mount=MOUNT, delta=Point(y=-60), speed=200)
    # await api.disengage_axes([OT3Axis.Y])

    # input("Set Y-Axis\n\n\t>> Continue...")
    # await api.engage_axes([OT3Axis.Y])

    # print(f"Set digital scale parallel to X-Axis")
    # input("\n\t>> Continue...")
    z_distance = 210
    ### await api.move_rel(mount=Mount.LEFT, delta=Point(z=-(z_distance+5), speed=100) ### Z-Axis test

    # await api.engage_axes([OT3Axis.Y])
    time.sleep(0.5)
    starting_read_pos = gauge.read()
    # starting_enc_pos = await encoder_hardware.get_encoder_position()

    ### enc_api = OT3API()


    print(f"Attach mount arm and set digital scale to 0\n\t>> Current position: {starting_read_pos}") ###, Current encoder position: {enc_api.get_encoder_position()}")
    # await api.disengage_axes([OT3Axis.Y])
    input("\n\t>> Continue...")
    # await api.engage_axes([OT3Axis.Y])

    init_reading = gauge.read()
    print(f"Initial gauge read {test_tag}: {init_reading} mm\n")
    init_pos = 'Initial Position'
    test_axis = test_tag

    init_encoder_pos = await api.encoder_current_position(MOUNT)
    # print(f"Init Encoder position: {init_encoder_pos[Axis.X]}, {init_encoder_pos[Axis.Y]}")
    # for key in init_encoder_pos:
    #     print(key)
    #     print(init_encoder_pos[key])
    # keys = init_encoder_pos.keys()
    # print(keys)
    init_encoder_pos = init_encoder_pos[Axis.A] #Axis.Y]
    ### print(f"init enc pos: {init_encoder_pos}, new enc pos: {enc_api.get_encoder_position()}")
    # init_encoder_pos = init_encoder_pos["<Axis.X>"]

    if test_axis == "Z":
        test_speed = SPEED_Z
    else:
        test_speed = 400 # SPEED_XY

    input("Press enter to begin test...\n")

    header = ['Cycle', 'Test Robot', 'Test Axis', 'Start Position (mm)', 'Position Read (mm)', 'Distance Moved (mm)', 'Encoder position (mm)','Speed (mm/s)']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    init_reading_data = ['0', test_robot, test_axis, init_reading, '', init_pos, init_encoder_pos, test_speed]
    init_reading_str = data.convert_list_to_csv_line(init_reading_data)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=init_reading_str)

    # distances = [440*0.25, 440*0.5, 440*0.75, 440]
    cur_pos = await api.current_position(MOUNT)
    # print(f"Max Y Travel: {cur_pos[Axis.Y]}")
    print(f"Max Z_R Travel: {cur_pos[Axis.A]}")
    # print(cur_pos.keys())
    # distances = [(cur_pos[Axis.Y]-22.56)*0.25, (cur_pos[Axis.Y]-22.56)*0.25, (cur_pos[Axis.Y]-22.56)*0.25, (cur_pos[Axis.Y]-22.56)*0.25]
    distances = [(z_distance)*0.25, (z_distance)*0.25, (z_distance)*0.25, (z_distance)*0.25]
    # print(f"Distance increments: {(cur_pos[Axis.Y]-22.56)*0.25}")
    print(f"Distance increments: {(z_distance)*0.25}")
    count = 0
    for cycle in range(CYCLES):
        print(f"Cycle: {cycle+1} out of {CYCLES}")
        # start_enc_pos = api.encoder_current_position(MOUNT)
        # start_enc_pos = init_encoder_pos - start_enc_pos[Axis.A]
        # print(f"\tInit move position:\n\t {init_move} mm")
        # coordinates = await random_move(api)
        time.sleep(2)
        start_pos = gauge.read()
        print(f"\tStart position:\n\t {start_pos} mm")

        print("Initial Move: 5 mm")
        await api.move_rel(mount=MOUNT, delta=Point(z=-5), speed=SPEED_Z)
        time.sleep(2)
        backlash_pos = gauge.read() - start_pos
        print(f"\tBacklash position reading:\n\t {backlash_pos} mm")
        backlash_enc_pos = await api.encoder_current_position(MOUNT)
        backlash_enc_pos = init_encoder_pos - backlash_enc_pos[Axis.A]
        print(f"\tBacklash encoder position reading:\n\t {backlash_enc_pos} mm")
        time.sleep(2)

        backlash_data = [cycle+1, '', '', start_pos, backlash_pos, '5', backlash_enc_pos, test_speed]
        backlash_data_str = data.convert_list_to_csv_line(backlash_data)
        data.append_data_to_file(test_name=test_name, file_name=file_name, data=backlash_data_str)

        # print(f"\tStart position:\n\t {start_pos} mm")
        for distance in distances:
            count += 1
            # if count == 1:
            #     time.sleep(2)
            #     start_pos = gauge.read()
            print(f"\tMove to: {distance*count + 5} mm")
            await api.move_rel(mount=MOUNT, delta=Point(z=-distance), speed=SPEED_Z)
            time.sleep(2)
            pos_reading = gauge.read() - start_pos
            print(f"\tCurrent position reading:\n\t {pos_reading} mm")
            encoder_pos = await api.encoder_current_position(MOUNT)
            # print(f"Encoder position: {encoder_pos[Axis.X]}, {encoder_pos[Axis.Y]}")
            encoder_pos = init_encoder_pos - encoder_pos[Axis.A]
            print(f"\tCurrent encoder position reading:\n\t {encoder_pos} mm")
            # new_enc_pos = await encoder_hardware.get_encoder_position()
            # print(f"\Current new encoder position reading:\n\t {new_enc_pos} mm")
            # await home_ot3(api, [OT3Axis.X])
            time.sleep(2)
            # if count > 1:
            #     start_pos = ''
            cycle_data = [cycle+1, '', '', start_pos, pos_reading, distance*count, encoder_pos, test_speed]
            cycle_data_str = data.convert_list_to_csv_line(cycle_data)
            data.append_data_to_file(test_name=test_name, file_name=file_name, data=cycle_data_str)
        await home_ot3(api, [OT3Axis.Z_R])
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
