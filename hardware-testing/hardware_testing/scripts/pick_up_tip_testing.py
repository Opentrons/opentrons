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

from hardware_testing import data
from hardware_testing.drivers import mitutoyo_digimatic_indicator


def dict_values_to_line(dict):
    return str.join(",", list(dict.values())) + "\n"


def dict_keys_to_line(dict):
    return str.join(",", list(dict.keys())) + "\n"


def file_setup(test_data):
    current_val = float(input("Enter Motor Current to be Tested:"))
    test_name = "Tip_Attachment_Test"
    test_header = dict_keys_to_line(test_data)
    test_tag = "{}Amps-start-time-{}".format(current_val, int(time.time()))
    test_id = data.create_run_id()
    test_path = data.create_folder_for_test_data(test_name)
    test_file = data.create_file_name(test_name, test_id, test_tag)
    data.append_data_to_file(test_name, test_file, test_header)
    print("FILE PATH = ", test_path)
    print("FILE NAME = ", test_file)
    return test_name, test_file


def dial_indicator_setup():
    gauge = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(
        port="/dev/ttyUSB0"
    )
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

        elif input == "r":
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
    hw_api = await build_async_ot3_hardware_api(
        is_simulating=args.simulate, use_defaults=True
    )
    # await set_default_current_settings(hw_api, load=None)
    await home_ot3(hw_api, [OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    home_pos = await hw_api.current_position_ot3(mount)
    start_loc = {
        OT3Axis.X: 150,
        OT3Axis.Y: 200,
        OT3Axis.by_mount(mount): home_pos[OT3Axis.by_mount(mount)],
    }
    # await hw_api.current_position_ot3(mount
    await hw_api.cache_instruments()
    trash_loc = ()
    await hw_api.home_plunger(mount)
    tip_column = 0
    columns_to_use = 12
    try:
        if args.test == "pick_up_tip":
            start_time = time.time()
            await hw_api.move_to(
                mount,
                Point(
                    start_loc[OT3Axis.X],
                    start_loc[OT3Axis.Y],
                    home_pos[OT3Axis.by_mount(mount)],
                ),
            )
            # await hw_api.move_to(mount, Point(home_pos[OT3Axis.X],
            #                                     start_loc[OT3Axis.Y],
            #                                     home_pos[OT3Axis.by_mount(mount)]))
            # await hw_api.move_to(mount, Point(start_loc[OT3Axis.X],
            #                                     start_loc[OT3Axis.Y],
            #                                     home_pos[OT3Axis.by_mount(mount)]))
            for cycle in range(1, columns_to_use + 1):
                if cycle <= 1:
                    print("Move to Tiprack")
                    home_position = await hw_api.current_position_ot3(mount)
                    tiprack_loc = await _jog_axis(hw_api, home_position)
                #     Coordinates:  177.0 , 182.1 , 97.5
                # tiprack_loc = {OT3Axis.X: 177.0, OT3Axis.Y: 182.1, OT3Axis.by_mount(mount): 97.5}
                # await hw_api.move_to(mount, Point(tiprack_loc[OT3Axis.X],
                #                                     tiprack_loc[OT3Axis.Y],
                #                                     home_pos[OT3Axis.by_mount(mount)]))
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
                current_pos = await hw_api.current_position_ot3(mount)
                # Move to Block
                await hw_api.move_to(
                    mount, Point(207.2, 72.7, current_pos[OT3Axis.by_mount(mount)])
                )
                current_pos = await hw_api.current_position_ot3(mount)
                block = await _jog_axis(hw_api, current_pos)
                await hw_api.home_z(mount, allow_home_other=False)

                trash_loc = [432.7, 393.3, 100.0]
                await hw_api.home_z(mount, allow_home_other=False)
                current_pos = await hw_api.current_position_ot3(mount)
                await hw_api.move_to(
                    mount,
                    Point(
                        trash_loc[0], trash_loc[1], current_pos[OT3Axis.by_mount(mount)]
                    ),
                )
                await hw_api.move_to(
                    mount, Point(trash_loc[0], trash_loc[1], trash_loc[2])
                )
                await hw_api.drop_tip(mount)
                await hw_api.home_z(mount, allow_home_other=False)
                current_pos = await hw_api.current_position_ot3(mount)
                # tip_column += 9
                await hw_api.move_to(
                    mount,
                    Point(
                        tiprack_loc[OT3Axis.X] + tip_column,
                        tiprack_loc[OT3Axis.Y],
                        current_pos[OT3Axis.by_mount(mount)],
                    ),
                )
        elif args.test == "tip_height_test":
            start_time = time.time()
            await hw_api.move_to(
                mount,
                Point(
                    start_loc[OT3Axis.X],
                    start_loc[OT3Axis.Y],
                    home_pos[OT3Axis.by_mount(mount)],
                ),
            )
            # await hw_api.move_to(mount, Point(home_pos[OT3Axis.X],
            #                                     start_loc[OT3Axis.Y],
            #                                     home_pos[OT3Axis.by_mount(mount)]))
            # await hw_api.move_to(mount, Point(start_loc[OT3Axis.X],
            #                                     start_loc[OT3Axis.Y],
            #                                     home_pos[OT3Axis.by_mount(mount)]))
            for cycle in range(1, columns_to_use + 1):
                if cycle <= 1:
                    print("Move to Tiprack")
                    home_position = await hw_api.current_position_ot3(mount)
                    tiprack_loc = await _jog_axis(hw_api, home_position)
                #     Coordinates:  177.0 , 182.1 , 97.5
                # tiprack_loc = {OT3Axis.X: 177.0, OT3Axis.Y: 182.1, OT3Axis.by_mount(mount): 97.5}
                # await hw_api.move_to(mount, Point(tiprack_loc[OT3Axis.X],
                #                                     tiprack_loc[OT3Axis.Y],
                #                                     home_pos[OT3Axis.by_mount(mount)]))
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
                current_pos = await hw_api.current_position_ot3(mount)
                # Move to Block
                await hw_api.move_to(
                    mount, Point(207.2, 72.7, current_pos[OT3Axis.by_mount(mount)])
                )
                current_pos = await hw_api.current_position_ot3(mount)
                block = await _jog_axis(hw_api, current_pos)
                await hw_api.home_z(mount, allow_home_other=False)

                if cycle <= 1:
                    print("Move to Tiprack")
                    home_position = await hw_api.current_position_ot3(mount)
                    dial_pos = await _jog_axis(hw_api, home_position)
                await hw_api.home_z(mount)
                current_pos = await hw_api.current_position_ot3(mount)
                await hw_api.move_to(
                    mount,
                    Point(
                        dial_pos[OT3Axis.X],
                        dial_pos[OT3Axis.Y],
                        current_pos[OT3Axis.by_mount(mount)] - 3,
                    ),
                )
                current_pos = await hw_api.current_position_ot3(mount)
                await hw_api.move_to(
                    mount,
                    Point(
                        dial_pos[OT3Axis.X],
                        dial_pos[OT3Axis.Y],
                        current_pos[OT3Axis.by_mount(mount)],
                    ),
                )
                tip_increment = 0
                tips = 8
                z_distance_press = 6
                for tip in range(1, tips + 1):
                    # Press onto the dial indicator
                    await hw_api.move_to(
                        mount,
                        Point(
                            dial_pos[OT3Axis.X],
                            dial_pos[OT3Axis.Y] - tip_increment,
                            dial_pos[OT3Axis.by_mount(mount)],
                        ),
                    )
                    await asyncio.sleep(2)
                    elasped_time = (time.time() - start_time) / 60
                    test_data["Time"] = round(elasped_time, 3)
                    test_data["Tip Height(mm)"] = gauge.read_stable(timeout=20)
                    test_data["Tip"] = tip
                    print(test_data)
                    d_str = f"{elasped_time}, {gauge.read_stable(timeout=20)}, {tip}\n"
                    data.append_data_to_file(test_n, test_f, d_str)
                    await asyncio.sleep(1)
                    # Retract from the dial indicator by 6mm
                    await hw_api.move_to(
                        mount,
                        Point(
                            dial_pos[OT3Axis.X],
                            dial_pos[OT3Axis.Y] - tip_increment,
                            dial_pos[OT3Axis.by_mount(mount)] + z_distance_press,
                        ),
                    )
                    # backlash compensation
                    await hw_api.move_to(
                        mount,
                        Point(
                            dial_pos[OT3Axis.X],
                            dial_pos[OT3Axis.Y] - tip_increment,
                            dial_pos[OT3Axis.by_mount(mount)] + z_distance_press - 3,
                        ),
                    )
                    # move to the next nozzle
                    tip_increment += 9
                    current_pos = await hw_api.current_position_ot3(mount)
                    await hw_api.move_to(
                        mount,
                        Point(
                            dial_pos[OT3Axis.X],
                            dial_pos[OT3Axis.Y] - tip_increment,
                            current_pos[OT3Axis.by_mount(mount)],
                        ),
                    )

                trash_loc = [432.7, 393.3, 100.0]
                await hw_api.home_z(mount, allow_home_other=False)
                current_pos = await hw_api.current_position_ot3(mount)
                await hw_api.move_to(
                    mount,
                    Point(
                        trash_loc[0], trash_loc[1], current_pos[OT3Axis.by_mount(mount)]
                    ),
                )
                await hw_api.move_to(
                    mount, Point(trash_loc[0], trash_loc[1], trash_loc[2])
                )
                await hw_api.drop_tip(mount)
                await hw_api.home_z(mount, allow_home_other=False)
                current_pos = await hw_api.current_position_ot3(mount)
                # tip_column += 9
                await hw_api.move_to(
                    mount,
                    Point(
                        tiprack_loc[OT3Axis.X] + tip_column,
                        tiprack_loc[OT3Axis.Y],
                        current_pos[OT3Axis.by_mount(mount)],
                    ),
                )
        elif args.test == "flatness":
            home_position = await hw_api.current_position_ot3(mount)
            await hw_api.move_to(
                mount,
                Point(
                    start_loc[OT3Axis.X],
                    start_loc[OT3Axis.Y],
                    home_pos[OT3Axis.by_mount(mount)],
                ),
            )
            # we don't need this, this is just for a placeholder
            flatness = await _jog_axis(hw_api, home_position)
        elif args.test == "flatness_with_move":
            coordinates = [
                (515, 29, 294.16),
                (465, 29, 294.16),
                (415, 29, 294.16),
                (317.23, 29, 294.16),
                (317.23, 96.72, 294.16),
                (326.73, 96.72, 294.16),
                (326.73, 143.32, 294.16),
                (415, 143.32, 294.16),
                (465, 143.32, 294.16),
                (515, 143.32, 294.16),
                (317.24, 203.12, 294.16),
                (326.24, 250.11, 294.16),
                (415, 250.11, 294.16),
                (465, 250.11, 294.16),
                (515, 250.11, 294.16),
                (317.22, 303.62, 294.16),
                (326.25, 357.62, 294.16),
                (415, 357.62, 294.16),
                (465, 357.62, 294.16),
                (515, 357.62, 294.16),
                (317.22, 411.11, 294.16),
                (256.22, 29, 294.16),
                (268.28, 29, 294.16),
                (218.28, 29, 294.16),
                (154.29, 29, 294.16),
                (154.29, 96.72, 294.16),
                (162.29, 143.32, 294.16),
                (218.29, 143.32, 294.16),
                (268.29, 143.32, 294.16),
                (154.8, 203.12, 294.16),
                (162.3, 250.11, 294.16),
                (218.3, 250.11, 294.16),
                (268.3, 250.11, 294.16),
                (154.81, 303.62, 294.16),
                (162.31, 357.62, 294.16),
                (218.3, 357.62, 294.16),
                (268.31, 357.62, 294.16),
                (154.86, 411.11, 294.16),
                (-21.85, 29, 294.16),
                (62.85, 29, 294.16),
                (-21.85, 143.32, 294.16),
                (62.85, 143.32, 294.16),
                (-21.85, 250.11, 294.16),
                (62.85, 250.11, 294.16),
            ]
            home_position = await hw_api.current_position_ot3(mount)

            array_num = 0
            for coord in coordinates:
                await hw_api.move_to(
                    mount,
                    Point(coord[0], coord[1], home_pos[OT3Axis.by_mount(mount)]),
                    speed=60,
                )
                await asyncio.sleep(1)
                await hw_api.move_to(
                    mount, Point(coord[0], coord[1], coord[2]), speed=65
                )
                await asyncio.sleep(3)
                gauge_reading = gauge.read_stable(timeout=20)
                position = await hw_api.current_position_ot3(mount)
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
                await hw_api.move_to(
                    mount,
                    Point(coord[0], coord[1], home_pos[OT3Axis.by_mount(mount)]),
                    speed=65,
                )
                array_num += 1
            # we don't need this, this is just for a placeholder
            flatness = await _jog_axis(hw_api, home_position)
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    except KeyboardInterrupt:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    finally:
        await hw_api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        await hw_api.clean_up()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--mount", type=str, choices=["left", "right"], default="left")
    parser.add_argument(
        "--test",
        type=str,
        help="pick_up_tip, tip_height_test, flatness, flatness_with_move",
        default="pick_up_tip",
    )
    parser.add_argument("--dial_indicator", action="store_true")
    parser.add_argument("--flatness", action="store_true")
    args = parser.parse_args()
    if args.mount == "left":
        mount = OT3Mount.LEFT
    else:
        mount = OT3Mount.RIGHT
    xy_speed = 250
    speed_z = 60
    if args.dial_indicator:
        if args.flatness:
            test_data = {
                "X-Coordinate": None,
                "Y-Coordinate": None,
                "Z-Coordinate": None,
                "Deck Height(mm)": None,
            }
        else:
            test_data = {"Time": None, "Tip Height(mm)": None, "Tip": None}
        gauge = dial_indicator_setup()
        test_n, test_f = file_setup(test_data)
    pick_up_speed = 5
    press_distance = 15
    PIPETTE_SPEED = 10
    asyncio.run(_main())
