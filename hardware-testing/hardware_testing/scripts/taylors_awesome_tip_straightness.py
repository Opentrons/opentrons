import logging
import asyncio
import argparse
from numpy import float64
import termios
import sys, tty, os, time

from opentrons.hardware_control.motion_utilities import target_position_from_plunger
from hardware_testing.opentrons_api.types import (
    GantryLoad,
    OT3Mount,
    OT3Axis,
    Point,
    Axis,
)
from hardware_testing.opentrons_api.helpers_ot3 import (
    OT3API,
    build_async_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
    home_ot3,
    get_endstop_position_ot3,
    move_plunger_absolute_ot3,
    update_pick_up_current,
    update_pick_up_distance,
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
            if step_length_index >= 6:
                step_length_index = 6
            step = step_size[step_length_index]

        elif input == "-":
            sys.stdout.flush()
            step_length_index = step_length_index - 1
            if step_length_index <= 0:
                step_length_index = 0
            step = step_size[step_length_index]

        elif input == "\r":
            sys.stdout.flush()
            return position
        position = await api.current_position_ot3(mount)

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


async def _main() -> None:
    slot_loc = {
        "A1": (13.42, 394.92, 110),
        "A2": (177.32, 394.92, 110),
        "A3": (341.03, 394.0, 110),
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
    # await set_default_current_settings(hw_api, load=None)
    await hw_api.cache_instruments()
    await hw_api.home()
    # await home_ot3(hw_api, [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    await hw_api.home_plunger(mount)
    home_pos = await hw_api.current_position_ot3(mount)
    tip_length = {"T1K": 85.7, "T200": 48.35, "T50": 47.9}
    print(hw_api.get_all_attached_instr()[mount])
    pipette_model = hw_api.get_all_attached_instr()[mount]["pipette_id"]
    tip_column = 0
    columns_to_use = 12
    try:

        await hw_api.move_to(
            mount,
            Point(
                slot_loc["C2"][0],
                slot_loc["C2"][1],
                home_pos[OT3Axis.by_mount(mount)],
            ),
        )
        await hw_api.move_to(
            mount,
            Point(
                slot_loc["C2"][0],
                slot_loc["C2"][1],
                home_pos[OT3Axis.by_mount(mount)] - 50,
            ),
        )

        for cycle in range(1, columns_to_use + 1):
            if cycle <= 1:
                print("Move to Tiprack")
                home_position = await hw_api.current_position_ot3(mount)
                tiprack_loc = await _jog_axis(hw_api, home_position)

            await hw_api.move_to(
                mount,
                Point(
                    tiprack_loc[OT3Axis.X] + tip_column,
                    tiprack_loc[OT3Axis.Y],
                    tiprack_loc[OT3Axis.by_mount(mount)],
                ),
            )
            # await hw_api.pick_up_tip(mount, tip_length = 58.5, presses = 2, increment = 1)
            current_val = float(input("Enter Current Val: "))
            print(f"Current Val: {current_val}")
            await update_pick_up_current(hw_api, mount, current_val)
            await hw_api.pick_up_tip(mount, tip_length=58.5)
            await hw_api.home_z(mount)
            current_pos = await hw_api.current_position_ot3(mount)

            # Move to gage plate
            await hw_api.move_to(
                mount,
                Point(
                    slot_loc["D2"][0],
                    slot_loc["D2"][1],
                    current_pos[OT3Axis.by_mount(mount)],
                ),
            )
            current_pos = await hw_api.current_position_ot3(mount)
            gage_plate = await _jog_axis(hw_api, current_pos)

            await hw_api.home_z(mount, allow_home_other=False)
            current_pos = await hw_api.current_position_ot3(mount)
            await hw_api.move_to(
                mount,
                Point(
                    slot_loc["A3"][0],
                    slot_loc["A3"][1],
                    current_pos[OT3Axis.by_mount(mount)],
                ),
            )
            await hw_api.move_to(
                mount, Point(slot_loc["A3"][0], slot_loc["A3"][1], 100)
            )
            await hw_api.drop_tip(mount)
            await hw_api.home_z(mount, allow_home_other=False)
            current_pos = await hw_api.current_position_ot3(mount)
            tip_column += 9
            await hw_api.move_to(
                mount,
                Point(
                    tiprack_loc[OT3Axis.X] + tip_column,
                    tiprack_loc[OT3Axis.Y],
                    current_pos[OT3Axis.by_mount(mount)],
                ),
            )
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    except KeyboardInterrupt:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    finally:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
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
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument("--tiprack_slot", type=str, choices=slot_locs, default="C2")
    args = parser.parse_args()
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT
    xy_speed = 250
    speed_z = 60
    asyncio.run(_main())
