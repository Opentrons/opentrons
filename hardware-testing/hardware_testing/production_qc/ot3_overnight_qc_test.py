"""OT3 Overnight Test."""
import argparse
import asyncio
import os
import time

from dataclasses import dataclass
from typing import Optional, Callable, List, Any, Tuple, Dict
from pathlib import Path

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api.types import Axis
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data
from hardware_testing.data import ui

import logging

LOG = logging.getLogger(__name__)
LOG.setLevel(logging.CRITICAL)
# logging.getLogger('opentrons.hardware_control.ot3api.OT3API').setLevel(logging.INFO) #tells all movement settings
# logging.getLogger('opentrons_hardware.hardware_control').setLevel(logging.INFO) #confirms speeds


GANTRY_AXES = [Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R]
MOUNT_AXES = [types.OT3Mount.LEFT, types.OT3Mount.RIGHT]
THRESHOLD_MM = 0.2

DEFAULT_X_SPEEDS: List[float] = [250, 350, 450]
DEFAULT_X_ACCELERATIONS: List[float] = [700, 800, 900]
DEFAULT_X_CURRENTS: List[float] = [1, 1.25, 1.5]

DEFAULT_Y_SPEEDS: List[float] = [225, 300, 375]
DEFAULT_Y_ACCELERATIONS: List[float] = [500, 600, 700]
DEFAULT_Y_CURRENTS: List[float] = [1, 1.2, 1.4]

DEFAULT_Z_SPEEDS: List[float] = [80, 100, 120]
DEFAULT_Z_ACCELERATIONS: List[float] = [100, 150, 200]
DEFAULT_Z_CURRENTS: List[float] = [0.75, 1, 1.25]

DEFAULT_AXIS_SETTINGS = {
    types.Axis.X: helpers_ot3.GantryLoadSettings(
        max_speed=500,
        acceleration=1000,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.5,
        run_current=1.4,
    ),
    types.Axis.Y: helpers_ot3.GantryLoadSettings(
        max_speed=500,
        acceleration=1000,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.5,
        run_current=1.4,
    ),
    types.Axis.Z_L: helpers_ot3.GantryLoadSettings(
        max_speed=65,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.4,
    ),
    types.Axis.Z_R: helpers_ot3.GantryLoadSettings(
        max_speed=65,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.1,
        run_current=1.4,
    ),
}


@dataclass
class CSVCallbacks:
    """CSV callback functions."""

    write: Callable


@dataclass
class CSVProperties:
    """CSV properties."""

    id: str
    name: str
    path: str


def _create_csv_and_get_callbacks(sn: str) -> Tuple[CSVProperties, CSVCallbacks]:
    run_id = data.create_run_id()
    test_name = data.create_test_name_from_file(__file__)
    folder_path = data.create_folder_for_test_data(test_name)
    ##pipid???
    file_name = data.create_file_name(test_name=test_name,
                                      run_id=run_id, tag=sn)
    csv_display_name = os.path.join(folder_path, file_name)
    print(f"CSV: {csv_display_name}")
    start_time = time.time()

    def _append_csv_data(
        data_list: List[Any],
        line_number: Optional[int] = None,
        first_row_value: Optional[str] = None,
        first_row_value_included: bool = False,
    ) -> None:
        # every line in the CSV file begins with the elapsed seconds
        if not first_row_value_included:
            if first_row_value is None:
                first_row_value = str(round(time.time() - start_time, 2))
            data_list = [first_row_value] + data_list
        data_str = ",".join([str(d) for d in data_list])
        if line_number is None:
            data.append_data_to_file(test_name, file_name, data_str + "\n")
        else:
            data.insert_data_to_file(test_name, file_name, data_str + "\n", line_number)

    return (
        CSVProperties(id=run_id, name=test_name, path=csv_display_name),
        CSVCallbacks(
            write=_append_csv_data,
        ),
    )


def bool_to_string(result: bool) -> str:
    return "PASS" if result else "FAIL"


def _record_axis_data(
    type: str,
    write_cb: Callable,
    estimate: Dict[Axis, float],
    encoder: Dict[Axis, float],
    aligned: bool,
) -> None:
    data_str = ''
    for ax in GANTRY_AXES:
        data_str = data_str + ax + str(round(encoder[ax] - estimate[ax], 5))
    write_cb([type] + bool_to_string(aligned) + data_str)
    # write_cb([type] + bool_to_string(aligned) + [str(round(encoder[ax] - estimate[ax], 5)) for ax in GANTRY_AXES])


def _record_motion_check_data(
    type: str,
    write_cb: Callable,
    speed: float,
    acceleration: float,
    current: float,
    cycles: int,
    pass_count: int,
    fail_count: int,
) -> None:
    write_cb(
        [type]
        + ["Speed"]
        + [str(speed)]
        + ["Acceleration"]
        + [str(acceleration)]
        + ["Current"]
        + [str(current)]
        + ["Run Cycle"]
        + [str(cycles)]
        + ["Pass Count"]
        + [str(pass_count)]
        + ["Fail Count"]
        + [str(fail_count)]
    )


def _create_bowtie_points(homed_position: types.Point) -> List[types.Point]:
    pos_max = homed_position - types.Point(x=1, y=1, z=1)
    pos_min = types.Point(x=0, y=25, z=pos_max.z)  # stay above deck to be safe
    bowtie_points = [
        pos_max,  # back-right
        pos_min,  # front-left
        pos_min._replace(y=pos_max.y),  # back-left
        pos_max._replace(y=pos_min.y),  # front-right
        pos_max,  # back-right
    ]
    return bowtie_points


def _create_hour_glass_points(homed_position: types.Point) -> List[types.Point]:
    pos_max = homed_position - types.Point(x=1, y=1, z=1)
    pos_min = types.Point(x=0, y=25, z=pos_max.z)  # stay above deck to be safe
    hour_glass_points = [
        pos_max,  # back-right
        pos_min._replace(y=pos_max.y),  # back-left
        pos_max._replace(y=pos_min.y),  # front-right
        pos_min,  # front-left
        pos_max,  # back-right
    ]
    return hour_glass_points


def _create_mounts_up_down_points(homed_position: types.Point) -> List[types.Point]:
    # print("Create Up Down Start - gantry estimate: " + str(homed_position))
    # pos_max = homed_position - types.Point(x=1, y=1, z=1)
    pos_max = homed_position
    pos_min = types.Point(x=0, y=25, z=pos_max.z)  # stay above deck to be safe
    mounts_up_down_points = [
        pos_max._replace(z=pos_max.z - 200),  # down
        pos_max,  # up
    ]
    return mounts_up_down_points


async def _move_and_check(
    api: OT3API, is_simulating: bool, mount: types.OT3Mount, position: types.Point
) -> Tuple[Dict[Axis, float], Dict[Axis, float], bool]:
    if not is_simulating:
        await api.move_to(mount, position)
        estimate = {ax: api._current_position[ax] for ax in GANTRY_AXES}
        encoder = {ax: api._encoder_position[ax] for ax in GANTRY_AXES}
    else:
        pass

    all_aligned_axes = [
        ax for ax in GANTRY_AXES if abs(estimate[ax] - encoder[ax]) <= THRESHOLD_MM
    ]
    for ax in GANTRY_AXES:
        LOG.INFO(str(ax) + str(" Error: ") + str(estimate[ax] - encoder[ax]))
        LOG.INFO(str(ax) + str(" Estimate: ") + str(estimate[ax]))
        LOG.INFO(str(ax) + str(" Encoder: ") + str(encoder[ax]))
        if ax in all_aligned_axes:
            aligned = True
        else:
            aligned = False
    return estimate, encoder, aligned


async def _run_mount_up_down(
    api: OT3API,
    is_simulating: bool,
    mount: types.OT3Mount,
    mount_up_down_points: List[types.Point],
    write_cb: Callable,
    record_bool=True,
) -> bool:
    ui.print_header("Run mount up and down")
    pass_count = 0
    for pos in mount_up_down_points:
        es, en, al = await _move_and_check(api, is_simulating, mount, pos)
        if record_bool:
            if mount is types.OT3Mount.LEFT:
                mount_type = "Mount_up_down-Left"
            else:
                mount_type = "Mount_up_down-Right"
            _record_axis_data(mount_type, write_cb, es, en, al)
            print(f"{mount_type} results: {al}")
        if al:
            pass_count += 1
    if pass_count == len(mount_up_down_points):
        return True
    else:
        return False


async def _run_bowtie(
    api: OT3API,
    is_simulating: bool,
    mount: types.OT3Mount,
    bowtie_points: List[types.Point],
    write_cb: Callable,
    record_bool=True,
) -> bool:
    ui.print_header("Run bowtie")
    pass_count = 0
    for p in bowtie_points:
        print("Bowtie Position: " + str(p))
        es, en, al = await _move_and_check(api, is_simulating, mount, p)
        if record_bool:
            _record_axis_data("Bowtie", write_cb, es, en, al)
            print(f"bowtie results: {al}")
        if al:
            pass_count += 1
    if pass_count == len(bowtie_points):
        return True
    else:
        return False


async def _run_hour_glass(
    api: OT3API,
    is_simulating: bool,
    mount: types.OT3Mount,
    hour_glass_points: List[types.Point],
    write_cb: Callable,
    record_bool=True,
) -> bool:
    ui.print_header("Run hour glass")
    pass_count = 0
    for q in hour_glass_points:
        es, en, al = await _move_and_check(api, is_simulating, mount, q)
        if record_bool:
            _record_axis_data("Hour_glass", write_cb, es, en, al)
            print(f"hour glass results: {al}")
        if al:
            pass_count += 1
    if pass_count == len(hour_glass_points):
        return True
    else:
        return False


def _get_accelerations_from_user() -> List:
    condition = True
    accelerations = []
    while condition:
        accelerations_input = input(
            f"WAIT: please input the acceleration and split with ',' like: 100,200,300 then press ENTER when ready: "
        )
        try:
            accelerations = [
                float(acc)
                for acc in accelerations_input.strip().replace(" ", "").split(",")
            ]
            condition = False
        except Exception as e:
            ui.print_error(str(e))
    return accelerations


def _get_speeds_from_user() -> List:
    condition = True
    speeds = []
    while condition:
        speeds_input = input(
            f"WAIT: please input the speeds and split with ',' like: 100,200,300 then press ENTER when ready: "
        )
        try:
            speeds = [
                float(spe) for spe in speeds_input.strip().replace(" ", "").split(",")
            ]
            condition = False
        except Exception as e:
            ui.print_error(str(e))
    return speeds


def _get_currents_from_user() -> List:
    condition = True
    currents = []
    while condition:
        currents_input = input(
            f"WAIT: please input the currents and split with ',' like: 100,200,300 then press ENTER when ready: "
        )
        try:
            currents = [
                float(cur) for cur in currents_input.strip().replace(" ", "").split(",")
            ]
            condition = False
        except Exception as e:
            ui.print_error(str(e))
    return currents


def _creat_z_axis_settings(arguments: argparse.Namespace) -> List:
    if arguments.z_speeds and arguments.z_accelerations and arguments.z_currents:
        accelerations = [
            float(acc)
            for acc in arguments.z_accelerations.strip().replace(" ", "").split(",")
        ]
        speeds = [
            float(spe) for spe in arguments.z_speeds.strip().replace(" ", "").split(",")
        ]
        currents = [
            float(cur)
            for cur in arguments.z_currents.strip().replace(" ", "").split(",")
        ]
    else:
        accelerations = DEFAULT_Z_ACCELERATIONS
        speeds = DEFAULT_Z_SPEEDS
        currents = DEFAULT_Z_CURRENTS
    Z_AXIS_SETTINGS = []
    for speed in speeds:
        for acceleration in accelerations:
            for current in currents:
                Z_AXIS_SETTING = {
                    types.Axis.Z_L: helpers_ot3.GantryLoadSettings(
                        max_speed=speed,
                        acceleration=acceleration,
                        max_start_stop_speed=5,
                        max_change_dir_speed=1,
                        hold_current=0.8,
                        run_current=current,
                    ),
                    types.Axis.Z_R: helpers_ot3.GantryLoadSettings(
                        max_speed=speed,
                        acceleration=acceleration,
                        max_start_stop_speed=5,
                        max_change_dir_speed=1,
                        hold_current=0.8,
                        run_current=current,
                    ),
                }
                Z_AXIS_SETTINGS.append(Z_AXIS_SETTING)

    return Z_AXIS_SETTINGS


def _creat_xy_axis_settings(arguments: argparse.Namespace) -> List:
    x_args = arguments.x_accelerations and arguments.x_speeds and arguments.x_currents
    y_args = arguments.y_accelerations and arguments.y_speeds and arguments.y_currents
    if x_args and y_args:
        accelerations_x = [
            float(acc)
            for acc in arguments.x_accelerations.strip().replace(" ", "").split(",")
        ]
        speeds_x = [
            float(spe) for spe in arguments.x_speeds.strip().replace(" ", "").split(",")
        ]
        currents_x = [
            float(cur)
            for cur in arguments.x_currents.strip().replace(" ", "").split(",")
        ]
        accelerations_y = [
            float(acc)
            for acc in arguments.y_accelerations.strip().replace(" ", "").split(",")
        ]
        speeds_y = [
            float(spe) for spe in arguments.y_speeds.strip().replace(" ", "").split(",")
        ]
        currents_y = [
            float(cur)
            for cur in arguments.y_currents.strip().replace(" ", "").split(",")
        ]
    else:
        accelerations_x = DEFAULT_X_ACCELERATIONS
        speeds_x = DEFAULT_X_SPEEDS
        currents_x = DEFAULT_X_CURRENTS
        accelerations_y = DEFAULT_Y_ACCELERATIONS
        speeds_y = DEFAULT_Y_SPEEDS
        currents_y = DEFAULT_Y_CURRENTS
    XY_AXIS_SETTINGS = []
    speeds = zip(speeds_x, speeds_y)
    accelerations = zip(accelerations_x, accelerations_y)
    currents = zip(currents_x, currents_y)

    for speed_x, speed_y in zip(speeds_x, speeds_y):
        for acceleration_x, acceleration_y in zip(accelerations_x, accelerations_y):
            for current_x, current_y in zip(currents_x, currents_y):
                XY_AXIS_SETTING = {
                    types.Axis.X: helpers_ot3.GantryLoadSettings(
                        max_speed=speed_x,
                        acceleration=acceleration_x,
                        max_start_stop_speed=10,
                        max_change_dir_speed=5,
                        hold_current=0.5,
                        run_current=current_x,
                    ),
                    types.Axis.Y: helpers_ot3.GantryLoadSettings(
                        max_speed=speed_y,
                        acceleration=acceleration_y,
                        max_start_stop_speed=10,
                        max_change_dir_speed=5,
                        hold_current=0.5,
                        run_current=current_y,
                    ),
                }
                XY_AXIS_SETTINGS.append(XY_AXIS_SETTING)

    return XY_AXIS_SETTINGS


async def _run_z_motion(
    arguments: argparse.Namespace,
    api: OT3API,
    mount: types.OT3Mount,
    mount_up_down_points: Dict[types.OT3Mount, List[types.Point]],
    write_cb: Callable,
) -> None:
    ui.print_header("Run z motion check...")
    Z_AXIS_SETTINGS = _creat_z_axis_settings(arguments)
    for setting in Z_AXIS_SETTINGS:
        print(
            f"Z: Run speed={setting[Axis.Z_L].max_speed}, acceleration={setting[Axis.Z_L].acceleration}, current={setting[Axis.Z_L].run_current}"
        )
        await helpers_ot3.set_gantry_load_per_axis_settings_ot3(api, setting)
        fail_count = 0
        pass_count = 0
        for i in range(arguments.cycles):
            for mount in MOUNT_AXES:
                res = await _run_mount_up_down(
                    api,
                    arguments.simulate,
                    mount,
                    mount_up_down_points[mount],
                    write_cb,
                    True,
                )
                if res:
                    pass_count += 1
                else:
                    fail_count += 1
                print(
                    f"Run mount up and down cycle: {i}, results: {res}, pass count: {pass_count}, fail count: {fail_count}"
                )
            _record_motion_check_data(
                "z_motion",
                write_cb,
                setting[Axis.Z_L].max_speed,
                setting[Axis.Z_L].acceleration,
                setting[Axis.Z_L].run_current,
                i + 1,
                pass_count,
                fail_count,
            )


async def _run_xy_motion(
    arguments: argparse.Namespace,
    api: OT3API,
    mount: types.OT3Mount,
    bowtie_points: List[types.Point],
    hour_glass_points: List[types.Point],
    write_cb: Callable,
) -> None:
    ui.print_header("Run xy motion check...")
    XY_AXIS_SETTINGS = _creat_xy_axis_settings(arguments)
    for setting in XY_AXIS_SETTINGS:
        print(
            f"X: Run speed={setting[Axis.X].max_speed}, acceleration={setting[Axis.X].acceleration}, current={setting[Axis.X].run_current}"
        )
        print(
            f"Y: Run speed={setting[Axis.Y].max_speed}, acceleration={setting[Axis.Y].acceleration}, current={setting[Axis.Y].run_current}"
        )
        await helpers_ot3.set_gantry_load_per_axis_settings_ot3(api, setting)
        fail_count = 0
        pass_count = 0
        for i in range(arguments.cycles):
            res_b = await _run_bowtie(
                api, arguments.simulate, mount, bowtie_points, write_cb, True
            )
            res_hg = await _run_hour_glass(
                api, arguments.simulate, mount, hour_glass_points, write_cb, True
            )
            if res_b and res_hg:
                pass_count += 1
            else:
                fail_count += 1
            print(
                f"Run bowtie cycle: {i}, results: {res_b and res_hg}, pass count: {pass_count}, fail count: {fail_count}"
            )
            _record_motion_check_data(
                "x_motion",
                write_cb,
                setting[Axis.X].max_speed,
                setting[Axis.X].acceleration,
                setting[Axis.X].run_current,
                i + 1,
                pass_count,
                fail_count,
            )
            _record_motion_check_data(
                "y_motion",
                write_cb,
                setting[Axis.Y].max_speed,
                setting[Axis.Y].acceleration,
                setting[Axis.Y].run_current,
                i + 1,
                pass_count,
                fail_count,
            )


async def _main(arguments: argparse.Namespace) -> None:
    if (not arguments.simulate) or (not arguments.no_input):
        _robot_id = input("enter ROBOT SERIAL number: ")
        _operator = input("enter OPERATOR name: ")
    else:
        if arguments.simulate:
            _robot_id = "ot3-simulated-A01"
            _operator = "simulation"
        else:
            _robot_id = arguments.sn
            _operator = "None"

    # callback function for writing new data to CSV file
    csv_props, csv_cb = _create_csv_and_get_callbacks(_robot_id)
    # cache the pressure-data header
    # add metadata to CSV
    # FIXME: create a set of CSV helpers, such that you can define a test-report
    #        schema/format/line-length/etc., before having to fill its contents.
    #        This would be very helpful, because changes to CVS length/contents
    #        will break the analysis done in our Sheets
    csv_cb.write(["--------"])
    csv_cb.write(["METADATA"])
    csv_cb.write(["test-name", csv_props.name])
    csv_cb.write(["serial-number", _robot_id])
    csv_cb.write(["operator-name", _operator])
    csv_cb.write(["date", csv_props.id])  # run-id includes a date/time string
    test_name = Path(__file__).name
    ui.print_title(test_name.replace("_", " ").upper())
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=arguments.simulate, stall_detection_enable=False
    )
    try:
        await api.home()

        if (not arguments.simulate) or (not arguments.no_input):
            ui.get_user_ready("Is the deck totally empty?")

        mount = types.OT3Mount.LEFT

        hour_glass_points = _create_hour_glass_points(await api.gantry_position(mount))
        bowtie_points = _create_bowtie_points(await api.gantry_position(mount))
        mount_up_down_points_left = _create_mounts_up_down_points(
            await api.gantry_position(types.OT3Mount.LEFT)
        )
        mount_up_down_points_right = _create_mounts_up_down_points(
            await api.gantry_position(types.OT3Mount.RIGHT)
        )
        mount_up_down_points = {
            types.OT3Mount.LEFT: mount_up_down_points_left,
            types.OT3Mount.RIGHT: mount_up_down_points_right,
        }

        if not arguments.skip_xy_motion:
            await _run_xy_motion(
                arguments, api, mount, bowtie_points, hour_glass_points, csv_cb.write
            )
        if not arguments.skip_z_motion:
            await _run_z_motion(
                arguments, api, mount, mount_up_down_points, csv_cb.write
            )
        # set the default config
        await helpers_ot3.set_gantry_load_per_axis_settings_ot3(
            api, DEFAULT_AXIS_SETTINGS
        )
        for i in range(arguments.cycles):
            csv_cb.write(["--------"])
            csv_cb.write(["run-cycle", i + 1])
            print(f"Cycle {i + 1}/{arguments.cycles}")
            if not arguments.skip_bowtie:
                await _run_bowtie(
                    api, arguments.simulate, mount, bowtie_points, csv_cb.write
                )
                if not arguments.skip_mount:
                    for mount in MOUNT_AXES:
                        await _run_mount_up_down(
                            api,
                            arguments.simulate,
                            mount,
                            mount_up_down_points[mount],
                            csv_cb.write,
                            True,
                        )
            if not arguments.skip_hourglass:
                await _run_hour_glass(
                    api, arguments.simulate, mount, hour_glass_points, csv_cb.write
                )
                if not arguments.skip_mount:
                    for mount in MOUNT_AXES:
                        await _run_mount_up_down(
                            api,
                            arguments.simulate,
                            mount,
                            mount_up_down_points[mount],
                            csv_cb.write,
                            True,
                        )
    except KeyboardInterrupt:
        print("Cancelled")
    finally:
        await api.disengage_axes([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
        await api.clean_up()

    ui.print_title("Test Done")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--cycles", type=int, default=2)
    parser.add_argument("--sn", type=str, default="SN")
    parser.add_argument("--skip_bowtie", action="store_true")
    parser.add_argument("--skip_hourglass", action="store_true")
    parser.add_argument("--skip_mount", action="store_true")
    parser.add_argument("--skip_xy_motion", action="store_true")
    parser.add_argument("--x_speeds", type=str)
    parser.add_argument("--x_accelerations", type=str)
    parser.add_argument("--x_currents", type=str)
    parser.add_argument("--y_speeds", type=str)
    parser.add_argument("--y_accelerations", type=str)
    parser.add_argument("--y_currents", type=str)
    parser.add_argument("--skip_z_motion", action="store_true")
    parser.add_argument("--z_speeds", type=str)
    parser.add_argument("--z_accelerations", type=str)
    parser.add_argument("--z_currents", type=str)
    parser.add_argument("--no_input", action="store_true")

    args = parser.parse_args()
    asyncio.run(_main(args))
