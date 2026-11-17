"""Gripper Lifetime Test.

Repeatedly picks, holds, and drops with the OT-3 gripper while logging jaw state
and displacement to CSV. Optionally calibrates the gripper against a deck slot
before the cycle loop ("robot" mode).
"""

import argparse
import asyncio
import logging
import time
from logging.config import dictConfig
from typing import Dict, Optional

from hardware_testing import data
from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing.opentrons_api.helpers_ot3 import build_async_ot3_hardware_api
from opentrons.hardware_control.motion_utilities import target_position_from_relative
from opentrons.hardware_control.ot3_calibration import (
    calibrate_gripper,
    calibrate_gripper_jaw,
)
from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.types import Axis, GripperProbe, OT3Mount
from opentrons.types import Point
from opentrons_hardware.hardware_control.gripper_settings import set_error_tolerance
from opentrons_shared_data.deck import get_calibration_square_position_in_slot
from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError


LOG_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "basic": {"format": "%(asctime)s %(name)s %(levelname)s %(message)s"}
    },
    "handlers": {
        "file_handler": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "basic",
            "filename": "/data/logs/gripper-lifetime.log",
            "maxBytes": 5000000,
            "level": logging.DEBUG,
            "backupCount": 3,
        },
    },
    "loggers": {
        "": {
            "handlers": ["file_handler"],
            "level": logging.DEBUG,
        },
    },
}

# Written once at the top of the CSV with run + gripper Z motion settings
TEST_DETAILS_HEADER = [
    "Robot Name",
    "Test Mode",
    "Grip Force (N)",
    "Hold Time (s)",
    "Slot",
    "Grip Height (mm)",
    "Axis",
    "Max Speed (mm/s)",
    "Acceleration (mm^2/s)",
    "Hold Current (A)",
    "Run Current (A)",
    "Max Speed Discontinuity",
    "Direction Change Speed Discontinuity",
]

# Per pick/hold/drop sample rows
HEADER = [
    "Time",
    "Cycle",
    "Gripper",
    "State",
    "Jaw State",
    "Jaw Displacement",
    "Encoder Position",
    "Stall",
    "Total Stalls",
]

# Gripper mount Z is the only jaw-adjacent axis with gantry motion/current settings.
# Axis.G (jaw) uses duty-cycle force control, not these motion tables.
MOTION_AXES = [Axis.Z_G]
GRIPPER_AXES = [Axis.G, Axis.Z_G]
GRIPPER_PROBES = {
    "Front": GripperProbe.FRONT,
    "Rear": GripperProbe.REAR,
}


def get_robot_name() -> str:
    """Read PRETTY_HOSTNAME from /etc/machine-info on the robot."""
    try:
        with open("/etc/machine-info", "r") as file:
            robot_name = file.read()
        for d in robot_name.split():
            if d.startswith("PRETTY_HOSTNAME"):
                return d.split("=")[1]
        return robot_name.strip() or "UNKNOWN"
    except OSError:
        return "SIMULATION"


def _file_setup(grip_force: float) -> tuple:
    """Create the CSV run folder/file (header written later after test details)."""
    test_name = "gripper_lifetime_test"
    test_id = data.create_run_id()
    test_file = data.create_file_name(test_name, test_id, f"force_{grip_force}")
    test_path = data.create_folder_for_test_data(test_name)
    print(f"FILE PATH = {test_path}")
    print(f"FILE NAME = {test_file}")
    return test_name, test_id, test_file


def _get_gripper_motion_parameters(api: OT3API) -> Dict[str, list]:
    """Read Z_G motion/current settings for the active gantry load."""
    load = api.gantry_load
    return {
        "max_speed": [
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.motion_settings.default_max_speed, axis, load
            )
            for axis in MOTION_AXES
        ],
        "accel": [
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.motion_settings.acceleration, axis, load
            )
            for axis in MOTION_AXES
        ],
        "hold_current": [
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.current_settings.hold_current, axis, load
            )
            for axis in MOTION_AXES
        ],
        "run_current": [
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.current_settings.run_current, axis, load
            )
            for axis in MOTION_AXES
        ],
        "max_discontinuity": [
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.motion_settings.max_speed_discontinuity, axis, load
            )
            for axis in MOTION_AXES
        ],
        "direction_change_discontinuity": [
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.motion_settings.direction_change_speed_discontinuity,
                axis,
                load,
            )
            for axis in MOTION_AXES
        ],
    }


def _record_test_details(
    test_name: str,
    test_id: str,
    test_file: str,
    robot_name: str,
    mode: str,
    force: float,
    hold_time: float,
    slot: int,
    grip_height_mm: float,
    motion: Dict[str, list],
) -> None:
    """Write run parameters and gripper Z motion settings at the top of the CSV."""
    rows = [
        [TEST_DETAILS_HEADER[0], robot_name],
        [TEST_DETAILS_HEADER[1], mode],
        [TEST_DETAILS_HEADER[2], str(force)],
        [TEST_DETAILS_HEADER[3], str(hold_time)],
        [TEST_DETAILS_HEADER[4], str(slot)],
        [TEST_DETAILS_HEADER[5], str(grip_height_mm)],
        [TEST_DETAILS_HEADER[6]]
        + [str(Axis.to_kind(axis)) for axis in MOTION_AXES],
        [TEST_DETAILS_HEADER[7]] + [str(v) for v in motion["max_speed"]],
        [TEST_DETAILS_HEADER[8]] + [str(v) for v in motion["accel"]],
        [TEST_DETAILS_HEADER[9]] + [str(v) for v in motion["hold_current"]],
        [TEST_DETAILS_HEADER[10]] + [str(v) for v in motion["run_current"]],
        [TEST_DETAILS_HEADER[11]] + [str(v) for v in motion["max_discontinuity"]],
        [TEST_DETAILS_HEADER[12]]
        + [str(v) for v in motion["direction_change_discontinuity"]],
    ]
    for row in rows:
        data.append_data_to_file(
            test_name=test_name,
            run_id=test_id,
            file_name=test_file,
            data=",".join(row) + "\n",
        )
    print(
        f"Gripper Z motion — max_speed: {motion['max_speed']}, "
        f"accel: {motion['accel']}, hold: {motion['hold_current']}, "
        f"run: {motion['run_current']}\n"
    )


def _record_data(
    api: OT3API,
    test_name: str,
    test_id: str,
    test_file: str,
    gripper_id: str,
    start_time: float,
    cycle: int,
    state: str,
    stall: int = 0,
    total_stalls: int = 0,
) -> None:
    """Append one pick/hold/drop (or stall) sample row to the CSV."""
    try:
        jaw_state = str(api._gripper_handler.gripper.state).split(".")[1]
        jaw_disp = str(api._gripper_handler.gripper.current_jaw_displacement)
    except Exception:
        jaw_state = "UNKNOWN"
        jaw_disp = "UNKNOWN"
    row = [
        str(round((time.time() - start_time) / 60, 3)),
        str(cycle),
        str(gripper_id),
        state,
        jaw_state,
        jaw_disp,
        "(0.0;0.0;0.0)",  # encoder logging not enabled
        str(stall),
        str(total_stalls),
    ]
    data.append_data_to_file(test_name, test_id, test_file, ",".join(row) + "\n")


async def _recover_from_stall(api: OT3API, total_stalls: int) -> None:
    """Home after a stall so the next cycle can continue. Does not re-raise."""
    print("--STALL DETECTED--\n")
    print("------HOMING------\n")
    try:
        await api.home(GRIPPER_AXES)
        if total_stalls > 3:
            raise Exception("Total stalls exceeded 3")
    except StallOrCollisionDetectedError:
        print("--STALL DURING HOME; retrying full home--\n")
        try:
            await api.home()
        except StallOrCollisionDetectedError:
            print("--FULL HOME ALSO STALLED; continuing--\n")
    try:
        await api.ungrip()
    except Exception:
        pass


async def _move_above_slot(api: OT3API, mount: OT3Mount, slot: int) -> None:
    """Home, then move above the calibration-square center of the test slot."""
    await api.home()
    nominal_center = Point(*get_calibration_square_position_in_slot(slot))
    current_position = await api.gantry_position(mount)
    await api.move_to(mount, nominal_center._replace(z=current_position.z))


async def _pick(
    api: OT3API,
    mount: OT3Mount,
    grip_height: Point,
    grip_force: float,
    fast: bool,
) -> None:
    """Descend to grip height and close jaws."""
    target = target_position_from_relative(mount, grip_height, api._current_position)
    await api._move(target)
    if not fast:
        time.sleep(1.0)
    await api.grip(grip_force)


async def _hold(
    api: OT3API, mount: OT3Mount, hold_time: float, fast: bool, home_z: float
) -> None:
    """Lift Z to the pre-pick home height while gripping, then optionally wait.

    Uses move_to (not home_z) so the jaws stay closed under load without a
    hardware home that can stall.
    """
    pos = await api.current_position_ot3(mount, refresh=True)
    await api.move_to(mount, Point(pos[Axis.X], pos[Axis.Y], home_z))
    if not fast:
        time.sleep(hold_time)


async def _drop(
    api: OT3API, mount: OT3Mount, grip_height: Point, fast: bool
) -> None:
    """Descend to grip height and open jaws."""
    target = target_position_from_relative(mount, grip_height, api._current_position)
    await api._move(target)
    if not fast:
        time.sleep(1.0)
    await api.ungrip()


async def _calibrate_slot(api: OT3API, slot: int) -> None:
    """Run front/rear jaw probe calibration for the given slot."""
    await api.home()
    offsets: Dict[str, Optional[Point]] = {"Front": None, "Rear": None}
    for position, probe in GRIPPER_PROBES.items():
        await api.home_z()
        input(f"Add calibration probe to gripper {position.upper()}, then press ENTER: ")
        offsets[position] = await calibrate_gripper_jaw(api, probe, slot)

    offset = await calibrate_gripper(api, offsets["Front"], offsets["Rear"])
    print(f"New Gripper Offset: {offset}")
    await api.home_z()
    input("Remove calibration probe, then press ENTER: ")


async def _home_gripper(api: OT3API) -> None:
    await api.home(GRIPPER_AXES)


async def _main(
    simulate: bool,
    calibrate: bool,
    fast: bool,
    mode: str,
    cycles: int,
    force: float,
    hold_time: float,
    height: int,
    slot: int,
) -> None:
    """Set up HW API / CSV, optionally calibrate, then run pick→hold→drop cycles."""
    test_name, test_id, test_file = _file_setup(force)
    api: Optional[OT3API] = None
    total_stalls = 0

    try:
        api = await build_async_ot3_hardware_api(
            is_simulating=simulate,
            use_defaults=True,
            stall_detection_enable=True,
        )
        mount = OT3Mount.GRIPPER
        await set_error_tolerance(api._backend._messenger, 15, 15)

        gripper_id = (
            "SIMULATION"
            if simulate
            else api._gripper_handler.get_gripper().gripper_id
        )

        # Default grip height depends on mode; CLI --height overrides when > 0
        if mode == "robot":
            grip_height = Point(0, 0, -125)
        else:
            grip_height = Point(0, 0, -100)
        if height > 0:
            grip_height = Point(0, 0, -height)

        # Test-details preamble (run params + Z_G motion), then cycle column header
        motion = _get_gripper_motion_parameters(api)
        _record_test_details(
            test_name=test_name,
            test_id=test_id,
            test_file=test_file,
            robot_name=get_robot_name(),
            mode=mode,
            force=force,
            hold_time=hold_time,
            slot=slot,
            grip_height_mm=abs(grip_height.z),
            motion=motion,
        )
        data.append_data_to_file(
            test_name, test_id, test_file, ",".join(HEADER) + "\n"
        )

        print("\nStarting Gripper Lifetime Test!\n")
        start_time = time.time()

        if mode == "robot":
            if calibrate:
                await _calibrate_slot(api, slot)
            try:
                await _move_above_slot(api, mount, slot)
            except StallOrCollisionDetectedError:
                total_stalls += 1
                print(f"--STALL moving above slot; total stalls: {total_stalls}--\n")
                await _recover_from_stall(api, total_stalls)
                await _move_above_slot(api, mount, slot)

        for cycle in range(1, cycles + 1):
            print(f"\n-> Starting Test Cycle {cycle}/{cycles}")
            phase = "Home"
            try:
                await _home_gripper(api)
                home_pos = await api.current_position_ot3(mount, refresh=True)
                home_z = home_pos[Axis.Z_G]

                phase = "Picking"
                await _pick(api, mount, grip_height, force, fast)
                _record_data(
                    api,
                    test_name,
                    test_id,
                    test_file,
                    gripper_id,
                    start_time,
                    cycle,
                    phase,
                    stall=0,
                    total_stalls=total_stalls,
                )
                await api.current_position_ot3(mount, refresh=True)
                pick_jaw_disp = (
                    api._gripper_handler.get_gripper().current_jaw_displacement
                )

                phase = "Holding"
                await _hold(api, mount, hold_time, fast, home_z)
                _record_data(
                    api,
                    test_name,
                    test_id,
                    test_file,
                    gripper_id,
                    start_time,
                    cycle,
                    phase,
                    stall=0,
                    total_stalls=total_stalls,
                )
                await api.current_position_ot3(mount, refresh=True)
                hold_jaw_disp = (
                    api._gripper_handler.get_gripper().current_jaw_displacement
                )
                if abs(pick_jaw_disp - hold_jaw_disp) > 0.5:
                    raise Exception("Gripper Labware Drop Error")

                phase = "Dropping"
                await _drop(api, mount, grip_height, fast)
                _record_data(
                    api,
                    test_name,
                    test_id,
                    test_file,
                    gripper_id,
                    start_time,
                    cycle,
                    phase,
                    stall=0,
                    total_stalls=total_stalls,
                )
            except StallOrCollisionDetectedError:
                total_stalls += 1
                print(
                    f"--STALL during {phase} (cycle {cycle}); "
                    f"total stalls: {total_stalls}--\n"
                )
                _record_data(
                    api,
                    test_name,
                    test_id,
                    test_file,
                    gripper_id,
                    start_time,
                    cycle,
                    f"Stall-{phase}",
                    stall=1,
                    total_stalls=total_stalls,
                )
                await _recover_from_stall(api, total_stalls)
                # Skip remainder of this cycle; continue lifetime run
                continue
    except KeyboardInterrupt:
        print("Test Cancelled!")
    finally:
        print(f"\nExiting... (total stalls: {total_stalls})")
        if api is not None:
            try:
                await _home_gripper(api)
            except StallOrCollisionDetectedError:
                await api.home()
        print("Test Completed!")


if __name__ == "__main__":
    print("\nOT-3 Gripper Lifetime Test\n")
    dictConfig(LOG_CONFIG)
    parser = argparse.ArgumentParser(description="OT-3 Gripper Lifetime Test")
    parser.add_argument(
        "-m", "--mode", choices=["robot", "rig"], default="robot", help="Test setup mode"
    )
    parser.add_argument(
        "-a", "--calibrate", action="store_true", help="Calibrate gripper before cycles"
    )
    parser.add_argument("-c", "--cycles", type=int, default=1, help="Number of cycles")
    parser.add_argument(
        "-f", "--force", type=int, default=20, help="Grip force in Newtons"
    )
    parser.add_argument(
        "-t", "--time", type=int, default=10, help="Hold time in seconds"
    )
    parser.add_argument(
        "-g", "--height", type=int, default=0, help="Grip height override (mm down)"
    )
    parser.add_argument("-o", "--slot", type=int, default=6, help="Deck slot number")
    parser.add_argument("-z", "--fast", action="store_true", help="Skip hold/settle sleeps")
    parser.add_argument("-s", "--simulate", action="store_true", help="Simulate")
    args = parser.parse_args()

    asyncio.run(
        _main(
            simulate=args.simulate,
            calibrate=args.calibrate,
            fast=args.fast,
            mode=args.mode,
            cycles=args.cycles,
            force=args.force,
            hold_time=args.time,
            height=args.height,
            slot=args.slot,
        )
    )
