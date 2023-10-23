import asyncio
import argparse
import termios
import sys
import tty
import os
import time
import json
import shutil
import datetime

from typing import Dict
from hardware_testing.opentrons_api.types import OT3Mount, Axis, Point, CriticalPoint
from hardware_testing.opentrons_api.helpers_ot3 import (
    OT3API,
    build_async_ot3_hardware_api,
    home_ot3,
    move_plunger_absolute_ot3,
    get_plunger_positions_ot3,
    move_plunger_relative_ot3,
    get_pressure_ot3
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
                             path +'liquid_sense/pressure_data_{}.csv'.format(time.time()))

def file_setup(test_data, details):
    today = datetime.date.today()
    test_name = "{}-LSD-Z-{}-P-{}-Threshold-{}".format( details[0], # Pipette model
                                            details[1], # mount_speed
                                            details[2], # plunger_speed
                                            details[3]) # sensor threshold
    test_header = dict_keys_to_line(test_data)
    test_tag = "-{}".format(today.strftime("%b-%d-%Y"))
    test_id = data.create_run_id()
    test_path = data.create_folder_for_test_data(test_name)
    test_file = data.create_file_name(test_name, test_id, test_tag)
    data.append_data_to_file(test_name, test_file, test_header)
    print("FILE PATH = ", test_path)
    print("FILE NAME = ", test_file)
    return test_name, test_file

def store_data(test_data, trial):
    today = datetime.date.today()
    test_name = "LS_Pipette_data"
    headers = {'Time(s)': None, 'Pressure(Pa)': None}
    test_header = dict_keys_to_line(headers)
    test_tag = "-{}".format(today.strftime("%b-%d-%Y"), trial)
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

async def move_to_point(api, mount, point, speed, critical_point):
    home_pos = api.get_instrument_max_height(mount, critical_point)
    pos = await api.current_position_ot3(mount, refresh=True, critical_point = critical_point)
    await api.move_to(mount,
                    Point(pos[Axis.X],
                        pos[Axis.Y],
                        home_pos),
                        critical_point = critical_point)
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        home_pos),
                        critical_point = critical_point)
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        point.z),
                    speed = speed,
                    critical_point = critical_point)

async def get_average_pressure(api, mount, num_of_reads):
    pressure_reads = []
    for x in range(1, num_of_reads+1):
        p_read = await get_pressure_ot3(api, mount)
        pressure_reads.append(p_read)
    average = sum(pressure_reads)/len(pressure_reads)

    return average

async def _jog_axis(api, position) -> Dict[Axis, float]:
    step_size = [0.01, 0.05, 0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
    step = step_size[step_length_index]
    xy_speed = 60
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

        elif input == 'q':
            sys.stdout.flush()
            print("TEST CANCELLED")
            quit()

        elif input == '+':
            sys.stdout.flush()
            step_length_index = step_length_index + 1
            if step_length_index >= 7:
                step_length_index = 7
            step = step_size[step_length_index]

        elif input == '-':
            sys.stdout.flush()
            step_length_index = step_length_index -1
            if step_length_index <= 0:
                step_length_index = 0
            step = step_size[step_length_index]

        elif input == '\r':
            sys.stdout.flush()
            position = await api.current_position_ot3(mount, refresh=True)
            return position
        position = await api.current_position_ot3(mount, refresh=True)

        print('Coordinates: ', round(position[Axis.X], 2), ',',
                                round(position[Axis.Y], 2), ',',
                                round(position[Axis.by_mount(mount)], 2), ' Motor Step: ',
                                step_size[step_length_index],
                                end = '')
        print('\r', end='')

async def _main() -> None:
    today = datetime.date.today()
    hw_api = await build_async_ot3_hardware_api(is_simulating=args.simulate,
                                    use_defaults=True,
                                    stall_detection_enable = False)
    await hw_api.cache_instruments()
    pipette_model = hw_api._pipette_handler.hardware_instruments[mount].name
    if args.dial_indicator:
        test_data ={
                    "Time_D": None,
                    "Nozzle_Ch1(mm)": None,
                    "Nozzle_Ch2(mm)": None,
                    "Nozzle_Ch3(mm)": None,
                    "Nozzle_Ch4(mm)": None,
                    "Nozzle_Ch5(mm)": None,
                    "Nozzle_Ch6(mm)": None,
                    "Nozzle_Ch7(mm)": None,
                    "Nozzle_Ch8(mm)": None,
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
                    "Channel_1": None,
                    "Channel_2": None,
                    "Channel_3": None,
                    "Channel_4": None,
                    "Channel_5": None,
                    "Channel_6": None,
                    "Channel_7": None,
                    "Channel_8": None,
                    "true_liquid_height": None,
                    "mount_speed(mm/s)": None,
                    "plunger_speed(mm/s)": None,
                    "sensor_threshold(Pa)": None
                }
        gauge = dial_indicator_setup()
        details = [ pipette_model,
                    args.mount_speed,
                    args.plunger_speed,
                    args.sensor_threshold]
        test_n , test_f  = file_setup(test_data, details)
    # Variables
    tip_column = 0
    columns_to_use = 12
    tip_length = {"T1K": 95.7, "T200": 58.35, "T50": 57.9}
    slot_loc = {"A1": (13.42 , 394.92,110), "A2": (177.32 , 394.92,110), "A3": (341.03 , 394.92,110),
                    "B1": (13.42, 288.42 , 110), "B2": (177.32 , 288.92 ,110), "B3": (341.03, 288.92,110),
                    "C1": (13.42, 181.92, 110), "C2": (177.32, 181.92,110), "C3": (341.03, 181.92,110),
                    "D1": (13.42, 75.5, 110), "D2": (177.32, 75.5,110), "D3": (341.03, 75.5,110)}
    lp_file_name = '/var/{}-P-{}_Z-{}-{}.csv'.format( pipette_model,
                                                    args.plunger_speed,
                                                    args.mount_speed,
                                                    today.strftime("%b-%d-%Y"))
    liquid_probe_settings = LiquidProbeSettings(
                                                max_z_distance = args.max_z_distance,
                                                min_z_distance = args.min_z_distance,
                                                mount_speed = args.mount_speed,
                                                plunger_speed = args.plunger_speed,
                                                sensor_threshold_pascals = args.sensor_threshold,
                                                expected_liquid_height = args.expected_liquid_height,
                                                log_pressure = args.log_pressure,
                                                aspirate_while_sensing = lp_method,
                                                auto_zero_sensor = False,
                                                num_baseline_reads = 10,
                                                data_file = lp_file_name,
                                                )
    try:
        # Home
        await hw_api.home()
        await hw_api.cache_instruments()
        # Save home Position relative to nozzle location
        home_pos = await hw_api.current_position_ot3(mount, refresh=True)
        await hw_api.home_plunger(mount)
        plunger_pos = get_plunger_positions_ot3(hw_api, mount)
        dial_offset = (50, 25, 50)
        tips_to_use = args.tips
        tip_count = 0
        x_offset = 0
        y_offset = 0
        tips_per_column = 8
        cp = CriticalPoint.NOZZLE
        dial_point = Point(slot_loc[args.dial_slot][0] + dial_offset[0],
                            slot_loc[args.dial_slot][1] - dial_offset[1],
                            slot_loc[args.dial_slot][2] + dial_offset[2])
        await move_to_point(hw_api, mount, dial_point, speed = None, critical_point = cp)

        current_position = await hw_api.current_position_ot3(mount, critical_point = cp,  refresh=True)
        # Jog Nozzle to Dial Indicator
        nozzle_loc = await _jog_axis(hw_api, current_position)
        # Save Dial Indicator Nozzle Position
        dial_readings = []
        x_offset = 0
        y_offset = 0
        tip_count = 0
        for nozzle in range(1, 96+1):
            await asyncio.sleep(1)
             x_offset -= 9
            if tip_count % 12 == 0:
                y_offset += 9
            if tip_count % 12 == 0:
                x_offset = 0
            if args.dial_indicator:
                nozzle_measurement = gauge.read()
                dial_readings.append(nozzle_measurement)
                current_position = await hw_api.current_position_ot3(mount, critical_point = cp,  refresh=True)
                # Nozzle Location
                nozzle_pos = Point(nozzle_loc[Axis.X] + x_offset,
                                    nozzle_loc[Axis.Y] + y_offset,
                                    nozzle_loc[Axis.by_mount(mount)])
                if tip_count % 12 == 0:
                    d_str = ''
                    for m in measurements:
                        d_str += str(m) + ','
                    d_str = d_str[:-1] + '\n'
                    print(f"{d_str}")
                    data.append_data_to_file(test_n, test_f, d_str)
                    # Reset Measurements list
                    measurements = []
                    print("\r\n")
            await move_to_point(hw_api, mount, nozzle_pos, speed = None, critical_point = cp)
        x_offset = 0
        y_offset = 0
        start_time =  time.time()
        elasped_time = (time.time() - start_time)
        test_data["Time"] = round(elasped_time, 3)
        test_data["Pipette Pos(mm)"] = nozzle_measurement
        test_data["Type"] = "Nozzle"
        print(test_data)
        d_str = f"{elasped_time}, {dial_readings[0]}, {dial_readings[1]}, {dial_readings[2]}, {dial_readings[3]}, {dial_readings[4]}, {dial_readings[5]}, {dial_readings[6]}, {dial_readings[7]} \n"
        data.append_data_to_file(test_n, test_f, d_str)
        tip_length = tip_length[args.tip_size]
        approach_speed = 20
        number_of_columns = int(tips_to_use/tips_per_column)
        # iterate through columns
        for tip in range(1, number_of_columns+1):
            if tip <= 1:
                cp = CriticalPoint.NOZZLE
                tiprack_point = Point(slot_loc[args.tiprack_slot][0] + x_offset,
                                        slot_loc[args.tiprack_slot][1] + y_offset,
                                        slot_loc[args.tiprack_slot][2])
                await move_to_point(hw_api, mount, tiprack_point, speed = None, critical_point = cp)
                # Jog to tiprack location
                current_position = await hw_api.current_position_ot3(mount, critical_point = cp, refresh=True)
                tiprack_loc = await _jog_axis(hw_api, current_position)
                # Pick up tip
                await hw_api.pick_up_tip(mount, tip_length)
                current_position = await hw_api.current_position_ot3(mount, critical_point = CriticalPoint.TIP, refresh = True)
            else:
                current_position = await hw_api.current_position_ot3(mount, refresh=True)
                print(f"pos: {current_position}")
                print(f"{tiprack_loc}")
                # Move to safe height
                tiprack_point = Point(tiprack_loc[Axis.X] + x_offset,
                                    tiprack_loc[Axis.Y] + y_offset,
                                    tiprack_loc[Axis.by_mount(mount)])
                cp = CriticalPoint.NOZZLE
                await move_to_point(hw_api, mount, tiprack_point, speed = None , critical_point = cp)
                await hw_api.pick_up_tip(mount, tip_length)
            if args.lp_method == 'push_air':
                # Move the plunger to the top position
                await move_plunger_absolute_ot3(hw_api, mount, plunger_pos[0])
            else:
                # Move the plunger to the bottom position
                await move_plunger_absolute_ot3(hw_api, mount, plunger_pos[1])
            z_safe_height = 20
            # Relative to tip
            if tip <= 1:
                # Move XY to Dial Indicator slot
                tip_home_pos = hw_api.get_instrument_max_height(mount, CriticalPoint.TIP)
                tiprack_point = Point(slot_loc[args.dial_slot][0] + dial_offset[0],
                                        slot_loc[args.dial_slot][1] - dial_offset[1],
                                        tip_home_pos)
                cp = CriticalPoint.TIP
                await move_to_point(hw_api, mount, tiprack_point, speed = None, critical_point = cp)
                current_position = await hw_api.current_position_ot3(mount,
                                                                    critical_point = cp,
                                                                    refresh = True)
                tip_loc = await _jog_axis(hw_api, current_position)
            else:
                cp = CriticalPoint.TIP
                # # Move XY to Dial Indicator slot
                dial_loc_tip = Point(tip_loc[Axis.X],
                                    tip_loc[Axis.Y],
                                    tip_loc[Axis.by_mount(mount)])
                await move_to_point(hw_api, mount, dial_loc_tip, speed = approach_speed, critical_point = cp)

            # Save Dial Indicator Tip Position
            dial_readings = []
            x_offset = 0
            y_offset = 0
            for tip in range(1, 9):
                await asyncio.sleep(1)
                tip_measurement = gauge.read()
                dial_readings.append(tip_measurement)
                current_position = await hw_api.current_position_ot3(mount, critical_point = cp,  refresh=True)
                nozzle_pos = Point(nozzle_loc[Axis.X] + x_offset,
                                        nozzle_loc[Axis.Y] + y_offset,
                                        nozzle_loc[Axis.by_mount(mount)])
                await move_to_point(hw_api, mount, nozzle_pos, speed = None, critical_point = cp)
                y_offset += 9
            # Save Dial Indicator Tip Position
            await asyncio.sleep(1)
            tip_measurement = gauge.read()
            elasped_time = (time.time() - start_time)
            test_data["Time_D"] = round(elasped_time, 3)
            test_data["Pipette Pos(mm)"] = tip_measurement
            test_data["Type"] = "Tip"
            print(test_data)
            # Move XY to Dial Indicator slot
            # Jog to top of trough location
            if tip <= 1:
                home_position = await hw_api.current_position_ot3(mount, refresh=True)
                trough_point = Point(slot_loc[args.trough_slot][0],
                                                    slot_loc[args.trough_slot][1],
                                                    slot_loc[args.trough_slot][2])
                cp = CriticalPoint.TIP
                await move_to_point(hw_api, mount, trough_point, speed = None, critical_point = cp)
                p_average = await get_average_pressure(hw_api, mount, 20)
                current_position = await hw_api.current_position_ot3(mount, refresh=True)
                print(" Move to the liquid height")
                true_liquid_height = await _jog_axis(hw_api, current_position)
                print(" Move up to the top of the well")
                trough_loc = await _jog_axis(hw_api, current_position)
            else:
                trough_point = Point(trough_loc[Axis.X],
                                    trough_loc[Axis.Y],
                                    trough_loc[Axis.by_mount(mount)])
                # Move to trought slot
                cp = CriticalPoint.TIP
                await move_to_point(hw_api, mount, trough_point, speed = None, critical_point = cp)
                p_average = await get_average_pressure(hw_api, mount, 20)

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
            test_data["Triggered_z_pos"] = liquid_height_pos[0][Axis.by_mount(mount)]
            test_data["Triggered_zenc_pos"] = liquid_height_pos[1][Axis.by_mount(mount)]
            test_data["init_Time_L"] = init_probe_time
            test_data["end_Time_L"] = end_probe_time
            test_data["init_z_pos(mm)"] = initial_motor_pos[Axis.by_mount(mount)]
            test_data["init_zenc_pos(mm)"] = initial_enc_pos[Axis.by_mount(mount)]
            test_data["init_pmotor_pos(mm)"] = initial_motor_pos[Axis.of_main_tool_actuator(mount)]
            test_data["init_penc_pos(mm)"] = initial_enc_pos[Axis.of_main_tool_actuator(mount)]
            test_data["end_z_pos(mm)"] = end_motor_pos[Axis.by_mount(mount)]
            test_data["end_zenc_pos(mm)"] = end_enc_pos[Axis.by_mount(mount)]
            test_data["end_pmotor_pos(mm)"] = end_motor_pos[Axis.of_main_tool_actuator(mount)]
            test_data["end_penc_pos(mm)"] = end_enc_pos[Axis.of_main_tool_actuator(mount)]
            # print(test_data)
            # print("True Liquid Height: ",true_liquid_height)
            d_str = f"{elasped_time}, \
                        {dial_readings[0]}, \
                        {dial_readings[1]}, \
                        {dial_readings[2]}, \
                        {dial_readings[3]}, \
                        {dial_readings[4]}, \
                        {dial_readings[5]}, \
                        {dial_readings[6]}, \
                        {dial_readings[7]}, \
                        Tip, \
                        {liquid_height_pos[0][Axis.by_mount(mount)]}, \
                        {liquid_height_pos[1][Axis.by_mount(mount)]}, \
                        {init_probe_time}, \
                        {end_probe_time}, \
                        {initial_motor_pos[Axis.by_mount(mount)]}, \
                        {initial_enc_pos[Axis.by_mount(mount)]}, \
                        {initial_motor_pos[Axis.of_main_tool_actuator(mount)]}, \
                        {initial_enc_pos[Axis.of_main_tool_actuator(mount)]}, \
                        {end_motor_pos[Axis.by_mount(mount)]}, \
                        {end_enc_pos[Axis.by_mount(mount)]}, \
                        {end_motor_pos[Axis.of_main_tool_actuator(mount)]}, \
                        {end_enc_pos[Axis.of_main_tool_actuator(mount)]}, \
                        {tip}, \
                        {true_liquid_height[Axis.by_mount(mount)]}, \
                        {args.mount_speed}, \
                        {args.plunger_speed}, \
                        {args.sensor_threshold}, \
                        {p_average}\n"
            # print(d_str)
            init_ls = true_liquid_height[Axis.by_mount(mount)]
            triggered_ls = liquid_height_pos[1][Axis.by_mount(mount)]
            delta = init_ls - triggered_ls
            print("True Liquid Height: ", true_liquid_height[Axis.by_mount(mount)])
            print("Triggered LS Height: ", liquid_height_pos[1][Axis.by_mount(mount)])
            print("Liquid Surface Depth: ", delta)

            data.append_data_to_file(test_n, test_f, d_str)
            if pipette_model == 'p50_multi_flex':
                # Blow out a bit
                await move_plunger_relative_ot3(hw_api, mount, 1.5, None, speed = 2)
            else:
                await move_plunger_relative_ot3(hw_api, mount, 0.25, None, speed = 2)
            current_position = await hw_api.current_position_ot3(mount,
                                                                critical_point = CriticalPoint.TIP,
                                                                refresh=True)
            current_position = await hw_api.current_position_ot3(mount, refresh=True)
            trash_point = Point(slot_loc["A3"][0] + 50,
                                slot_loc["A3"][1] - 20,
                                current_position[Axis.by_mount(mount)])
            cp = CriticalPoint.TIP
            await move_to_point(hw_api, mount, trash_point, speed = None, critical_point = cp)
            # move plunger to bottom
            await move_plunger_absolute_ot3(hw_api, mount, plunger_pos[1])
            # # Move to trash slot
            # Drop tip
            await hw_api.drop_tip(mount, home_after = True)
            current_position = await hw_api.current_position_ot3(mount, refresh=True)
            await hw_api.move_to(mount, Point(current_position[Axis.X],
                                                current_position[Axis.Y],
                                                home_pos[Axis.by_mount(mount)]))
            # cp = CriticalPoint.TIP
            # await move_to_point(hw_api, mount, trash_point, speed = None, cp)
            tip_count += 1
            x_offset += 9
            target_file = 'pressure_sensor_data.csv'
            rename_file('/var/', target_file)

        await hw_api.disengage_axes([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
    except KeyboardInterrupt:
        await hw_api.disengage_axes([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
    finally:
        await hw_api.disengage_axes([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
        await hw_api.clean_up()


if __name__ == "__main__":
    slot_locs = ["A1", "A2", "A3",
                    "B1", "B2", "B3:",
                    "C1", "C2", "C3",
                    "D1", "D2", "D3"]
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--lp_method", type=str, choices=["push_air", "pull_air"], default="push_air")
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="C2")
    parser.add_argument("--dial_slot", type=str, choices=slot_locs, default="D2")
    parser.add_argument("--trough_slot", type=str, choices=slot_locs, default="C3")
    parser.add_argument("--tips", type=int, default = 96)
    parser.add_argument("--max_z_distance", type=float, default = 40)
    parser.add_argument("--min_z_distance", type=float, default = 5)
    parser.add_argument("--mount_speed", type=float, default = 5)
    parser.add_argument("--plunger_speed", type=float, default = 10)
    parser.add_argument("--sensor_threshold", type=int, default = 150, help = "Threshold in Pascals")
    parser.add_argument("--expected_liquid_height", type=int, default = 0)
    parser.add_argument("--tip_size", type=str, default="1000", help="Tip Size")
    parser.add_argument("--log_pressure", action="store_true")
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
    if args.lp_method == "pull_air":
        lp_method = True
    else:
        lp_method = False

    asyncio.run(_main())
