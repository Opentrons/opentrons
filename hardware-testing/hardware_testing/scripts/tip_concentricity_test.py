import argparse
import asyncio
import time

import os
import sys
import termios, tty
import json

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from hardware_testing.opentrons_api.types import OT3Mount, OT3Axis, Point

from opentrons.hardware_control.types import CriticalPoint

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

async def jog(api, position, cp):
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
            round(position[OT3Axis.X], 2),
            ",",
            round(position[OT3Axis.Y], 2),
            ",",
            round(position[OT3Axis.by_mount(mount)], 2),
            " Motor Step: ",
            step_size[step_length_index],
            end="",
        )
        print("\r", end="")


async def _main(is_simulating: bool, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home()
    await api.home_plunger(mount)

    test_tag = input("Enter test tag:\n\t>> ")
    test_robot = input("Enter robot ID:\n\t>> ")

    AXIS = OT3Axis.Z_L
    COLUMNS = 12
    GAUGES = 5

    test_pip = api.get_attached_instrument(mount)
    print("mount.id:{}".format(test_pip["pipette_id"]))
    if(len(test_pip) == 0):
        print(f"No pipette recognized on {mount.name} mount\n")
        sys.exit()
    # if('' in test_pip['name']):
    #     tip_len = 85
    tip_len = 85

    test_name = "tip-concentricity-test"

    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag])
    header = ['Trial', 'Test Robot', 'Pipette', 'Tip', 'Currrent', 'Diameter (mm)', 'Pass/Fail']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    print("Calibrate tip rack location")
    print("Move to tip rack...\n")
    cur_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.NOZZLE)
    tip_rack_position = await jog(api, cur_pos, CriticalPoint.NOZZLE)

    for gauge in range(GAUGES):
        print(f"Gauge: {gauge+1}\n")
        print("Move to tip rack...\n")
        await api.move_to(mount, tip_rack_position)
        if gauge > 0 and input("Reposition? (y/n)\n\t>> ").lower() == 'y':
            cur_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.NOZZLE)
            tip_rack_position = await jog(api, cur_pos, CriticalPoint.NOZZLE)
        print("Picking up tips...\n")
        await api.pick_up_tip(mount, tip_length=tip_len, prep_after=False)

        for i in range(COLUMNS):
            print(f"Column: {i+1}\n")

            print("Move to machined cut out...\n")
            if i == 0:
                cur_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.TIP)
                machined_cut_out_position = await jog(api, cur_pos, CriticalPoint.TIP)
            else:
                cur_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.TIP)
                await api.move_to(mount, Point(machined_cut_out_position[OT3Axis.X], machined_cut_out_position[OT3Axis.Y], cur_pos[AXIS]))
                await api.move_to(mount, machined_cut_out_position)
                if input("Reposition? (y/n)\n\t>> ").lower() == 'y':
                    cur_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.TIP)
                    tip_rack_position = await jog(api, cur_pos, CriticalPoint.TIP)

            result = input("Pass or fail?\n\t>> ")
            print("Moving up...\n")
            await api.move_rel(mount, delta=Point(z=50))
            input("Remove tips. Press '\enter\' to continue.\n\t>> ")

            ### SAVE CSV DATA


        if(gauge != 4):
            print("Refill tip rack and switch to next gauge...\n")


if __name__ == "__main__":
    mount_options = {
        "left": types.OT3Mount.LEFT,
        "right": types.OT3Mount.RIGHT,
        "gripper": types.OT3Mount.GRIPPER,
    }
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument(
        "--mount", type=str, choices=list(mount_options.keys()), default="left"
    )

    args = parser.parse_args()
    mount = mount_options[args.mount]

    asyncio.run(_main(args.simulate, mount))
