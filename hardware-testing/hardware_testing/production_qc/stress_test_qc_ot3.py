"""OT3 Overnight Test."""
import argparse
import asyncio
import os
import time

from dataclasses import dataclass
from typing import Optional, Callable, List, Any, Tuple, Dict
from pathlib import Path

from opentrons.config.defaults_ot3 import (
    DEFAULT_MAX_SPEEDS,
    DEFAULT_ACCELERATIONS,
    DEFAULT_RUN_CURRENT,
    DEFAULT_HOLD_CURRENT,
)
from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api import types
from hardware_testing.opentrons_api.types import Axis, OT3Mount, Point, OT3AxisKind
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data
from hardware_testing.data import ui

import logging

LOG = logging.getLogger(__name__)
LOG.setLevel(logging.CRITICAL)

# tells all movement settings
logging.getLogger("opentrons.hardware_control.ot3api.OT3API").setLevel(logging.CRITICAL)

# confirms speeds
logging.getLogger("opentrons_hardware.hardware_control").setLevel(logging.CRITICAL)


GANTRY_AXES = [
    Axis.X,
    Axis.Y,
    Axis.by_mount(OT3Mount.LEFT),
    Axis.by_mount(OT3Mount.RIGHT),
]
MOUNT_AXES = [OT3Mount.LEFT, OT3Mount.RIGHT]
THRESHOLD_MM = 0.125

DEFAULT_X_SPEED = DEFAULT_MAX_SPEEDS.low_throughput[OT3AxisKind.X]
DEFAULT_Y_SPEED = DEFAULT_MAX_SPEEDS.low_throughput[OT3AxisKind.Y]
DEFAULT_Z_SPEED = DEFAULT_MAX_SPEEDS.low_throughput[OT3AxisKind.Z]
DEFAULT_X_ACCELERATION = DEFAULT_ACCELERATIONS.low_throughput[OT3AxisKind.X]
DEFAULT_Y_ACCELERATION = DEFAULT_ACCELERATIONS.low_throughput[OT3AxisKind.Y]
DEFAULT_Z_ACCELERATION = DEFAULT_ACCELERATIONS.low_throughput[OT3AxisKind.Z]
DEFAULT_X_CURRENT = DEFAULT_RUN_CURRENT.low_throughput[OT3AxisKind.X]
DEFAULT_Y_CURRENT = DEFAULT_RUN_CURRENT.low_throughput[OT3AxisKind.Y]
DEFAULT_Z_CURRENT = DEFAULT_RUN_CURRENT.low_throughput[OT3AxisKind.Z]

# NOTE: using high-throughput hold current, to purposefully heat it up
DEFAULT_Z_HOLD_CURRENT = DEFAULT_HOLD_CURRENT.high_throughput[OT3AxisKind.Z]

DEFAULT_X_SPEEDS: List[float] = [
    DEFAULT_X_SPEED - 100,
    DEFAULT_X_SPEED,
    DEFAULT_X_SPEED + 100,
]
DEFAULT_X_ACCELERATIONS: List[float] = [
    DEFAULT_X_ACCELERATION - 100,
    DEFAULT_X_ACCELERATION,
    DEFAULT_X_ACCELERATION + 100,
]
DEFAULT_X_CURRENTS: List[float] = [
    DEFAULT_X_CURRENT - 0.25,
    DEFAULT_X_CURRENT,
    DEFAULT_X_CURRENT + 0.25,
]

DEFAULT_Y_SPEEDS: List[float] = [
    DEFAULT_Y_SPEED - 75,
    DEFAULT_Y_SPEED,
    DEFAULT_Y_SPEED + 75,
]
DEFAULT_Y_ACCELERATIONS: List[float] = [
    DEFAULT_Y_ACCELERATION - 100,
    DEFAULT_Y_ACCELERATION,
    DEFAULT_Y_ACCELERATION + 100,
]
DEFAULT_Y_CURRENTS: List[float] = [
    DEFAULT_Y_CURRENT - 0.2,
    DEFAULT_Y_CURRENT,
    DEFAULT_Y_CURRENT + 0.2,
]

DEFAULT_Z_SPEEDS: List[float] = [
    DEFAULT_Z_SPEED - 20,
    DEFAULT_Z_SPEED,
    DEFAULT_Z_SPEED + 20,
]
DEFAULT_Z_ACCELERATIONS: List[float] = [
    DEFAULT_Z_ACCELERATION - 50,
    DEFAULT_Z_ACCELERATION,
    DEFAULT_Z_ACCELERATION + 50,
]
DEFAULT_Z_CURRENTS: List[float] = [
    DEFAULT_Z_CURRENT - 0.25,
    DEFAULT_Z_CURRENT,
    DEFAULT_Z_CURRENT + 0.25,
]


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
    """Create CSV and get callback functions."""
    run_id = data.create_run_id()
    test_name = data.create_test_name_from_file(__file__)
    folder_path = data.create_folder_for_test_data(test_name)
    file_name = data.create_file_name(test_name=test_name, run_id=run_id, tag=sn)
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
    """Turn bool into String."""
    return "PASS" if result else "FAIL"


def _record_axis_data(
    type: str,
    write_cb: Callable,
    estimate: Dict[Axis, float],
    encoder: Dict[Axis, float],
    aligned: bool,
) -> None:
    """Record raw axis movement to csv."""
    data_str: List[str] = []
    for ax in GANTRY_AXES:
        data_str = data_str + [str(ax)] + [str(round(encoder[ax] - estimate[ax], 5))]
    write_cb([type] + [bool_to_string(aligned)] + data_str)


def _record_run_data(
    type: str,
    write_cb: Callable,
    error: Dict[Axis, float],
    aligned: bool,
) -> None:
    """Record series of axis movements to csv."""
    data_str: List[str] = []
    for ax in GANTRY_AXES:
        data_str = data_str + [str(ax)] + [str(round(error[ax], 5))]
    write_cb([type] + [bool_to_string(aligned)] + data_str)


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
    """Record motion log to csv."""
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
    """Create points for the bowtie movement."""
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
    """Create points for the hourglass movement."""
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
    """Create points for the up and down movement."""
    pos_max = homed_position
    mounts_up_down_points = [
        pos_max._replace(z=pos_max.z - 200),  # down
        pos_max,  # up
    ]
    return mounts_up_down_points


async def _move_and_check(
    api: OT3API, is_simulating: bool, mount: OT3Mount, position: types.Point
) -> Tuple[Dict[Axis, float], Dict[Axis, float], bool]:
    """Move and check accuracy with encoder."""
    if not is_simulating:
        await api.move_to(mount, position)
    else:
        pass
    estimate = {ax: api._current_position[ax] for ax in GANTRY_AXES}
    encoder = {ax: api._encoder_position[ax] for ax in GANTRY_AXES}
    aligned = True
    all_aligned_axes = [
        ax for ax in GANTRY_AXES if abs(estimate[ax] - encoder[ax]) <= THRESHOLD_MM
    ]
    for ax in GANTRY_AXES:
        LOG.info(str(ax) + str(" Error: ") + str(estimate[ax] - encoder[ax]))
        LOG.info(str(ax) + str(" Estimate: ") + str(estimate[ax]))
        LOG.info(str(ax) + str(" Encoder: ") + str(encoder[ax]))
        if ax not in all_aligned_axes:
            aligned = False

    return estimate, encoder, aligned


async def _run_mount_up_down(
    api: OT3API,
    is_simulating: bool,
    mount: OT3Mount,
    mount_up_down_points: List[types.Point],
    write_cb: Callable,
    record_bool: bool = True,
) -> bool:
    """Run Z axis up and down."""
    ui.print_header("Run mount up and down")
    pass_count = 0
    error_sum = {ax: 0.0 for ax in GANTRY_AXES}
    if mount is OT3Mount.LEFT:
        mount_type = "Mount_up_down-Left"
    else:
        mount_type = "Mount_up_down-Right"
    for pos in mount_up_down_points:
        LOG.debug(f"mount_up_down: {pos}")
        es, en, al = await _move_and_check(api, is_simulating, mount, pos)
        for ax in GANTRY_AXES:
            error_sum[ax] += en[ax] - es[ax]
        if record_bool:
            if mount is OT3Mount.LEFT:
                mount_type = "Mount_up_down-Left"
            else:
                mount_type = "Mount_up_down-Right"
            _record_axis_data(f"_{mount_type}", write_cb, es, en, al)
            print(f"{mount_type} results: {al}")
        if al:
            pass_count += 1
        else:
            break

    num_points = len(mount_up_down_points)
    error_results = {ax: error_sum[ax] / num_points for ax in GANTRY_AXES}
    if pass_count == num_points:
        _record_run_data(mount_type, write_cb, error_results, True)
        return True
    else:
        _record_run_data(mount_type, write_cb, error_results, False)
        return False


async def _run_bowtie(
    api: OT3API,
    is_simulating: bool,
    mount: OT3Mount,
    bowtie_points: List[types.Point],
    write_cb: Callable,
    record_bool: bool = True,
) -> bool:
    """Run XY in bowtie pattern."""
    ui.print_header("Run bowtie")
    pass_count = 0
    error_sum = {ax: 0.0 for ax in GANTRY_AXES}
    for p in bowtie_points:
        es, en, al = await _move_and_check(api, is_simulating, mount, p)
        for ax in GANTRY_AXES:
            error_sum[ax] += en[ax] - es[ax]
        if record_bool:
            _record_axis_data("_Bowtie", write_cb, es, en, al)
            print(f"bowtie results: {al}")
        if al:
            pass_count += 1
        else:
            break

    num_points = len(bowtie_points)
    error_results = {ax: error_sum[ax] / num_points for ax in GANTRY_AXES}
    if pass_count == num_points:
        _record_run_data("Bowtie", write_cb, error_results, True)
        return True
    else:
        _record_run_data("Bowtie", write_cb, error_results, False)
        return False


async def _run_hour_glass(
    api: OT3API,
    is_simulating: bool,
    mount: OT3Mount,
    hour_glass_points: List[types.Point],
    write_cb: Callable,
    record_bool: bool = True,
) -> bool:
    """Run XY in hour glass pattern."""
    ui.print_header("Run hour glass")
    pass_count = 0
    error_sum = {ax: 0.0 for ax in GANTRY_AXES}
    for q in hour_glass_points:
        es, en, al = await _move_and_check(api, is_simulating, mount, q)
        for ax in GANTRY_AXES:
            error_sum[ax] += en[ax] - es[ax]
        if record_bool:
            _record_axis_data("_Hour_glass", write_cb, es, en, al)
            print(f"hour glass results: {al}")
        if al:
            pass_count += 1
        else:
            break

    num_points = len(hour_glass_points)
    error_results = {ax: error_sum[ax] / num_points for ax in GANTRY_AXES}
    if pass_count == num_points:
        _record_run_data("Hour_glass", write_cb, error_results, True)
        return True
    else:
        _record_run_data("Hour_glass", write_cb, error_results, False)
        return False


def _get_accelerations_from_user() -> List:
    """Get acceleration list from user."""
    condition = True
    accelerations = []
    while condition:
        accelerations_input = input(
            """WAIT: please input the acceleration and split with ','
            like: 100,200,300 then press ENTER when ready: """
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
    """Get speed list from user."""
    condition = True
    speeds = []
    while condition:
        speeds_input = input(
            """WAIT: please input the speeds and split with ','
            like: 100,200,300 then press ENTER when ready: """
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
    """Get current list from user."""
    condition = True
    currents = []
    while condition:
        currents_input = input(
            """WAIT: please input the currents and split with ','
            like: 100,200,300 then press ENTER when ready: """
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
    """Generate list of Z gantry settings to test."""
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
                    Axis.Z: helpers_ot3.GantryLoadSettings(
                        max_speed=speed,
                        acceleration=acceleration,
                        max_start_stop_speed=10000,  # not used, so value doesn't matter
                        max_change_dir_speed=10000,  # not used, so value doesn't matter
                        hold_current=DEFAULT_Z_HOLD_CURRENT,  # NOTE: only set this for Z axes
                        run_current=current,
                    )
                }
                Z_AXIS_SETTINGS.append(Z_AXIS_SETTING)

    return Z_AXIS_SETTINGS


def _creat_xy_axis_settings(arguments: argparse.Namespace) -> List:
    """Generate list of XY gantry settings to test."""
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

    for speed_x, speed_y in zip(speeds_x, speeds_y):
        for acceleration_x, acceleration_y in zip(accelerations_x, accelerations_y):
            for current_x, current_y in zip(currents_x, currents_y):
                XY_AXIS_SETTING = {
                    Axis.X: helpers_ot3.GantryLoadSettings(
                        max_speed=speed_x,
                        acceleration=acceleration_x,
                        max_start_stop_speed=10000,  # not used, so value doesn't matter
                        max_change_dir_speed=10000,  # not used, so value doesn't matter
                        hold_current=0,  # not used, so value doesn't matter
                        run_current=current_x,
                    ),
                    Axis.Y: helpers_ot3.GantryLoadSettings(
                        max_speed=speed_y,
                        acceleration=acceleration_y,
                        max_start_stop_speed=10000,  # not used, so value doesn't matter
                        max_change_dir_speed=10000,  # not used, so value doesn't matter
                        hold_current=0,  # not used, so value doesn't matter
                        run_current=current_y,
                    ),
                }
                XY_AXIS_SETTINGS.append(XY_AXIS_SETTING)

    return XY_AXIS_SETTINGS


def print_motion_settings(
    axis: str, speed: float, accel: float, current: float
) -> None:
    """Prints the motion settings."""
    print(f"{axis}: Run speed={speed}, acceleration={accel}, current={current}")


def print_cycle_results(a: str, c: int, r: int, p: int, f: int) -> None:
    """Prints the cycle results."""
    print(f"Run {a} cycle: {c}, results: {r}, pass count: {p}, fail count: {f}")


async def _run_z_motion(
    arguments: argparse.Namespace,
    api: OT3API,
    mount: OT3Mount,
    mount_up_down_points: Dict[OT3Mount, List[types.Point]],
    write_cb: Callable,
) -> bool:
    """Test Z at different settings."""
    if arguments.skip_z_motion:
        return True

    write_cb(["--------"])
    write_cb(["z_motion"])
    ui.print_header("Run z motion check...")
    Z_AXIS_SETTINGS = _creat_z_axis_settings(arguments)
    LOG.info(Z_AXIS_SETTINGS)
    for setting in Z_AXIS_SETTINGS:
        print_motion_settings(
            "Z",
            setting[Axis.Z].max_speed,
            setting[Axis.Z].acceleration,
            setting[Axis.Z].run_current,
        )
        z_ax = Axis.Z_L if mount == OT3Mount.LEFT else Axis.Z_R
        await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
            api,
            z_ax,
            api.gantry_load,
            default_max_speed=setting[z_ax].max_speed,
            acceleration=setting[z_ax].acceleration,
        )
        await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
            api,
            z_ax,
            api.gantry_load,
            run_current=setting[z_ax].run_current,
            hold_current=setting[z_ax].hold_current,  # NOTE: only set this for Z axes
        )
        LOG.info(f"Motor Current Settings: {api._backend._current_settings}")
        fail_count = 0
        pass_count = 0
        for i in range(arguments.cycles):
            for z_mount in MOUNT_AXES:
                res = await _run_mount_up_down(
                    api,
                    arguments.simulate,
                    z_mount,
                    mount_up_down_points[z_mount],
                    write_cb,
                    arguments.record_error,
                )
                if res:
                    pass_count += 1
                else:
                    fail_count += 1
                print_cycle_results("Z", i + 1, res, pass_count, fail_count)
            _record_motion_check_data(
                "z_motion",
                write_cb,
                setting[Axis.Z].max_speed,
                setting[Axis.Z].acceleration,
                setting[Axis.Z].run_current,
                i + 1,
                pass_count,
                fail_count,
            )
            if fail_count > 0:
                return False

    return True


async def _run_xy_motion(
    arguments: argparse.Namespace,
    api: OT3API,
    mount: OT3Mount,
    bowtie_points: List[types.Point],
    hour_glass_points: List[types.Point],
    write_cb: Callable,
) -> bool:
    """Test XY at different settings."""
    if arguments.skip_xy_motion:
        return True

    write_cb(["--------"])
    write_cb(["xy_motion"])
    ui.print_header("Run xy motion check...")
    XY_AXIS_SETTINGS = _creat_xy_axis_settings(arguments)
    LOG.info(XY_AXIS_SETTINGS)
    for setting in XY_AXIS_SETTINGS:
        print_motion_settings(
            "X",
            setting[Axis.X].max_speed,
            setting[Axis.X].acceleration,
            setting[Axis.X].run_current,
        )
        print_motion_settings(
            "Y",
            setting[Axis.Y].max_speed,
            setting[Axis.Y].acceleration,
            setting[Axis.Y].run_current,
        )
        for ax in [Axis.X, Axis.Y]:
            await helpers_ot3.set_gantry_load_per_axis_motion_settings_ot3(
                api,
                ax,
                api.gantry_load,
                default_max_speed=setting[ax].max_speed,
                acceleration=setting[ax].acceleration,
            )
            await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
                api,
                ax,
                api.gantry_load,
                run_current=setting[ax].run_current,
            )
            LOG.info(f"Motor Current Settings: {api._backend._current_settings}")
        fail_count = 0
        pass_count = 0
        for i in range(max(int(arguments.cycles / 2), 1)):
            res_b = await _run_bowtie(
                api,
                arguments.simulate,
                mount,
                bowtie_points,
                write_cb,
                arguments.record_error,
            )
            res_hg = await _run_hour_glass(
                api,
                arguments.simulate,
                mount,
                hour_glass_points,
                write_cb,
                arguments.record_error,
            )
            if res_b and res_hg:
                pass_count += 1
            else:
                fail_count += 1
            print_cycle_results("XY", i + 1, res_b and res_hg, pass_count, fail_count)
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

            if fail_count > 0:
                return False

    return True


async def _run_gantry_cycles(
    arguments: argparse.Namespace,
    api: OT3API,
    mount: OT3Mount,
    bowtie_points: List[types.Point],
    hour_glass_points: List[types.Point],
    mount_up_down_points: Dict[OT3Mount, List[types.Point]],
    csv_cb: CSVCallbacks,
) -> bool:
    """Cycle the gantry at nominal settings."""
    qc_pass = True
    for i in range(arguments.cycles):
        csv_cb.write(["--------"])
        csv_cb.write(["run-cycle", i + 1])
        print(f"Cycle {i + 1}/{arguments.cycles}")
        if not arguments.skip_bowtie:
            qc_pass = await _run_bowtie(
                api,
                arguments.simulate,
                mount,
                bowtie_points,
                csv_cb.write,
                arguments.record_error,
            )
            if not qc_pass:
                return qc_pass
            if not arguments.skip_mount:
                for z_mount in MOUNT_AXES:
                    qc_pass = await _run_mount_up_down(
                        api,
                        arguments.simulate,
                        z_mount,
                        mount_up_down_points[z_mount],
                        csv_cb.write,
                        arguments.record_error,
                    )
                    if not qc_pass:
                        return qc_pass
        if not arguments.skip_hourglass:
            qc_pass = await _run_hour_glass(
                api,
                arguments.simulate,
                mount,
                hour_glass_points,
                csv_cb.write,
                arguments.record_error,
            )
            if not qc_pass:
                return qc_pass
            if not arguments.skip_mount:
                for z_mount in MOUNT_AXES:
                    qc_pass = await _run_mount_up_down(
                        api,
                        arguments.simulate,
                        z_mount,
                        mount_up_down_points[z_mount],
                        csv_cb.write,
                        arguments.record_error,
                    )
                    if not qc_pass:
                        return qc_pass

    return qc_pass


async def get_test_metadata(
    api: OT3API, arguments: argparse.Namespace
) -> Tuple[str, str]:
    """Get the operator name and robot serial number."""
    if arguments.no_input:
        _operator = "None"
        _robot_id = api._backend.eeprom_data.serial_number
        if not _robot_id:
            ui.print_error("no serial number saved on this robot")
            _robot_id = "None"
    else:
        if arguments.simulate:
            _robot_id = "ot3-simulated-A01"
            _operator = "simulation"
        else:
            _robot_id = api._backend.eeprom_data.serial_number
            if not _robot_id:
                ui.print_error("no serial number saved on this robot")
                _robot_id = input("enter ROBOT SERIAL number: ").strip()
            _operator = input("enter OPERATOR name: ")

    return (_operator, _robot_id)


async def enforce_pipette_attached(
    api: OT3API, mount: OT3Mount, attach_pos: Point
) -> None:
    """Check if pipette is attached, prompt user to attach if not."""
    await api.reset()
    if not api.hardware_pipettes[mount.to_mount()]:
        await helpers_ot3.move_to_arched_ot3(api, mount, attach_pos)
        while not api.hardware_pipettes[mount.to_mount()]:
            ui.get_user_ready(f"attach a multichannel pipette to {mount.name} mount")
            time.sleep(0.5)
            await api.reset()
        await api.home_z(mount)


async def _main(arguments: argparse.Namespace) -> None:
    """Stress Test."""
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=arguments.simulate
    )

    _operator, _robot_id = await get_test_metadata(api, arguments)

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
    qc_pass = False
    try:
        await api.home()
        home_pos = await api.gantry_position(OT3Mount.LEFT)
        attach_pos = helpers_ot3.get_slot_calibration_square_position_ot3(5)
        attach_pos = attach_pos._replace(z=home_pos.z)

        await api.reset()
        if (not arguments.simulate) and (not arguments.no_input):
            await enforce_pipette_attached(api, OT3Mount.LEFT, attach_pos)
            await enforce_pipette_attached(api, OT3Mount.RIGHT, attach_pos)
            await api.home()

        mount = OT3Mount.LEFT

        hour_glass_points = _create_hour_glass_points(await api.gantry_position(mount))
        bowtie_points = _create_bowtie_points(await api.gantry_position(mount))
        mount_up_down_points_left = _create_mounts_up_down_points(
            await api.gantry_position(OT3Mount.LEFT)
        )
        mount_up_down_points_right = _create_mounts_up_down_points(
            await api.gantry_position(OT3Mount.RIGHT)
        )
        mount_up_down_points = {
            OT3Mount.LEFT: mount_up_down_points_left,
            OT3Mount.RIGHT: mount_up_down_points_right,
        }

        # set high throughput hold current
        await helpers_ot3.set_gantry_load_per_axis_current_settings_ot3(
            api,
            Axis.Z,
            api.gantry_load,
            hold_current=DEFAULT_Z_CURRENT,  # NOTE: only set this for Z axes
        )
        LOG.info(DEFAULT_Z_CURRENT)
        LOG.info(f"Motor Current Settings: {api._backend._current_settings}")

        qc_pass = await _run_gantry_cycles(
            arguments,
            api,
            mount,
            bowtie_points,
            hour_glass_points,
            mount_up_down_points,
            csv_cb,
        )
        if not qc_pass:
            return

        qc_pass = await _run_xy_motion(
            arguments, api, mount, bowtie_points, hour_glass_points, csv_cb.write
        )
        if not qc_pass:
            return

        qc_pass = await _run_z_motion(
            arguments, api, mount, mount_up_down_points, csv_cb.write
        )
        if not qc_pass:
            return

    except KeyboardInterrupt:
        print("Cancelled")
    finally:
        await api.clean_up()
        if qc_pass:
            ui.print_title("Test Done - PASSED")
        else:
            ui.print_title("Test Done - FAILED")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--cycles", type=int, default=20)
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
    parser.add_argument("--record_error", action="store_true")

    args = parser.parse_args()
    asyncio.run(_main(args))
