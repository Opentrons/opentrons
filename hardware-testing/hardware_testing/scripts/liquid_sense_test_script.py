import asyncio
import argparse
import termios
import sys
import tty
import os
import time
import json
import shutil

from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point, CriticalPoint
from hardware_testing.opentrons_api.helpers_ot3 import (
    OT3API,
    build_async_ot3_hardware_api,
    home_ot3,
    move_plunger_absolute_ot3,
    get_plunger_positions_ot3,
    move_plunger_relative_ot3,
)

from opentrons.config.types import LiquidProbeSettings
from hardware_testing import data
from hardware_testing.drivers import mitutoyo_digimatic_indicator

def dict_keys_to_line(dict):
    return str.join(",", list(dict.keys()))+"\n"

def rename_file(path, target_file):
    source = path + target_file
    for f in os.listdir(path):
        if f == target_file:
            shutil.copyfile( source,
                             path +'pressure_data_{}.csv'.format(time.time()))

def file_setup(test_data):
        test_name = "Liquid_Sense_Test"
        test_header = dict_keys_to_line(test_data)
        test_tag = "-start-time-{}".format(int(time.time()))
        test_id = data.create_run_id()
        test_path = data.create_folder_for_test_data(test_name)
        test_file = data.create_file_name(test_name, test_id, test_tag)
        data.append_data_to_file(test_name, test_file, test_header)
        print("FILE PATH = ", test_path)
        print("FILE NAME = ", test_file)
        return test_name, test_file

def store_data(test_data, trial):

    test_name = "LS_Pipette_data"
    headers = {'Time(s)': None, 'Pressure(Pa)': None}
    test_header = dict_keys_to_line(headers)
    test_tag = "-start-time-{}-{}".format(time.time(), trial)
    test_id = data.create_run_id()
    test_path = data.create_folder_for_test_data(test_name)
    test_file = data.create_file_name(test_name, test_id, test_tag)
    data.append_data_to_file(test_name, test_file, test_header)
    for d in test_data:
        print(d)
        d_str = f"{d[0]},{d[1]}\n"
        data.append_data_to_file(test_name, test_file, d_str)
    print("FILE PATH = ", test_path)
    print("FILE NAME = ", test_file)


def dial_indicator_setup():
    gauge = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(port='/dev/ttyUSB0')
    gauge.connect()
    return gauge

def getch():
    """
        fd: file descriptor stdout, stdin, stderr
        This functions gets a single input keyboard character from the user
    """
    def _getch():
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setraw(fd)
            ch = sys.stdin.read(1)
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        return ch
    return _getch()

async def _jog_axis(api, position) -> None:
    step_size = [0.05, 0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    step = step_size[step_length_index]
    xy_speed = 150
    za_speed = 65
    information_str = """
        Click  >>   i   << to move up
        Click  >>   k   << to move down
        Click  >>   a  << to move left
        Click  >>   d  << to move right
        Click  >>   w  << to move forward
        Click  >>   s  << to move back
        Click  >>   +   << to Increase the length of each step
        Click  >>   -   << to decrease the length of each step
        Click  >> Enter << to save position
        Click  >> q << to quit the test script
                    """
    print(information_str)
    while True:
        input = getch()
        if input == 'a':
            # minus x direction
            sys.stdout.flush()
            await api.move_rel(mount,
                    Point(
                        -step_size[step_length_index],0,0),
                        speed = xy_speed)

        elif input == 'd':
            #plus x direction
            sys.stdout.flush()
            await api.move_rel(mount,
                    Point(
                        step_size[step_length_index],0,0),
                        speed = xy_speed)

        elif input == 'w':
            #minus y direction
            sys.stdout.flush()
            await api.move_rel(mount,
                    Point(
                            0,step_size[step_length_index],0),
                            speed = xy_speed)

        elif input == 's':
            #plus y direction
            sys.stdout.flush()
            await api.move_rel(mount,
                    Point(
                            0,-step_size[step_length_index],0),
                            speed = xy_speed)

        elif input == 'i':
            sys.stdout.flush()
            await api.move_rel(mount,
                        Point(
                            0,0,step_size[step_length_index]),
                            speed = za_speed)

        elif input == 'k':
            sys.stdout.flush()
            await api.move_rel(mount,
                        Point(
                            0,0,-step_size[step_length_index]),
                            speed = za_speed)

        elif input == 'r':
            sys.stdout.flush()
            position = await api.current_position_ot3(mount, refresh=True)
            gauge_reading = gauge.read_stable(timeout=20)
            test_data["X-Coordinate"] = round(position[OT3Axis.X], 2)
            test_data["Y-Coordinate"] = round(position[OT3Axis.Y], 2)
            test_data["Z-Coordinate"] = round(position[OT3Axis.by_mount(mount)], 2)
            test_data["Deck Height(mm)"] = gauge_reading
            print(test_data)
            d_str = f"{round(position[OT3Axis.X], 2)}, \
                    {round(position[OT3Axis.Y], 2)}, \
                    {round(position[OT3Axis.by_mount(mount)], 2)}, \
                    {gauge.read_stable(timeout=20)}, {gauge_reading}\n"
            data.append_data_to_file(test_n, test_f, d_str)

        elif input == 'q':
            sys.stdout.flush()
            print("TEST CANCELLED")
            quit()

        elif input == '+':
            sys.stdout.flush()
            step_length_index = step_length_index + 1
            if step_length_index >= 6:
                step_length_index = 6
            step = step_size[step_length_index]

        elif input == '-':
            sys.stdout.flush()
            step_length_index = step_length_index -1
            if step_length_index <= 0:
                step_length_index = 0
            step = step_size[step_length_index]

        elif input == '\r':
            sys.stdout.flush()
            return position
        position = await api.current_position_ot3(mount, refresh=True)

        print('Coordinates: ', round(position[OT3Axis.X], 2), ',',
                                round(position[OT3Axis.Y], 2), ',',
                                round(position[OT3Axis.by_mount(mount)], 2), ' Motor Step: ',
                                step_size[step_length_index],
                                end = '')
        print('\r', end='')

async def _main() -> None:
    hw_api = await build_async_ot3_hardware_api(is_simulating=args.simulate,
                                    use_defaults=True)
    # Some Constants
    tip_column = 0
    columns_to_use = 12
    slot_loc = {"A1": (13.42 , 394.92,110), "A2": (177.32 , 394.92,110), "A3": (341.03 , 394.92,110),
                    "B1": (13.42, 288.42 , 110), "B2": (177.32 , 288.92 ,110), "B3": (341.03, 288.92,110),
                    "C1": (13.42, 181.92, 110), "C2": (177.32, 181.92,110), "C3": (341.03, 181.92,110),
                    "D1": (13.42, 75.5, 110), "D2": (177.32, 75.5,110), "D3": (341.03, 75.5,110)}

    liquid_probe_settings = LiquidProbeSettings(
                                                starting_mount_height = args.start_mount_height,
                                                prep_move_speed = args.prep_move_speed,
                                                max_z_distance = args.max_z_distance,
                                                min_z_distance = args.min_z_distance,
                                                mount_speed = args.mount_speed,
                                                plunger_speed = args.plunger_speed,
                                                sensor_threshold_pascals = args.sensor_threshold,
                                                expected_liquid_height = args.expected_liquid_height,
                                                log_pressure = args.log_pressure,
                                                aspirate_while_sensing = False
                                                )
    try:
        # Home
        await home_ot3(hw_api, [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        home_pos = await hw_api.current_position_ot3(mount, refresh=True)
        await hw_api.cache_instruments()
        await hw_api.home_plunger(mount)
        plunger_pos = get_plunger_positions_ot3(hw_api, mount)
        dial_offset = (50, 25, 50)
        tips_to_use = args.tips
        tip_count = 0
        x_offset = 0
        y_offset = 0
        if args.test == 'precision_liquid_sense_test':
            # Move XY to Dial Indicator slot
            await hw_api.move_to(mount, Point(slot_loc[args.dial_slot][0] + dial_offset[0],
                                                slot_loc[args.dial_slot][1] - dial_offset[1],
                                                home_pos[OT3Axis.by_mount(mount)]))
            # Move Z to Dial Indicator slot
            await hw_api.move_to(mount, Point(slot_loc[args.dial_slot][0] + dial_offset[0],
                                                slot_loc[args.dial_slot][1] - dial_offset[1],
                                                slot_loc[args.dial_slot][2] + dial_offset[2]))

            current_position = await hw_api.current_position_ot3(mount, refresh=True)
            # Jog Nozzle to Dial Indicator
            nozzle_loc = await _jog_axis(hw_api, current_position)
            # Save Dial Indicator Nozzle Position
            await asyncio.sleep(2)
            nozzle_measurement = gauge.read_stable(timeout=20)
            start_time =  time.time()
            elasped_time = (time.time() - start_time)
            test_data["Time"] = round(elasped_time, 3)
            test_data["Tip Height(mm)"] = "No Tip"
            test_data["Nozzle Pos(mm)"] = nozzle_measurement
            test_data["Tip"] = "No Tip"
            print(test_data)
            d_str = f"{elasped_time}, {nozzle_measurement}, Nozzle \n"
            data.append_data_to_file(test_n, test_f, d_str)
            z_retract_distance = 130
            tip_length = 85.0
            for tip in range(1, tips_to_use+1):
                if tip <= 1:
                    current_position = await hw_api.current_position_ot3(mount, refresh=True)
                    # Move to safe height
                    await hw_api.move_to(mount, Point(current_position[OT3Axis.X] + x_offset,
                                                        current_position[OT3Axis.Y] + y_offset,
                                                        home_pos[OT3Axis.by_mount(mount)]))
                    # Move XY to Tiprack slot
                    await hw_api.move_to(mount, Point(slot_loc[args.tiprack_slot][0] + x_offset,
                                                        slot_loc[args.tiprack_slot][1] + y_offset,
                                                        home_pos[OT3Axis.by_mount(mount)]))
                    # Move Z to Tiprack slot
                    await hw_api.move_to(mount, Point(slot_loc[args.tiprack_slot][0] + x_offset,
                                                        slot_loc[args.tiprack_slot][1] + y_offset,
                                                        slot_loc[args.tiprack_slot][2]))
                    # Jog to tiprack location
                    tiprack_loc = await _jog_axis(hw_api, current_position)
                    # Pick up tip
                    await hw_api.pick_up_tip(mount, tip_length)
                    current_position = await hw_api.current_position_ot3(mount, refresh=True)
                    await hw_api.move_to(mount, Point(current_position[OT3Axis.X],
                                                        current_position[OT3Axis.Y],
                        current_position[OT3Axis.by_mount(mount)]))
                    position = await hw_api.current_position_ot3(mount, refresh=True)
                else:
                    current_position = await hw_api.current_position_ot3(mount, refresh=True)
                    print(f"pos: {current_position}")
                    print(f"{tiprack_loc}")
                    # # Move to safe height
                    # await hw_api.move_to(mount, Point(current_position[OT3Axis.X] + x_offset,
                    #                                     current_position[OT3Axis.Y] + y_offset,
                    #                                     home_pos[OT3Axis.by_mount(mount)]))
                    # Move to safe height
                    await hw_api.move_to(mount, Point(tiprack_loc[OT3Axis.X] + x_offset,
                                                        tiprack_loc[OT3Axis.Y] + y_offset,
                                                        home_pos[OT3Axis.by_mount(mount)]))
                    # Move Z to Tiprack slot
                    await hw_api.move_to(mount, Point(tiprack_loc[OT3Axis.X] + x_offset,
                                                        tiprack_loc[OT3Axis.Y] + y_offset,
                                                        tiprack_loc[OT3Axis.by_mount(mount)]))
                    await hw_api.pick_up_tip(mount, tip_length)
                    current_position = await hw_api.current_position_ot3(mount, refresh=True)
                    await hw_api.move_to(mount, Point(current_position[OT3Axis.X],
                                                        current_position[OT3Axis.Y],
                        current_position[OT3Axis.by_mount(mount)]))
                    position = await hw_api.current_position_ot3(mount, refresh=True)

                await move_plunger_absolute_ot3(hw_api, mount, plunger_pos[0])
                z_safe_height = 20
                current_position = await hw_api.current_position_ot3(mount, refresh = True)
                # Relative to tip
                if tip <= 1:
                    # Move XY to Dial Indicator slot
                    await hw_api.move_to(mount, Point(slot_loc[args.dial_slot][0] + dial_offset[0],
                                                        slot_loc[args.dial_slot][1] - dial_offset[1],
                                                        current_position[OT3Axis.by_mount(mount)]),
                                                        critical_point = CriticalPoint.TIP
                                                        )
                    tip_loc = await _jog_axis(hw_api, current_position)
                else:
                    # Move XY to Dial Indicator slot
                    await hw_api.move_to(mount, Point(tip_loc[OT3Axis.X],
                                                        tip_loc[OT3Axis.Y],
                                                        current_position[OT3Axis.by_mount(mount)]),
                                                        critical_point = CriticalPoint.TIP
                                                        )
                    # Move Z to Dial Indicator slot
                    await hw_api.move_to(mount, Point(tip_loc[OT3Axis.X],
                                                        tip_loc[OT3Axis.Y],
                                                        tip_loc[OT3Axis.by_mount(mount)]),
                                                        speed = 10,
                                                        critical_point = CriticalPoint.TIP)
                # Save Dial Indicator Nozzle Position
                await asyncio.sleep(2)
                tip_measurement = gauge.read_stable(timeout=20)
                elasped_time = (time.time() - start_time)
                test_data["Time_D"] = round(elasped_time, 3)
                test_data["Tip Height(mm)"] = tip_measurement
                test_data["Nozzle Pos(mm)"] = 0.0
                test_data["Tip"] = "Tip"
                print(test_data)
                # Move XY to Dial Indicator slot
                await hw_api.move_to(mount, Point(tip_loc[OT3Axis.X],
                                                    tip_loc[OT3Axis.Y],
                                                    tip_loc[OT3Axis.by_mount(mount)] + z_safe_height),
                                                    speed = 5,
                                                    critical_point = CriticalPoint.TIP)
                current_position = await hw_api.current_position_ot3(mount, refresh=True)
                # Jog to top of trough location
                if tip <= 1:
                    home_position = await hw_api.current_position_ot3(mount, refresh=True)
                    # Move XY to Tiprack slot
                    await hw_api.move_to(mount, Point(slot_loc[args.tiprack_slot][0],
                                                        slot_loc[args.tiprack_slot][1],
                                                        home_position[OT3Axis.by_mount(mount)]))
                    # Move to trought slot
                    await hw_api.move_to(mount, Point(slot_loc[args.trough_slot][0],
                                                        slot_loc[args.trough_slot][1],
                                                        slot_loc[args.trough_slot][2]))
                    print(" Calibrate to top of the trough")
                    trough_loc = await _jog_axis(hw_api, current_position)
                else:
                    # Move to trought slot
                    await hw_api.move_to(mount, Point(trough_loc[OT3Axis.X],
                                                        trough_loc[OT3Axis.Y],
                                                        position[OT3Axis.by_mount(mount)]))
                    # Move to trought slot
                    await hw_api.move_to(mount, Point(trough_loc[OT3Axis.X],
                                                        trough_loc[OT3Axis.Y],
                                                        trough_loc[OT3Axis.by_mount(mount)]))

                initial_motor_pos = await hw_api.current_position_ot3(mount, refresh = True)
                initial_enc_pos = await hw_api.encoder_current_position_ot3(mount, refresh = True)
                # Probe Liquid
                init_probe_time = (time.time() - start_time)
                liquid_height_pos = await hw_api.liquid_probe(mount, probe_settings = liquid_probe_settings)
                # store_data(ls_data, tip)
                end_probe_time = (time.time() - start_time)
                end_motor_pos = await hw_api.current_position_ot3(mount, refresh = True)
                end_enc_pos = await hw_api.encoder_current_position_ot3(mount, refresh = True)
                test_data["Time_L"] = elasped_time
                test_data["Triggered_z_pos"] = liquid_height_pos[0]
                test_data["Triggered_zenc_pos"] = liquid_height_pos[1]
                test_data["init_Time_L"] = init_probe_time
                test_data["end_Time_L"] = end_probe_time
                test_data["init_z_pos(mm)"] = initial_motor_pos[OT3Axis.by_mount(mount)]
                test_data["init_zenc_pos(mm)"] = initial_enc_pos[OT3Axis.by_mount(mount)]
                test_data["init_pmotor_pos(mm)"] = initial_motor_pos[OT3Axis.of_main_tool_actuator(mount)]
                test_data["init_penc_pos(mm)"] = initial_enc_pos[OT3Axis.of_main_tool_actuator(mount)]
                test_data["end_z_pos(mm)"] = end_motor_pos[OT3Axis.by_mount(mount)]
                test_data["end_zenc_pos(mm)"] = end_enc_pos[OT3Axis.by_mount(mount)]
                test_data["end_pmotor_pos(mm)"] = end_motor_pos[OT3Axis.of_main_tool_actuator(mount)]
                test_data["end_penc_pos(mm)"] = end_enc_pos[OT3Axis.of_main_tool_actuator(mount)]
                print(test_data)
                d_str = f"{elasped_time}, \
                            {tip_measurement}, \
                            {None},\
                            Tip, \
                            {liquid_height_pos[0]}, \
                            {liquid_height_pos[1]}, \
                            {init_probe_time}, \
                            {end_probe_time}, \
                            {initial_motor_pos[OT3Axis.by_mount(mount)]}, \
                            {initial_enc_pos[OT3Axis.by_mount(mount)]}, \
                            {initial_motor_pos[OT3Axis.of_main_tool_actuator(mount)]}, \
                            {initial_enc_pos[OT3Axis.of_main_tool_actuator(mount)]}, \
                            {end_motor_pos[OT3Axis.by_mount(mount)]}, \
                            {end_enc_pos[OT3Axis.by_mount(mount)]}, \
                            {end_motor_pos[OT3Axis.of_main_tool_actuator(mount)]}, \
                            {end_enc_pos[OT3Axis.of_main_tool_actuator(mount)]}, \
                            {tip} \n"
                print(d_str)
                data.append_data_to_file(test_n, test_f, d_str)
                # Blow out a bit
                await move_plunger_relative_ot3(hw_api, mount, 0.5, None, speed = 2)
                print(liquid_height_pos)
                await hw_api.home([OT3Axis.by_mount(mount)])
                # move plunger to bottom
                await move_plunger_absolute_ot3(hw_api, mount, plunger_pos[1])
                # Let's grab the current position to know where we are
                current_position = await hw_api.current_position_ot3(mount, refresh=True)
                # Move to trash slot
                await hw_api.move_to(mount, Point(slot_loc["A3"][0] + 50,
                                                    slot_loc["A3"][1] - 20,
                                                    current_position[OT3Axis.by_mount(mount)]))
                # Drop tip
                await hw_api.drop_tip(mount, home_after = True)
                current_position = await hw_api.current_position_ot3(mount, refresh=True)
                await hw_api.move_to(mount, Point(current_position[OT3Axis.X],
                                                    current_position[OT3Axis.Y],
                                                    home_pos[OT3Axis.by_mount(mount)]))
                tip_count += 1
                y_offset -= 9
                if tip_count % 8 == 0:
                    y_offset = 0
                if tip_count % 8 == 0:
                    x_offset += 9
                target_file = 'pressure_sensor_data.csv'
                rename_file('/var/liquid_sense/', target_file)

        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    except KeyboardInterrupt:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    finally:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        await hw_api.clean_up()


if __name__ == "__main__":
    slot_locs = ["A1", "A2", "A3",
                    "B1", "B2", "B3:",
                    "C1", "C2", "C3",
                    "D1", "D2", "D3"]
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="right")
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="B2")
    parser.add_argument("--dial_slot", type=str, choices=slot_locs, default="C2")
    parser.add_argument("--trough_slot", type=str, choices=slot_locs, default="B3")
    parser.add_argument("--tips", type=int, default = 40)
    parser.add_argument("--start_mount_height", type=float, default = 0)
    parser.add_argument("--prep_move_speed", type=float, default = 5)
    parser.add_argument("--max_z_distance", type=float, default = 40)
    parser.add_argument("--min_z_distance", type=float, default = 5)
    parser.add_argument("--mount_speed", type=float, default = 21.3)
    parser.add_argument("--plunger_speed", type=float, default = 11.3)
    parser.add_argument("--sensor_threshold", type=float, default = 110, help = "Threshold in Pascals")
    parser.add_argument("--expected_liquid_height", type=int, default = 0)
    parser.add_argument("--log_pressure", action="store_true")
    parser.add_argument("--home_plunger_at_start", action="store_true")
    parser.add_argument(
        "--test",
        type=str,
        help="precision_liquid_sense_test",
        default="precision_liquid_sense_test",
    )
    parser.add_argument("--dial_indicator", action="store_true")
    args = parser.parse_args()
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT
    if args.dial_indicator:
        test_data ={
                    "Time_D": None,
                    "Tip Height(mm)": None,
                    "Nozzle Pos(mm)": None,
                    "Tip": None,
                    "Triggered_z_pos": None,
                    "Triggered_zenc_pos": None,
                    "init_Time_L": None,
                    "end_Time_L": None,
                    "init_z_pos(mm)": None,
                    "init_zenc_pos(mm)": None,
                    "init_pmotor_pos(mm)": None,
                    "init_penc_pos(mm)": None,
                    "end_z_pos(mm)": None,
                    "end_zenc_pos(mm)": None,
                    "end_pmotor_pos(mm)": None,
                    "end_penc_pos(mm)": None,
                    "tip": None
                }
        gauge = dial_indicator_setup()
        test_n , test_f  = file_setup(test_data)
    asyncio.run(_main())
