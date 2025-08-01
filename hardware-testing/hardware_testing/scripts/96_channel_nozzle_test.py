"""Single Channel Dynamic Dead Volume Test."""

import argparse
import asyncio
import time
from typing import Dict, Literal, List
import datetime
import os, sys
import termios
import tty
import json
from dataclasses import dataclass
from enum import Enum

from hardware_testing.opentrons_api.types import(
    OT3Mount,
    Axis,
    Point,
    CriticalPoint,
)
import csv
from hardware_testing.opentrons_api import helpers_ot3

from hardware_testing import data
from hardware_testing.data import ui, get_testing_data_directory
from hardware_testing.drivers import mitutoyo_digimatic_indicator
from opentrons.config.types import(LiquidProbeSettings)
from opentrons.hardware_control.types import InstrumentProbeType
from opentrons.hardware_control.motion_utilities import (target_position_from_plunger)
from opentrons.hardware_control.types import (
    InstrumentProbeType,
    PipetteSensorId,
    OT3Mount,
    Axis,
    top_types,
    PipetteSensorResponseQueue,
    HardwareAction
)

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

async def jog(api, mount, position, cp) -> Dict[Axis, float]:
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
        elif input == "t":
            sys.stdout.flush()
            await helpers_ot3.move_tip_motor_relative_ot3(api,
                                                step_size[step_length_index], 
                                                motor_current = 1.5,
                                                speed=za_speed,
                                                )
        elif input == "g":
            sys.stdout.flush()
            await helpers_ot3.move_tip_motor_relative_ot3(api,
                                                -step_size[step_length_index], 
                                                motor_current = 1.5,
                                                speed=za_speed,
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
            await api._update_position_estimation([Axis.by_mount(mount)])
            position = await api.encoder_current_position_ot3(
                mount, critical_point=cp, refresh=True
            )
            print("\r\n")
            return position
        await api._update_position_estimation([Axis.by_mount(mount)])
        position = await api.encoder_current_position_ot3(
            mount, critical_point=cp, refresh = True
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

async def move_to_point(api, mount, point, cp):
    home_pos = api.get_instrument_max_height(mount, cp)
    home_offset = 5
    pos = await api.current_position_ot3(mount, refresh=True, critical_point = cp)
    await api.move_to(mount,
                    Point(pos[Axis.X],
                        pos[Axis.Y],
                        home_pos-home_offset),
                    speed=None,
                    expect_stalls=False)
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        home_pos-home_offset),
                    speed=None,
                    expect_stalls=False)
    await api.move_to(mount,
                    Point(point.x,
                        point.y,
                        point.z),
                    speed=None,
                    expect_stalls=False)
    
async def calibrate_tiprack(api, mount) -> Point:
    cp = CriticalPoint.NOZZLE
    tiprack_loc = Point(
                    deck_slot['deck_slot'][args.tiprack_slot]['X'],
                    deck_slot['deck_slot'][args.tiprack_slot]['Y'],
                    deck_slot['deck_slot'][args.tiprack_slot]['Z'])
    print(tiprack_loc)
    print("Calibrate for Pick up tip")
    await move_to_point(api, mount, tiprack_loc, cp)
    current_position = await api.current_position_ot3(mount, cp)
    tiprack_loc_dict = await jog(api, current_position, cp)
    tiprack_loc = Point(tiprack_loc_dict[Axis.X],
                        tiprack_loc_dict[Axis.Y],
                        tiprack_loc_dict[Axis.by_mount(mount)])
    return tiprack_loc

def load_config_(filename: str) -> Dict:
    """This function loads a given config file"""
    try:
        with open(filename, 'r') as file:
            data = json.load(file)
    except FileNotFoundError:
        print('Warning: {0} not found'.format(filename))
        data = {}
    except json.decoder.JSONDecodeError:
        print('Error: {0} is corrupt'.format(filename))
        data = {}
    return data

def save_config_(filename: str, data: str) -> Dict:
    """This function saves a given config file with data"""
    try:
        with open(filename, 'w') as file:
            json.dump(
                data, file, sort_keys=True, indent=4, separators=(',', ': ')
                    )
    except FileNotFoundError:
        print('Warning: {0} not found'.format(filename))
        data = {}
    except json.decoder.JSONDecodeError:
        print('Error: {0} is corrupt'.format(filename))
        data = {}
    return data

async def _main(args: argparse.Namespace) -> None:
    hw_api = await helpers_ot3.build_async_ot3_hardware_api(
                                                            is_simulating=False,
                                                            pipette_left='P200_96_v3.5',
                                                            stall_detection_enable=False,
                                                            )
    fw = hw_api.get_fw_version()
    print(f'fw version: {fw}')
    await hw_api.cache_instruments()
    attached_instr = hw_api.get_all_attached_instr()[mount]
    if attached_instr is not None and mount in attached_instr:
        pipette_model = attached_instr[mount.value]["pipette_id"]
    else:
        pipette_model = None
    instr = hw_api._pipette_handler.get_pipette(mount)
    try:
        await hw_api.home()
        await hw_api.set_lights(rails=True)
        await hw_api.update_nozzle_configuration_for_mount(OT3Mount.LEFT, 'A1', 'A1')
        home_position = await hw_api.current_position_ot3(mount)
        cp = CriticalPoint.NOZZLE
        details = [pipette_model, 'default-current']
        tip_length = tip_length_dict[args.tip_size] 
        cp = CriticalPoint.NOZZLE
        tiprack_loc = Point(
                    deck_slot['deck_slot'][args.tiprack_slot]['X'],
                    deck_slot['deck_slot'][args.tiprack_slot]['Y'],
                    deck_slot['deck_slot'][args.tiprack_slot]['Z'])
        await move_to_point(hw_api, mount, tiprack_loc, cp)
        pick_up_loc = await jog(hw_api, mount, tiprack_loc, cp)
        deck_slot['deck_slot'][args.tiprack_slot][Axis.X.name] = pick_up_loc[Axis.X]
        deck_slot['deck_slot'][args.tiprack_slot][Axis.Y.name] = pick_up_loc[Axis.Y]
        deck_slot['deck_slot'][args.tiprack_slot]['Z'] = pick_up_loc[Axis.by_mount(mount)]
        save_config_(path+cal_fn, deck_slot)
        await hw_api.pick_up_tip(
                                mount, 
                                tip_length=(tip_length-tip_overlap))
        await helpers_ot3.move_tip_motor_relative_ot3(hw_api,
                                                5, 
                                                motor_current = 1.5,
                                                speed=10,
                                                )
        retract = Point(
                    pick_up_loc[Axis.X],
                    pick_up_loc[Axis.Y],
                    home_position[Axis.by_mount(mount)])
        await hw_api.move_to(mount,
                             retract,
                             speed = None,
                             expect_stalls=False)
        input("Press Enter to return tip")
        cp = CriticalPoint.TIP
        drop_loc = Point(pick_up_loc[Axis.X],
                            pick_up_loc[Axis.Y],
                            pick_up_loc[Axis.by_mount(mount)]-(tip_length-tip_length*0.5))
        await move_to_point(hw_api, mount, drop_loc, cp)
        await hw_api.drop_tip(mount)
        await hw_api.home_z(mount)

    except Exception as e:
        await hw_api.disengage_axes([Axis.X, Axis.Y])
        raise(f'Error: {e}')
    except KeyboardInterrupt:
        await hw_api.disengage_axes([Axis.X, Axis.Y])
        raise('Cancelled by User')
    finally:
        await hw_api.clean_up()
        print('Test Complete')

if __name__ == "__main__":
    slot_locs = [
        "A1",
        "A2",
        "A3",
        "B1",
        "B2",
        "B3:",
        "C1",
        "C2",
        "C3",
        "D1",
        "D2",
        "D3",
    ]
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--trough", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="B2")
    parser.add_argument("--dial_slot", type=str, choices=slot_locs, default="C2")
    parser.add_argument("--dial_indicator", action="store_true")
    parser.add_argument("--calibrate", action="store_true")
    parser.add_argument("--measure_nozzles", action="store_true")
    parser.add_argument("--columns", action="store_true")
    parser.add_argument("--num_cols", type=float, default=1)
    parser.add_argument("--rows", action="store_true")
    parser.add_argument("--num_rows", type=float, default=1)
    parser.add_argument("--tip_size", type=str, default="T50", help="Tip Size")
    parser.add_argument("--nozzles", type=int, default=1)
    parser.add_argument("--press_comp", type=float, default = 0.0)
    parser.add_argument("--mount_speed", type=int, default = 3)
    parser.add_argument("--plunger_speed", type=int, default = 5)
    parser.add_argument("--pipette", type=int, choices=[50, 200, 1000], default=50)
    parser.add_argument("--method", type=str, choices=["one", "eight", "every"], default="every")
    parser.add_argument("--pressure_threshold", type=int, default=1000)
    parser.add_argument(
        "--dial_port", type=str, default="/dev/ttyUSB1", help="Dial indicator Port"
    )
    args = parser.parse_args()
    path = '/data/testing_data/'
    cal_fn = 'calibrations.json'
    if args.calibrate:
        with open(path + cal_fn, 'r') as openfile:
            deck_slot = json.load(openfile)
            print(deck_slot)
    else:
        with open(path + cal_fn, 'r') as openfile:
            deck_slot = json.load(openfile)
    tip_length_dict = {"T1K": 95.6, "T200": 58.35, "T50": 57.9}
    tip_overlap_dict = {"T1K": 9.651, "T200": 9.759, "T50": 10.088}
    tip_overlap = tip_overlap_dict[args.tip_size]
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT

    asyncio.run(_main(args))