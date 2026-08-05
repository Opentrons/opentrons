"""Demo OT3 Gantry Functionality."""
import argparse
import asyncio
from typing import Any, Dict, List, Optional, Tuple
import datetime
import sys
import termios
import tty
import math
from opentrons.hardware_control.ot3api import OT3API
import serial.tools.list_ports  # type: ignore[import-untyped]

from opentrons.hardware_control.types import OT3Mount, Axis, CriticalPoint
from opentrons.types import Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
)

from hardware_testing import data


def _dict_keys_to_line(dict: Dict[str, str]) -> str:
    return str.join(",", list(dict.keys())) + "\n"


def file_setup(
    test_data: Dict[str, Any], details: List[Optional[str]]
) -> Tuple[str, str]:
    """Sets up the testing files."""
    today = datetime.date.today()
    test_name = "{}-tip_length-test".format(
        details[0],  # Pipette id
    )
    test_header = _dict_keys_to_line(test_data)
    test_tag = "-{}".format(today.strftime("%b-%d-%Y"))
    test_id = data.create_run_id()
    test_path = data.create_folder_for_test_data(test_name)
    test_file = data.create_file_name(test_name, test_id, test_tag)
    data.append_data_to_file(test_name, test_id, test_file, test_header)
    print("FILE PATH = ", test_path)
    print("FILE NAME = ", test_file)
    return test_name, test_file


def getch() -> str:
    """This functions gets a single input keyboard character from the user.

    fd: file descriptor stdout, stdin, stderr
    """
    ch = ""
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        ch = sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
    return ch


async def jog(
    api: OT3API, position: Dict[Axis, float], cp: CriticalPoint
) -> Dict[Axis, float]:
    """Jog the given axis a specified distance (mm)."""
    step_size = [0.01, 0.05, 0.1, 0.5, 1, 10, 20, 50]
    step_length_index = 3
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

        elif input == "-":
            sys.stdout.flush()
            step_length_index = step_length_index - 1
            if step_length_index <= 0:
                step_length_index = 0

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


async def move_to_point(
    api: OT3API, mount: OT3Mount, point: Point, cp: CriticalPoint
) -> None:
    """Move the mount to a specified point on the deck."""
    home_pos = api.get_instrument_max_height(mount, cp)
    pos = await api.current_position_ot3(mount, refresh=True, critical_point=cp)
    await api.move_to(mount, Point(pos[Axis.X], pos[Axis.Y], home_pos))
    await api.move_to(mount, Point(point.x, point.y, home_pos))
    await api.move_to(mount, Point(point.x, point.y, point.z))


async def _main() -> None:
    # tips_to_use = 96
    slot_loc = {
        "A1": (13.42, 394.92, 110),
        "A2": (177.32, 394.92, 110),
        "A3": (341.03, 394.92, 110),
        "B1": (13.42, 288.42, 110),
        "B2": (177.32, 288.92, 110),
        "B3": (341.03, 288.92, 110),
        "C1": (13.42, 181.92, 110),
        "C2": (177.32, 181.92, 110),
        "C3": (341.03, 181.92, 110),
        "D1": (13.42, 75.5, 110),
        "D2": (177.32, 75.5, 110),
        "D3": (341.03, 75.5, 110),
    }
    hw_api = await build_async_ot3_hardware_api(
        is_simulating=args.simulate, use_defaults=True
    )
    increment = 0.25
    total_travel = 13
    num_steps = int(total_travel / increment)
    try:
        # home gantry and cache instruments
        await hw_api.home()
        await hw_api.cache_instruments()
        # Home Plunger
        await hw_api.home_plunger(mount)
        # Get max instrument height for the mount and critical point
        nozzle_home_pos = hw_api.get_instrument_max_height(mount, CriticalPoint.NOZZLE)
        # pipette_id = hw_api._pipette_handler.hardware_instruments[OT3Mount.LEFT]._pipette_id  # type: ignore
        # details = [pipette_id]
        # test_n, test_f = file_setup(dial_data, details)
        
        rack_x = 177.32 
        rack_y = 181.92
        cp = CriticalPoint.NOZZLE
        pos = await hw_api.current_position_ot3(mount, refresh=True, critical_point=cp)
        await move_to_point(hw_api, mount, Point(rack_x, rack_y, nozzle_home_pos), cp)
        print("Moved over tip rack")
        # zero pipette position
        # place pipette over tip rack 
        print("Jog down until sheath is unsheathed, then press Enter")
        current_position = await hw_api.current_position_ot3(mount, critical_point=cp)
        # jog z axis down until sheath is unsheathed
        unsheath_pos = await jog(hw_api, current_position, cp)
        
        zero_position = await hw_api.current_position_ot3(
            mount, refresh=True, critical_point=cp
        )
        z_enc = await hw_api.encoder_current_position_ot3(
            mount, refresh=True, critical_point=cp
        )
        print("Zeroed at Z: ", round(zero_position[Axis.by_mount(mount)], 3))
        print(
                "Step: ", 0,
                " Z: ", round(zero_position[Axis.by_mount(mount)], 3),
                " Encoder: ", round(z_enc[Axis.by_mount(mount)], 3),
                " Rel: ", round(0, 3),
            )
        for i in range(1, num_steps + 1):         
            # zero graph
            input('Press Enter to zero the graph and start recording data')
            # raise z axis in 0.25mm increments until sheath goes back to zero position
            await hw_api.move_rel(mount, Point(0, 0, increment), speed=5)
            position = await hw_api.current_position_ot3(
                mount, refresh=True, critical_point=cp
            )
            encoder_pos = await hw_api.encoder_current_position_ot3(
                mount=mount, critical_point=cp
            )
            z_pos = position[Axis.by_mount(mount)]
            z_enc = encoder_pos[Axis.by_mount(mount)]
            rel_pos = z_pos - zero_position[Axis.by_mount(mount)]

            # data_line = "{},{},{},{}\n".format(i, z_pos, z_enc, rel_pos)
            # data.append_data_to_file(test_n, test_f, data_line)
            
            print(
                "Step: ", i,
                " Z: ", round(z_pos, 3),
                " Encoder: ", round(z_enc, 3),
                " Rel: ", round(rel_pos, 3),
            )
        #record data as pipette raises
        await hw_api.home_z(mount)

    except KeyboardInterrupt:
        await hw_api.disengage_axes([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
    finally:
        await hw_api.disengage_axes([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
        await hw_api.clean_up()


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
    parser.add_argument("--tiprack", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="C1")
    parser.add_argument("--dial_slot", type=str, choices=slot_locs, default="C2")
    parser.add_argument("--dial_indicator", action="store_true")
    parser.add_argument("--tip_size", type=str, default="T200", help="Tip Size")
    parser.add_argument("--tips_to_use", type=int, default=96)
    parser.add_argument("--channel", type=int, default=1)
    args = parser.parse_args()
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT

    asyncio.run(_main())