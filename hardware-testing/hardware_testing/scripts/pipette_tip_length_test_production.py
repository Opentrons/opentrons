"""Demo OT3 Gantry Functionality."""
import argparse
import asyncio
from typing import Any, Dict, List, Optional, Tuple
import datetime
import sys
import termios
import tty
from opentrons.hardware_control.ot3api import OT3API
import serial.tools.list_ports  # type: ignore[import-untyped]

from opentrons.hardware_control.types import OT3Mount, Axis, CriticalPoint
from opentrons.types import Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
)

from hardware_testing import data
from hardware_testing.drivers import mitutoyo_digimatic_indicator


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


def dial_indicator_setup(
    select_default: bool = False,
) -> mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator:
    """Set up the dial indicator serial device."""
    # Find the device using default port (1) or user input port
    port_list = serial.tools.list_ports.comports()
    print("=" * 5 + "PORT LIST" + "=" * 5)
    for index, p in enumerate(port_list):
        print(f"{index + 1} >>{p.device}")
    if select_default:
        select = "1"
    else:
        select = input("Select Port Number(输入串口号对应的数字):")
    _port = port_list[int(select.strip()) - 1].device
    print("Port: ", _port)

    # Creaate the device and connect to it
    gauge = mitutoyo_digimatic_indicator.Mitutoyo_Digimatic_Indicator(
        port=_port,
        baudrate=2400,
    )
    gauge.connect()
    return gauge


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
    tip_overlap = 10.5
    tip_length = {
        "T1K": 95.6 - tip_overlap,
        "T200": 58.35 - tip_overlap,
        "T50": 57.9 - tip_overlap,
        "T20": 52 - tip_overlap,
    }
    dial_data = {
        "Pipette id": None,
        "Noz_Height(mm)": None,
        "Tip_Height(mm)": None,
        "Tip_Overlap(mm)": None,
        "Noz_dial(mm)": None,
        "tip_dial(mm)": None,
        "tip_attached": None,
        "Tip_Count": None,
        "Tip_Length(mm)": None,
    }
    await hw_api.home()
    await hw_api.cache_instruments()
    await hw_api.home_plunger(mount)
    nozzle_home_pos = hw_api.get_instrument_max_height(mount, CriticalPoint.NOZZLE)
    pipette_id = hw_api._pipette_handler.hardware_instruments[OT3Mount.LEFT]._pipette_id  # type: ignore
    details = [pipette_id]
    test_n, test_f = file_setup(dial_data, details)
    noz_loc = 0.0
    tiprack_loc = Point()
    nozzle_dial_point = Point()
    nozzle_measurement_list = []
    if args.dial_indicator:
        cp = CriticalPoint.NOZZLE
        dial_point = Point(
            slot_loc[args.dial_slot][0],
            slot_loc[args.dial_slot][1],
            nozzle_home_pos - 100,
        )
        await move_to_point(hw_api, mount, dial_point, cp)
        print("Moved to Dial Indicator")
        current_position = await hw_api.current_position_ot3(mount)
        nozzle_dial_loc = await jog(hw_api, current_position, cp)

        encoder_pos = await hw_api.encoder_current_position_ot3(
            mount=mount, critical_point=cp
        )
        noz_loc = encoder_pos[Axis.by_mount(mount)]
        await asyncio.sleep(2)
        nozzle_dial_point = Point(
            nozzle_dial_loc[Axis.X],
            nozzle_dial_loc[Axis.Y],
            nozzle_dial_loc[Axis.by_mount(mount)],
        )
        for nozzle in range(args.channel):
            print(f"Nozzle{nozzle+1}...")
            await move_to_point(
                hw_api, mount, nozzle_dial_point + Point(y=9 * nozzle), cp
            )
            await asyncio.sleep(1)
            reading = gauge.read()
            assert 0.7 < reading < 0.9, "reading is a wrong number !"
            nozzle_measurement_list.append(reading)

    if args.tiprack:
        cp = CriticalPoint.NOZZLE
        tiprack_point = Point(
            slot_loc[args.tiprack_slot][0],
            slot_loc[args.tiprack_slot][1],
            nozzle_home_pos - 100,
        )
        await move_to_point(hw_api, mount, tiprack_point, cp)
        print("Move to Tiprack")
        current_position = await hw_api.current_position_ot3(mount)
        tiprack_pos = await jog(hw_api, current_position, cp)
        # Move pipette to Force Gauge press location
        await hw_api.pick_up_tip(mount, tip_length=tip_length[args.tip_size])
        tip_count = 1
        cp = CriticalPoint.TIP
        tiprack_loc = Point(
            tiprack_pos[Axis.X], tiprack_pos[Axis.Y], tiprack_pos[Axis.by_mount(mount)]
        )
        for nozzle in range(args.channel):
            await move_to_point(
                hw_api, mount, nozzle_dial_point + Point(y=9 * nozzle), cp
            )
            tip_pos = await hw_api.encoder_current_position_ot3(
                mount, CriticalPoint.NOZZLE
            )
            tip_loc = tip_pos[Axis.by_mount(mount)]
            await asyncio.sleep(3)
            tip_measurement = gauge.read()
            await asyncio.sleep(1)
            measured_tip_overlap = (tip_length[args.tip_size] + tip_overlap) - (
                tip_loc - noz_loc
            )  # tiplength - tip overlap.
            tip_attached = nozzle_measurement_list[nozzle] - tip_measurement
            measured_tip_overlap = tip_attached + measured_tip_overlap
            print(f"Tip_Overlap: {measured_tip_overlap}")
            d_str = f"{pipette_id}, {noz_loc},{tip_loc}, {measured_tip_overlap}, {nozzle_measurement_list[nozzle]}, {tip_measurement}, {tip_attached}, {tip_count}, {tip_length[args.tip_size] + tip_overlap}, Nozzle_{nozzle+1} \n"
            data.append_data_to_file(test_n, "", test_f, d_str)

    await move_to_point(hw_api, mount, tiprack_loc, cp)
    await hw_api.drop_tip(mount)

    tip_count = 2
    x_offset = 0
    y_offset = 0
    try:
        for tip in range(2, args.tips_to_use + 1):
            if args.channel == 1:
                y_offset -= 9
            else:
                y_offset = 0
            print("tip_count: ", tip_count)
            print("y_offset: ", y_offset)
            if args.channel == 1:
                if (tip_count - 1) % 8 == 0:
                    y_offset = 0
                if (tip_count - 1) % 8 == 0:
                    x_offset += 9
            else:
                x_offset += 9
            cp = CriticalPoint.NOZZLE
            nozzle_measurement_list = []

            for nozzle in range(args.channel):
                print(f"Nozzle{nozzle+1}...")
                await move_to_point(
                    hw_api, mount, nozzle_dial_point + Point(y=9 * nozzle), cp
                )
                noz_pos = await hw_api.encoder_current_position_ot3(mount, cp)
                noz_loc = noz_pos[Axis.by_mount(mount)]
                await asyncio.sleep(3)
                nozzle_measurement_list.append(gauge.read())
                await asyncio.sleep(1)

            tip_location = Point(
                tiprack_loc.x + x_offset, tiprack_loc.y + y_offset, tiprack_loc.z
            )
            await move_to_point(hw_api, mount, tip_location, cp)
            await hw_api.pick_up_tip(mount, tip_length=tip_length[args.tip_size])
            cp = CriticalPoint.TIP

            for nozzle in range(args.channel):
                await move_to_point(
                    hw_api, mount, nozzle_dial_point + Point(y=9 * nozzle), cp
                )
                await asyncio.sleep(3)
                tip_measurement = gauge.read()
                await asyncio.sleep(1)
                tip_pos = await hw_api.encoder_current_position_ot3(
                    mount=mount, critical_point=CriticalPoint.NOZZLE
                )
                tip_loc = tip_pos[Axis.by_mount(mount)]
                measured_tip_overlap = (tip_length[args.tip_size] + tip_overlap) - (
                    tip_loc - noz_loc
                )  # tiplength - tip overlap.
                tip_attached = nozzle_measurement_list[nozzle] - tip_measurement
                measured_tip_overlap = tip_attached + measured_tip_overlap
                print(f"Tip_Overlap: {measured_tip_overlap}")
                d_str = f"{pipette_id}, {noz_loc},{tip_loc}, {measured_tip_overlap}, {nozzle_measurement_list[nozzle]}, {tip_measurement}, {tip_attached}, {tip_count}, {tip_length[args.tip_size] + tip_overlap}, Nozzle_{nozzle+1} \n"
                data.append_data_to_file(test_n, "", test_f, d_str)
            # --------------------Drop Tip--------------------------------------
            current_position = await hw_api.current_position_ot3(
                mount, critical_point=CriticalPoint.TIP
            )
            await move_to_point(hw_api, mount, tip_location, cp)
            await hw_api.drop_tip(mount)
            tip_count += 1

        await hw_api.disengage_axes([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
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

    if args.dial_indicator:
        gauge = dial_indicator_setup()
    asyncio.run(_main())
