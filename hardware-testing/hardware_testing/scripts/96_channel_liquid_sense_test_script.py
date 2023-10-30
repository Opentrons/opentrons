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
    get_pressure_ot3,
    update_pick_up_distance,
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
    data.append_data_to_file(test_name, test_id, test_file, test_header)
    print("FILE PATH = ", test_path)
    print("FILE NAME = ", test_file)
    return test_name, test_file, test_id

def store_data(test_data, trial):
    today = datetime.date.today()
    test_name = "LS_Pipette_data"
    headers = {'Time(s)': None, 'Pressure(Pa)': None}
    test_header = dict_keys_to_line(headers)
    test_tag = "-{}".format(today.strftime("%b-%d-%Y"), trial)
    test_id = data.create_run_id()
    test_path = data.create_folder_for_test_data(test_name)
    test_file = data.create_file_name(test_name, test_id, test_tag)
    data.append_data_to_file(test_name, test_id, test_file, test_header)
    for d in test_data:
        print(d)
        d_str = f"{d[0]},{d[1]}\n"
        data.append_data_to_file(test_name, test_id, test_file, d_str)
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

async def calibrate_tiprack(api, home_position, mount):
    cp = CriticalPoint.NOZZLE
    tiprack_loc = Point(
                    slot_loc[args.tiprack_slot][0],
                    slot_loc[args.tiprack_slot][1],
                    home_position[Axis.by_mount(mount)])
    print("Calibrate for Pick up tip")
    await move_to_point(api, mount,tiprack_loc, None, cp)
    current_position = await api.current_position_ot3(mount, cp)
    tiprack_loc = await _jog_axis(api, current_position, cp)
    tiprack_loc = Point(tiprack_loc[Axis.X],
                        tiprack_loc[Axis.Y],
                        tiprack_loc[Axis.by_mount(mount)])
    await api.pick_up_tip(
        mount, tip_length=tip_length[args.tip_size]
    )
    await api.home_z(mount)
    cp = CriticalPoint.TIP
    home_with_tip = await api.current_position(mount, cp)
    print("Calibrate Drop Tip Position")
    drop_tip_loc = await _jog_axis(api, home_with_tip, cp)
    drop_tip_loc = Point(drop_tip_loc[Axis.X],
                        drop_tip_loc[Axis.Y],
                        drop_tip_loc[Axis.by_mount(mount)])
    # await update_pick_up_current(hw_api, mount, 1.5)
    # await update_pick_up_speed(hw_api, mount, pick_up_speed)
    # await api.drop_tip(mount)
    return tiprack_loc, drop_tip_loc

async def _jog_axis(api, position, cp) -> Dict[Axis, float]:
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
        if input == "a":
            # minus x direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(-step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif input == "d":
            # plus x direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(step_size[step_length_index], 0, 0), speed=xy_speed
            )

        elif input == "w":
            # minus y direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, step_size[step_length_index], 0), speed=xy_speed
            )

        elif input == "s":
            # plus y direction
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, -step_size[step_length_index], 0), speed=xy_speed
            )

        elif input == "i":
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, 0, step_size[step_length_index]), speed=za_speed
            )

        elif input == "k":
            sys.stdout.flush()
            await api.move_rel(
                mount, Point(0, 0, -step_size[step_length_index]), speed=za_speed
            )

        elif input == "q":
            sys.stdout.flush()
            print("TEST CANCELLED")
            quit()

        elif input == "+":
            sys.stdout.flush()
            step_length_index = step_length_index + 1
            if step_length_index >= 7:
                step_length_index = 7
            step = step_size[step_length_index]

        elif input == "-":
            sys.stdout.flush()
            step_length_index = step_length_index - 1
            if step_length_index <= 0:
                step_length_index = 0
            step = step_size[step_length_index]

        elif input == "\r":
            sys.stdout.flush()
            position = await api.current_position_ot3(
                mount, refresh=True, critical_point=cp
            )
            print("\r\n")
            return position
        position = await api.current_position_ot3(
            mount, refresh=True, critical_point=cp
        )

        print(
            "Coordinates: ",
            round(position[Axis.X], 2),
            ",",
            round(position[Axis.Y], 2),
            ",",
            round(position[Axis.by_mount(mount)], 2),
            " Motor Step: ",
            step_size[step_length_index],
            end="",
        )
        print("\r", end="")

def update_ls_settings(mount_speed, plunger_speed, sensor_thres, file_name):
    lp_settings = LiquidProbeSettings(
                            max_z_distance = args.max_z_distance,
                            min_z_distance = args.min_z_distance,
                            mount_speed = mount_speed,
                            plunger_speed = plunger_speed,
                            sensor_threshold_pascals = sensor_thres,
                            expected_liquid_height = args.expected_liquid_height,
                            log_pressure = args.log_pressure,
                            aspirate_while_sensing = lp_method,
                            auto_zero_sensor = False,
                            num_baseline_reads = 10,
                            data_file = file_name,
                            )
    return lp_settings

async def _main() -> None:
    today = datetime.date.today()
    hw_api = await build_async_ot3_hardware_api(is_simulating=args.simulate,
                                    use_defaults=True,
                                    stall_detection_enable = False)
    await hw_api.cache_instruments()
    pipette_model = hw_api._pipette_handler.hardware_instruments[mount].name
    """
    1. Calibrate Nozzle to Dial Indicator
    2. Read all nozzle measurements and save them
    3. Move to Tip Rack
    4. Calibrate Pipette to Tip Rack
    5. Pick up tips
    6. Move to Dial indicator and measure all tip heights
    7. Calibrate to liquid Surface
    8. Liquid Probe from top of trough
    9. Repeat
    """
    if args.dial_indicator:
        test_data ={
                    "Column 1": None,
                    "Column 2": None,
                    "Column 3": None,
                    "Column 4": None,
                    "Column 5": None,
                    "Column 6": None,
                    "Column 7": None,
                    "Column 8": None,
                    "Column 9": None,
                    "Column 10": None,
                    "Column 11": None,
                    "Column 12": None,
                    "mount_speed(mm/s)": None,
                    "plunger_speed(mm/s)": None,
                    "sensor_threshold(Pa)": None,
                    "true_liquid_height": None,
                }
        gauge = dial_indicator_setup()
        details = [ pipette_model,
                    args.mount_speed,
                    args.plunger_speed,
                    args.sensor_threshold]
        test_n , test_f, test_id  = file_setup(test_data, details)
    # Variables
    tip_column = 0
    p_channels = 96
    nozzle_spacing = 9
    total_columns = 12
    lp_file_name = '/var/{}-P-{}_Z-{}-{}.csv'.format( pipette_model,
                                                    args.plunger_speed,
                                                    args.mount_speed,
                                                    today.strftime("%b-%d-%Y"))

    try:
        # Home
        cp = CriticalPoint.NOZZLE
        await hw_api.home()
        await hw_api.cache_instruments()
        # Save home Position relative to nozzle location
        home_pos = await hw_api.current_position_ot3(mount,
                                                critical_point =cp, refresh=True)
        await hw_api.home_plunger(mount)
        plunger_pos = get_plunger_positions_ot3(hw_api, mount)
        dial_offset = (50, 25, 50)
        tips_to_use = args.tips
        tip_count = 0
        x_offset = 0
        y_offset = 0
        tips_per_column = 8
        cycle = 0
        cp = CriticalPoint.NOZZLE
        dial_point = Point(slot_loc[args.dial_slot][0] + dial_offset[0],
                            slot_loc[args.dial_slot][1] - dial_offset[1],
                            slot_loc[args.dial_slot][2] + dial_offset[2])
        while True:
            cycle += 1
            if args.nozzles:
                await move_to_point(hw_api, mount, dial_point, speed = None, critical_point = cp)
                current_position = await hw_api.current_position_ot3(mount,
                                                critical_point = cp,  refresh=True)
                if cycle == 1:
                    # Jog Nozzle to Dial Indicator
                    nozzle_loc = await _jog_axis(hw_api, current_position, cp)
                # Save Dial Indicator Nozzle Position
                dial_readings = []
                measurements = []
                x_offset = 0
                y_offset = 0
                tip_count = 0
                # Measure each nozzle
                for nozz_count in range(1, p_channels+1):
                    await asyncio.sleep(1)
                    x_offset -= nozzle_spacing
                    if nozz_count % total_columns == 0:
                        y_offset += nozzle_spacing
                    if nozz_count % total_columns == 0:
                        x_offset = 0
                    if args.dial_indicator:
                        nozzle_measurement = gauge.read()
                        print(f"nozzle_measurement: {nozzle_measurement}")
                        dial_readings.append(nozzle_measurement)
                        current_position = await hw_api.current_position_ot3(mount,
                                                    critical_point = cp,  refresh=True)
                        # Nozzle Location
                        nozzle_pos = Point(nozzle_loc[Axis.X] + x_offset,
                                            nozzle_loc[Axis.Y] + y_offset,
                                            nozzle_loc[Axis.by_mount(mount)])
                        print(f"Position: {nozzle_pos}")
                        if nozz_count % total_columns == 0:
                            d_str = ''
                            details = f', Nozzle, {cycle},'
                            for m in dial_readings:
                                d_str += str(m) + ','
                            d_str = d_str[:-1] + details + '\n'
                            print(f"{d_str}")
                            data.append_data_to_file(test_n, test_id, test_f, d_str)
                            # Reset Measurements list
                            dial_readings = []
                            print("\r\n")
                    await move_to_point(hw_api, mount, nozzle_pos, speed = None, critical_point = cp)
            # Move to the tip rack and calibrate
            if args.tiprack:
                if cycle == 1:
                    pickup_loc, droptip_loc = await calibrate_tiprack(hw_api, home_pos, mount)
                    cp = CriticalPoint.TIP
                else:
                    cp = CriticalPoint.NOZZLE
                    print("Picking up Tips")
                    await move_to_point(hw_api, mount, pickup_loc, None, cp)
                    await hw_api.pick_up_tip(
                        mount, tip_length=tip_length[args.tip_size]
                    )
                    cp = CriticalPoint.TIP
            await hw_api.home_z(mount)
            home_w_tip = await hw_api.current_position_ot3(mount,
                                                critical_point = cp, refresh=True)

            # Save first tip location
            if cycle == 1:
                dial_point_w_tip = Point(slot_loc[args.dial_slot][0] + dial_offset[0],
                                    slot_loc[args.dial_slot][1] - dial_offset[1],
                                    home_w_tip[Axis.by_mount(mount)])
                # Move to Dial Indicator Calibration first tip
                await move_to_point(hw_api, mount, dial_point_w_tip, speed = None, critical_point = cp)
                current_position = await hw_api.current_position_ot3(mount, critical_point = cp, refresh = True)
                dial_point = await _jog_axis(hw_api, current_position, cp)
            else:
                dial_point_w_tip = Point(dial_point[Axis.X],
                                    dial_point[Axis.Y],
                                    home_w_tip[Axis.by_mount(mount)])
                # Move to Dial Indicator Calibration first tip
                await move_to_point(hw_api, mount, dial_point_w_tip, speed = None, critical_point = cp)
                dial_p = Point(dial_point[Axis.X],
                                    dial_point[Axis.Y],
                                    dial_point[Axis.by_mount(mount)])
                # Move to Dial Indicator Calibration first tip
                await move_to_point(hw_api, mount, dial_p, speed = None, critical_point = cp)
            dial_readings = []
            measurements = []
            x_offset = 0
            y_offset = 0
            if args.m_tips:
                # Measure each tip
                for tip_count in range(1, p_channels+1):
                    await asyncio.sleep(1)
                    x_offset -= nozzle_spacing
                    if tip_count % total_columns == 0:
                        y_offset += nozzle_spacing
                    if tip_count % total_columns == 0:
                        x_offset = 0
                    if args.dial_indicator:
                        tip_measurement = gauge.read()
                        print(f"Tip Measurement: {tip_measurement}")
                        dial_readings.append(tip_measurement)
                        current_position = await hw_api.current_position_ot3(mount,
                                                    critical_point = cp,  refresh=True)
                        # tip Location
                        tip_pos = Point(dial_point[Axis.X] + x_offset,
                                            dial_point[Axis.Y] + y_offset,
                                            dial_point[Axis.by_mount(mount)])
                        if tip_count % total_columns == 0:
                            d_str = ''
                            details = f', Tips, {cycle},'
                            for m in dial_readings:
                                d_str += str(m) + ','
                            d_str = d_str[:-1] +  details + '\n'
                            print(f"{d_str}")
                            data.append_data_to_file(test_n, test_id, test_f, d_str)
                            # Reset Measurements list
                            dial_readings = []
                            print("\r\n")
                    await move_to_point(hw_api, mount, tip_pos, speed = None, critical_point = cp)
            if args.trough:
                cp = CriticalPoint.TIP
                if cycle == 1:
                    trough_home_loc = Point(slot_loc[args.trough_slot][0],
                                    slot_loc[args.trough_slot][1],
                                    home_w_tip[Axis.by_mount(mount)])
                    print("Move to Trough")
                    await move_to_point(hw_api, mount, trough_home_loc, None, cp)
                    current_position = await hw_api.current_position_ot3(mount,
                                                        critical_point = cp,  refresh=True)
                    print("Find the liquid surface by jogging")
                    tip_loc = await _jog_axis(hw_api, current_position, cp)
                    trough_loc = Point(tip_loc[Axis.X],
                                    tip_loc[Axis.Y],
                                    tip_loc[Axis.by_mount(mount)] + 10)
                else:
                    trough_home_loc = Point(tip_loc[Axis.X],
                                    tip_loc[Axis.Y],
                                    home_w_tip[Axis.by_mount(mount)])
                    await move_to_point(hw_api, mount, trough_home_loc, None, cp)
                    trough_loc = Point(tip_loc[Axis.X],
                                    tip_loc[Axis.Y],
                                    tip_loc[Axis.by_mount(mount)] + 10)
                # Move to trough
                await move_to_point(hw_api, mount, trough_loc, None, cp)
                mount_speed = int(input("Enter Mount Speed: "))
                plunger_speed = int(input("Enter Plunger Speed: "))
                sensor_threshold = int(input("Enter Sensor Threshold: "))
                liquid_probe_settings = update_ls_settings(mount_speed,
                                                            plunger_speed,
                                                            sensor_threshold,
                                                            lp_file_name)
                trig_val, enc_trig_val = await hw_api.liquid_probe(mount = mount, probe_settings = liquid_probe_settings)
                trig_ls_height = trig_val[Axis.by_mount(mount)]
                enc_trig_ls_height = enc_trig_val[Axis.by_mount(mount)]
                print(f"triggered ls Height(mm): {trig_ls_height}")
                d_str = f'triggered_value, {trig_ls_height}, enc_triggered_value, '
                d_str += f'{enc_trig_ls_height}, {mount_speed}, {plunger_speed}, '
                d_str += f'{sensor_threshold}, {tip_loc[Axis.by_mount(mount)]}, ' + '\n'
                data.append_data_to_file(test_n, test_id, test_f, d_str)
            await move_to_point(hw_api, mount, droptip_loc, None, cp)
            await hw_api.drop_tip(mount)
            await hw_api.home_z(mount)
            input("Enter new tip rack")
        # target_file = 'pressure_sensor_data.csv'
        # rename_file('/var/', target_file)
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
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="B2")
    parser.add_argument("--dial_slot", type=str, choices=slot_locs, default="C2")
    parser.add_argument("--trough_slot", type=str, choices=slot_locs, default="B3")
    parser.add_argument("--tips", type=int, default = 96)
    parser.add_argument("--max_z_distance", type=float, default = 40)
    parser.add_argument("--min_z_distance", type=float, default = 5)
    parser.add_argument("--mount_speed", type=float, default = 5)
    parser.add_argument("--plunger_speed", type=float, default = 10)
    parser.add_argument("--sensor_threshold", type=int, default = 150, help = "Threshold in Pascals")
    parser.add_argument("--expected_liquid_height", type=int, default = 0)
    parser.add_argument("--tip_size", type=str, default="T50", help="Tip Size")
    parser.add_argument("--log_pressure", action="store_true")
    parser.add_argument("--tiprack", action="store_true")
    parser.add_argument("--nozzles", action="store_true")
    parser.add_argument("--m_tips", action="store_true")
    parser.add_argument("--trough", action="store_true")
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

    tip_length = {"T1K": 95.7, "T200": 58.35, "T50": 57.9}
    slot_loc = {"A1": (13.42 , 394.92,110), "A2": (177.32 , 394.92,110), "A3": (341.03 , 394.92,110),
                "B1": (13.42, 288.42 , 110), "B2": (177.32 , 288.92 ,110), "B3": (341.03, 288.92,110),
                "C1": (13.42, 181.92, 110), "C2": (177.32, 181.92,110), "C3": (341.03, 181.92,110),
                "D1": (13.42, 75.5, 110), "D2": (177.32, 75.5,110), "D3": (341.03, 75.5,110)}

    asyncio.run(_main())
