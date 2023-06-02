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
from opentrons.hardware_control.ot3api import OT3API

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
DEFAULT_CURRENT = 1.0
DEFAULT_SPEED = 45

async def _plunger_alignment(api: OT3API, mount: OT3Mount) -> bool:
    print("Checking alignment...\n")
    pipette_ax = types.OT3Axis.of_main_tool_actuator(mount)
    current_pos = await api.current_position_ot3(mount, refresh=True)
    est = current_pos[pipette_ax]
    encoder_pos = await api.encoder_current_position_ot3(mount, refresh=True)
    enc = encoder_pos[pipette_ax]
    stalled_mm = est - enc
    if abs(stalled_mm) < STALL_THRESHOLD:
        print(f"=== ALIGNED: {round(stalled_mm, 2)} mm ===\n\t>> est: {est}\n\t>> enc: {enc}\n")
        return True
    else:
        print(f"=== STALLED: {round(stalled_mm, 2)} mm ===\n\t>> est: {est}\n\t>> enc: {enc}\n")
        return False

async def _plunger_stall(api: OT3API, mount: OT3Mount) -> None:
    # print(f"=== STALLED ===\n")
    pipette_ax = types.OT3Axis.of_main_tool_actuator(mount)
    await api._update_position_estimation([pipette_ax])
    current_pos = await api.current_position_ot3(mount, refresh=True)
    encoder_pos = await api.encoder_current_position_ot3(mount, refresh=True)
    print(f"Updated position:\n\t>> Current Position: {current_pos[pipette_ax]}\n\t>> Encoder Position: {encoder_pos[pipette_ax]}\n")

async def _main(is_simulating: bool, mount: types.OT3Mount, speed: int, current: float) -> None:
    api = await helpers_ot3.build_async_ot3_hardware_api(is_simulating=is_simulating)

    test_pip = api.get_attached_instrument(mount)
    test_tag = test_pip['name']
    test_robot = input("Enter robot ID/pipette ID:\n\t>> ")

    test_name = "pipette-plunger-stall-test"
    file_name = data.create_file_name(test_name=test_name, run_id=data.create_run_id(), tag=test_tag)

    header = ['Cycle', 'Test Robot/Test Pipette', 'Pipette Model', 'Current (A)', 'Speed (mm/s)', 'Init Position Read (mm)', 'Stall Position Read (mm)', 'Difference (mm)', 'Encoder Value Before', 'Encoder Value After', 'Encoder Difference (mm)']
    header_str = data.convert_list_to_csv_line(header)
    data.append_data_to_file(test_name=test_name, file_name=file_name, data=header_str)

    await api.home()
    await api.home_plunger(mount)
    print("Move to dial indicator fixture\n")
    cur_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.NOZZLE)
    fixture_position = await jog(api, cur_pos, CriticalPoint.NOZZLE)
    top_pos, bottom_pos, _, drop_pos = helpers_ot3.get_plunger_positions_ot3(api, mount)
    pipette_ax = types.OT3Axis.of_main_tool_actuator(mount)

    for trials in range(4):
        for cycle in range(CYCLES):
            print(f"\n=========== Cycle {cycle + 1}/{CYCLES} ===========\n")
            print("Move to drop tip position\n")
            await helpers_ot3.move_plunger_absolute_ot3(api, mount, drop_pos)
            time.sleep(1)

            print("Take initial reading\n")
            init_reading = gauge.read()
            init_encoder_pos = await api.encoder_current_position_ot3(mount, refresh=True)
            print(f"\t>> Gauge read: {init_reading} mm, Encoder read: {init_encoder_pos[pipette_ax]} mm\n")
            await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom_pos)
            await api.move_rel(mount, delta=Point(z=10))

            print("=== ATTEMPT TO STALL PLUNGER ===\n")
            count = 0
            while(1):

                count += 1
                print(f"COUNT: {count}\n")

                print("Move to top plunger position\n")
                await helpers_ot3.move_plunger_absolute_ot3(api, mount, top_pos, motor_current=current, speed=speed)
                if not await _plunger_alignment(api, mount):
                    await _plunger_stall(api, mount)
                    break

                print("Move to bottom plunger position\n")
                await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom_pos, motor_current=current, speed=speed)
                if not await _plunger_alignment(api, mount):
                    await _plunger_stall(api, mount)
                    break

                if count > 9:
                    print("=== Unable to cause stall. Canceling script. ===\n")
                    await api.home()
                    sys.exit()

            print("Move to dial indicator fixture\n")
            await api.move_rel(mount, delta=Point(z=-10))
            print("Move to drop tip position\n")
            await helpers_ot3.move_plunger_absolute_ot3(api, mount, drop_pos, motor_current=DEFAULT_CURRENT, speed=DEFAULT_SPEED)
            time.sleep(1)

            print("Take stalled reading\n")
            stall_reading = gauge.read()
            stall_encoder_pos = await api.encoder_current_position_ot3(mount, refresh=True)
            print(f"\t>> Gauge read: {stall_reading} mm, Encoder read: {stall_encoder_pos[pipette_ax]} mm\n")

            reading_diff = stall_reading - init_reading
            print(f"\t>> Gauge read difference: {round(reading_diff, 2)} mm, Encoder read difference: {round(stall_encoder_pos[pipette_ax] - init_encoder_pos[pipette_ax], 2)} mm\n")

            await helpers_ot3.move_plunger_absolute_ot3(api, mount, bottom_pos, motor_current=DEFAULT_CURRENT, speed=DEFAULT_SPEED)

            if cycle > 0:
                test_robot = ""
                test_tag = ""

            cycle_data = [cycle+1, test_robot, test_tag, current, speed, init_reading, stall_reading, reading_diff, init_encoder_pos[pipette_ax], stall_encoder_pos[pipette_ax], stall_encoder_pos[pipette_ax] - init_encoder_pos[pipette_ax]]
            cycle_data_str = data.convert_list_to_csv_line(cycle_data)
            data.append_data_to_file(test_name=test_name, file_name=file_name, data=cycle_data_str)
            await api.home_plunger(mount)

        await api.home()
        await api.home_plunger(mount)
        print(f"Moving to fixture: {fixture_position}\n")
        if mount == OT3Mount.LEFT:
            AXIS = OT3Axis.Z_L
        else:
            AXIS = OT3Axis.Z_R
        home_pos = await api.current_position_ot3(mount, critical_point=CriticalPoint.NOZZLE)
        await api.move_to(mount, Point(fixture_position[OT3Axis.X], fixture_position[OT3Axis.Y], home_pos[AXIS]))
        await api.move_to(mount, Point(fixture_position[OT3Axis.X], fixture_position[OT3Axis.Y], fixture_position[AXIS]))
    await api.home()


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
    parser.add_argument(
        "--speed", type=int, required=False, default = 45) # 50
    parser.add_argument(
        "--current", type=float, required=False, default = 0.175)
    args = parser.parse_args()
    mount = mount_options[args.mount]

    gauge = dial.Mitutoyo_Digimatic_Indicator(port=args.mod_port)
    gauge.connect()

    asyncio.run(_main(args.simulate, mount, args.speed, args.current))
