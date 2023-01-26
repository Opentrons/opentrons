import asyncio
import argparse
import termios
import sys
import tty
import os
import time
import json

from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    OT3API,
    build_async_ot3_hardware_api,
    home_ot3
)

from opentrons.config.types import LiquidProbeSettings
from hardware_testing import data
from hardware_testing.drivers import mitutoyo_digimatic_indicator

def dict_keys_to_line(dict):
    return str.join(",", list(dict.keys()))+"\n"

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
            position = await api.current_position_ot3(mount)
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
        position = await api.current_position_ot3(mount)

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
    slot_locations = {"A1": (0,0,0), "A2": (0,0,0), "A3": (0,0,0),
                    "B1": (0,0,0), "B2": (0,0,0), "B3:": (0,0,0),
                    "C1": (0,0,0), "C2": (0,0,0), "C3": (0,0,0),
                    "D1": (0,0,0), "D2": (0,0,0), "D3": (0,0,0)}
    try:
        # Home
        await home_ot3(hw_api, [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        home_pos = await hw_api.current_position_ot3(mount)
        start_loc = {OT3Axis.X: 150,
                    OT3Axis.Y: 200,
                    OT3Axis.by_mount(mount): home_pos[OT3Axis.by_mount(mount)]}
        await hw_api.cache_instruments()
        await hw_api.home_plunger(mount)
        if args.test == 'precision_liquid_sense_test':
            start_time =  time.time()
            # Move to starting location
            await hw_api.move_to(mount, Point(start_loc[OT3Axis.X],
                                                start_loc[OT3Axis.Y],
                                                home_pos[OT3Axis.by_mount(mount)]))
            # Move to slot
            await hw_api.move_to(mount, Point(slot_loc[OT3Axis.X],
                                                slot_loc[OT3Axis.Y],
                                                home_pos[OT3Axis.by_mount(mount)]))
            current_position = await hw_api.current_position_ot3(mount)
            # Jog Nozzle to Dial Indicator
            nozzle_loc = await _jog_axis(hw_api, current_position)
            # Save Dial Indicator Nozzle Position
            await asyncio.sleep(2)
            elasped_time = (time.time() - start_time)/60
            test_data["Time"] = round(elasped_time, 3)
            test_data["Tip Height(mm)"] = "No Tip"
            test_data["Nozzle Pos(mm)"] = gauge.read_stable(timeout=20)
            test_data["Tip"] = "No Tip"
            print(test_data)
            d_str = f"{elasped_time}, {gauge.read_stable(timeout=20)}, Nozzle \n"
            data.append_data_to_file(test_n, test_f, d_str)
            # Move to tiprack slot
            await hw_api.move_to(mount, Point(slot_loc[OT3Axis.X],
                                                slot_loc[OT3Axis.Y],
                                                home_pos[OT3Axis.by_mount(mount)]))
            # Jog to tiprack location
            tiprack_loc = await _jog_axis(hw_api, current_position)

            await hw_api.pick_up_tip(mount)

            # Move to trought slot
            await hw_api.move_to(mount, Point(slot_loc[OT3Axis.X],
                                                slot_loc[OT3Axis.Y],
                                                home_pos[OT3Axis.by_mount(mount)]))
            # Jog to top of trough location
            trough_loc = await _jog_axis(hw_api, current_position)
            # Probe Liquid
            hw_api.liquid_probe(mount, probe_settings)

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
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--slot", type=str, choices=slot_locs, default="C2")
    parser.add_argument("--tips", type=int, default = 12)
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
                    "Time": None,
                    "Tip Height(mm)": None,
                    "Nozzle Pos(mm)": None,
                    "Tip": None
                }
        gauge = dial_indicator_setup()
        test_n , test_f  = file_setup(test_data)
    asyncio.run(_main())
