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

from hardware_testing.drivers import mitutoyo_digimatic_indicator as dial


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

STALL_THRESHOLD = 0.25
CYCLES = 25

async def _main(is_simulating: bool, mount: types.OT3Mount) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)

    test_pip = api.get_attached_instrument(mount)
    test_tag = test_pip['name']
    test_robot = input("Enter robot ID:\n\t>> ")

    test_name = "pipette-plunger-stall-test"
    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    header = ['Cycle', 'Test Robot', 'Test Pipette', 'Init Position Read (mm)', 'Stall Position Read (mm)', 'Difference (mm)', 'Encoder Value Before', 'Encoder Value After']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    await api.home()
    await api.home_plunger(mount)
    print("Move to dial indicator fixture\n")
    cur_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.NOZZLE)
    fixture_position = await jog(api, cur_pos, CriticalPoint.NOZZLE)
    top_pos, bottom_pos, _, drop_pos = helpers_ot3.get_plunger_positions_ot3(api, mount)
    pipette_ax = types.OT3Axis.of_main_tool_actuator(mount)
    # await helpers_ot3.move_plunger_absolute_ot3(api, mount, drop_pos)
    # ### Record measurement from dial indicator ###
    # time.sleep(1)
    # await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom_pos)
    # await api.move_rel(mount, delta=Point(z=10))

    ### loop # of trials -->
    for cycle in range(CYCLES):
        print("Move to drop tip position\n")
        await helpers_ot3.move_plunger_absolute_ot3(api, mount, drop_pos)
        time.sleep(1)

        init_reading = gauge.read()
        init_encoder_pos = await api.encoder_current_position_ot3(mount, refresh=True)
        await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom_pos)
        await api.move_rel(mount, delta=Point(z=10))

        while(1):
            print("Move to top plunger position\n")
            await helpers_ot3.move_plunger_absolute_ot3(api, mount, top_pos, motor_current=0.15, speed=90)
            print("Move to bottom plunger position\n")
            await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom_pos, motor_current=0.15, speed=90)

            # pipette_ax = types.OT3Axis.of_main_tool_actuator(mount)
            current_pos = await api.current_position_ot3(mount, refresh=True)
            est = current_pos[pipette_ax]
            encoder_pos = await api.encoder_current_position_ot3(mount, refresh=True)
            enc = encoder_pos[pipette_ax]
            stalled_mm = est - enc

            if abs(stalled_mm) > STALL_THRESHOLD:
                print(f"STALLED: {stalled_mm} mm\n")
                await api._update_position_estimation([pipette_ax])
                current_pos = await api.current_position_ot3(mount, refresh=True) ###
                encoder_pos = await api.encoder_current_position_ot3(mount, refresh=True) ###
                print(f"Updated position:\nCurrent Position: {current_pos}\nEncoder Position: {encoder_pos}\n") ###
                break

        print("Move to dial indicator fixture\n")
        await api.move_rel(mount, delta=Point(z=-10))
        print("Move to drop tip position\n")
        await helpers_ot3.move_plunger_absolute_ot3(api, mount, drop_pos)
        time.sleep(1)

        stall_reading = gauge.read()
        stall_encoder_pos = await api.encoder_current_position_ot3(mount, refresh=True)

        reading_diff = init_reading - stall_reading

        await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom_pos)

        if cycle > 0:
            test_robot = ""
            test_tag = ""

        cycle_data = [cycle+1, test_robot, test_tag, init_reading, stall_reading, reading_diff, init_encoder_pos[pipette_ax], stall_encoder_pos[pipette_ax]]
        cycle_data_str = data.convert_list_to_csv_line(cycle_data)
        data.append_data_to_file(test_name=test_name, file_name=file_name, data=cycle_data_str)
        # await api.move_rel(mount, delta=Point(z=10))
        await api.home_plunger(mount)
        ### <-- end of 1 cycle



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
    parser.add_argument(
        "--mod_port", type=str, required=False, default = "/dev/ttyUSB0")
    args = parser.parse_args()
    mount = mount_options[args.mount]

    gauge = dial.Mitutoyo_Digimatic_Indicator(port=args.mod_port)
    gauge.connect()

    asyncio.run(_main(args.simulate, mount))
