"""Gantry Z lifetime test — low-throughput (dual pipette) configuration.

Runs a repeating "bowtie" XY/Z path on both mounts with tip-pick plunges against
a calibration block. StallOrCollisionDetectedError is caught so the script can
home, recover, and continue rather than exiting.

Each cycle logs stall counts and open-loop vs encoder position drift to CSV.
Requires both left and right pipettes attached (GantryLoad.LOW_THROUGHPUT).
"""

import argparse
import asyncio
import time
from typing import List, Dict, Union
import sys

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data


from opentrons.config.types import GantryLoad
from opentrons.hardware_control.types import OT3Mount, Axis
from opentrons.types import Point

from opentrons.hardware_control.types import CriticalPoint
from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError

# Tip length used for pick_up_tip plunge depth against the cal block
TIP_LENGTH_MM = 57

# Fallback deck coordinates used to seed the bowtie path before cycle 1
# refreshes left-mount XY/Z from live position (moves 3 and 8)
MIN_LEFT_X_OFFSET = -70
MIN_LEFT_Y_OFFSET = 74
MIN_Z_OFFSET = 509.15

# Per-cycle CSV columns written by _main
HEADER = ["Cycle", "Time (H:M:S)", "XY Stall", "Y Stall", "Z_L Stall", "Z_R Stall",
          "Cycle Stalls", "Total Stalls","Open-Loop Position", "Encoder Position",
          "Difference X (mm)", "Difference Y (mm)", "Difference Z (mm)"]

# Written once at the top of the CSV with motion/current settings for this run
TEST_DETAILS_HEADER = ["Robot Name", "Test Configuration", "Axis", "Max Speed (mm/s)",
                        "Acceleration (mm^2/s)", "Hold Current (A)", "Run Current (A)",
                        "Max Speed Discontinuity", "Direction Change Speed Discontinuity"]

AXES: List[Axis] = [Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R]

# Populated from robot motion/current config in _main before the CSV header is written
MAX_SPEED: List[int] = []
ACCEL: List[int] = []
HOLD_CURRENT: List[float] = []
RUN_CURRENT: List[float] = []
MAX_DISCONTINUITY: List[float] = []
DIRECTION_CHANGE_DISCONTINUITY: List[float] = []

def convert(seconds):
    """Format elapsed seconds as WW:DD:HH:MM:SS for the CSV time column."""
    weeks, seconds = divmod(seconds, 7 * 24 * 60 * 60)
    days, seconds = divmod(seconds, 24 * 60 * 60)
    hours, seconds = divmod(seconds, 60 * 60)
    minutes, seconds = divmod(seconds, 60)

    return "%02d:%02d:%02d:%02d:%02d" % (weeks, days, hours, minutes, seconds)

def get_robot_name() -> str:
    """Read PRETTY_HOSTNAME from /etc/machine-info on the robot.

    Example file contents:
        DEPLOYMENT=development, PRETTY_HOSTNAME=TESTROBOT
    """
    robot_info_file = "/etc/machine-info"
    with open(robot_info_file, 'r') as file:
        robot_name = file.read()
    for d in robot_name.split():
        if d.startswith('PRETTY_HOSTNAME'):
            robot_name = d.split('=')[1]
    return robot_name

def record_test_details(
    test_name: str,
    run_id: str,
    file_name: str,
    robot_name: str,
    test_config: str,
) -> None:
    """Write robot name, gantry load, and per-axis motion settings to the CSV."""
    rows = [
        [TEST_DETAILS_HEADER[0], robot_name],
        [TEST_DETAILS_HEADER[1], test_config],
        [TEST_DETAILS_HEADER[2]] + [str(Axis.to_kind(axis)) for axis in AXES],
        [TEST_DETAILS_HEADER[3]] + [str(v) for v in MAX_SPEED],
        [TEST_DETAILS_HEADER[4]] + [str(v) for v in ACCEL],
        [TEST_DETAILS_HEADER[5]] + [str(v) for v in HOLD_CURRENT],
        [TEST_DETAILS_HEADER[6]] + [str(v) for v in RUN_CURRENT],
        [TEST_DETAILS_HEADER[7]] + [str(v) for v in MAX_DISCONTINUITY],
        [TEST_DETAILS_HEADER[8]] + [str(v) for v in DIRECTION_CHANGE_DISCONTINUITY],
    ]
    for row in rows:
        data.append_data_to_file(
            test_name=test_name,
            run_id=run_id,
            file_name=file_name,
            data=",".join(row) + "\n",
        )

def _create_points(x_pt, y_pt, z_pt):
    """Build the bowtie path for one cycle.

    Each entry is [Point | "", OT3Mount, axis_label]:
      - int keys: gantry move_to targets (Point + mount + stall-axis label)
      - str keys: tip-pick routines (mount + "P"); Point slot unused

    Axis labels drive stall recovery / CSV bucketing:
      "XY" / "Y" / "Z_L" / "Z_R" / "P" / "M" (multi) / "start"

    x_pt, y_pt, z_pt are substituted into left-mount approach points (3/4, 8/9)
    so the path can track the live left position after earlier moves.
    """
    BOWTIE_COORDINATES: Dict[Union[int, str], List[Union[Point, OT3Mount, str]]] = {
        0: [Point(454.703, 396.3, 250.0), OT3Mount.LEFT, "start"],
        1: [Point(508.7, 396.3, 98.34), OT3Mount.RIGHT, "Z_R"],
        "Tip Pick Up - Right 1": ["", OT3Mount.RIGHT, "P"],
        2: [Point(0, 75.0, 250.0), OT3Mount.RIGHT, "XY"],
        3: [Point(x_pt, y_pt, z_pt), OT3Mount.LEFT, "M"],
        4: [Point(x_pt, y_pt, z_pt) - Point(x=0, y=0, z=150), OT3Mount.LEFT, "Z_L"],
        "Tip Pick Up - Left 1": ["", OT3Mount.LEFT, "P"],
        5: [Point(-54.0, 396.3, 250.0), OT3Mount.LEFT, "Y"],
        6: [Point(0, 396.3, 99.0), OT3Mount.RIGHT, "Z_R"],
        "Tip Pick Up - Right 2": ["", OT3Mount.RIGHT, "P"],
        7: [Point(509.0, 75.0, 250.0), OT3Mount.RIGHT, "XY"],
        8: [Point(x_pt, y_pt, z_pt), OT3Mount.LEFT, "M"],
        9: [Point(x_pt, y_pt, z_pt) - Point(x=0, y=0, z=150), OT3Mount.LEFT, "Z_L"],
        "Tip Pick Up - Left 2": ["", OT3Mount.LEFT, "P"],
        10: [Point(454.7, 396.3, 250.0), OT3Mount.LEFT, "Y"],
    }
    return BOWTIE_COORDINATES


def _stall_axis_for_mount(mount: OT3Mount) -> Axis:
    """Map a pipette mount to its Z axis (left → Z_L, right → Z_R)."""
    return Axis.Z_L if mount == OT3Mount.LEFT else Axis.Z_R


async def _recover_from_stall(
    api,
    mount: OT3Mount,
    target: Point,
    axis_label: str,
    stall_counts: Dict[str, int],
) -> None:
    """Home after a bowtie-move stall, then retry the target; do not re-raise.

    Homing strategy follows axis_label:
      - "XY" / contains "X" → full home
      - "Y"                 → home Y only
      - "Z*" / "P"          → home that mount's Z
      - anything else       → full home (position unknown after stall)

    If home or the retry move stalls again, fall back to a full home and continue
    so a single recovery failure cannot kill the lifetime run.
    """
    print("--STALL DETECTED--\n")
    print(f"Axis/Axes stalled: {axis_label}\n")
    stall_counts["stall"] += 1
    stall_axis = _stall_axis_for_mount(mount)

    # Bucket this stall for the per-cycle CSV columns
    if "X" in axis_label:
        stall_counts["xy"] += 1
    elif axis_label == "Y":
        stall_counts["y"] += 1
    elif mount == OT3Mount.LEFT:
        stall_counts["z_l"] += 1
    else:
        stall_counts["z_r"] += 1

    print("------HOMING------\n")
    try:
        if "X" in axis_label:
            await api.home()
        elif axis_label == "Y":
            await api.home([Axis.Y])
        elif "Z" in axis_label or axis_label == "P":
            await api.home([stall_axis])
        else:
            # Labels like "M" / "start" — full home so position is known again
            await api.home()
    except StallOrCollisionDetectedError:
        print("--STALL DURING HOME; retrying full home--\n")
        await api.home()

    print(
        f"Total stalls for this cycle: {stall_counts['stall']} "
        f"(XY: {stall_counts['xy']}, Y: {stall_counts['y']}, "
        f"Z_L: {stall_counts['z_l']}, Z_R: {stall_counts['z_r']})\n"
    )

    # Safe approach: move XY at current (homed) Z, then descend to the target Z
    try:
        home_z_pos = await api.current_position_ot3(mount, refresh=True)
        await api.move_to(
            mount,
            Point(target.x, target.y, home_z_pos[stall_axis]),
        )
        await api.move_to(mount, target)
    except StallOrCollisionDetectedError:
        print("--STALL DURING RECOVERY; full home and continuing--\n")
        await api.home()


async def _bowtie_move(api) -> tuple:
    """Run one full bowtie cycle (moves + tip picks) and return stall / position data.

    Returns:
        (stall_count, xy_count, y_count, z_l_count, z_r_count,
         final_encoder_pos, open_loop_pos)
    """
    stall_counts = {"stall": 0, "xy": 0, "y": 0, "z_l": 0, "z_r": 0}
    open_loop_pos = {}
    final_encoder_pos = {}

    low_throughput_points = _create_points(MIN_LEFT_X_OFFSET, MIN_LEFT_Y_OFFSET, MIN_Z_OFFSET)
    for key in low_throughput_points.keys():
        if isinstance(key, int):
            # --- Integer keys: gantry move_to segments ---
            print(f">> Move {key} <<\n")
            # Refresh left approach points from live position before moves 3 and 8
            if key == 3 or key == 8:
                cur_pos = await api.current_position_ot3(
                    OT3Mount.LEFT, refresh=True
                )
                x_pt = cur_pos[Axis.X]
                y_pt = cur_pos[Axis.Y]
                z_pt = cur_pos[Axis.Z_L]
                low_throughput_points = _create_points(x_pt, y_pt, z_pt)
            mount = low_throughput_points[key][1]
            target = low_throughput_points[key][0]
            axis_label = low_throughput_points[key][2]
            try:
                await api.move_to(mount, target)
                print(
                    f"Current position: {await api.gantry_position(mount)} on Mount: {mount}"
                )
                encoder_pos = await api.encoder_current_position_ot3(
                    mount, refresh=True
                )
                axis = _stall_axis_for_mount(mount)
                print(
                    f"Encoder position: ({encoder_pos[Axis.X]}, {encoder_pos[Axis.Y]}, {encoder_pos[axis]})"
                )
                if key != 10:
                    print(
                        f"Moving to: {low_throughput_points[key+1][0]} on {low_throughput_points[key+1][1]}\n"
                    )
            except StallOrCollisionDetectedError:
                await _recover_from_stall(api, mount, target, axis_label, stall_counts)
        else:
            # --- String keys: tip-pick plunge against the calibration block ---
            print(f">> {key} <<\n")
            print("Moving mount down to calibration block...\n")
            mount = low_throughput_points[key][1]
            axis_label = low_throughput_points[key][2]
            try:
                tip_pick_up_pos = await api.current_position_ot3(mount, refresh=True)
                await api.move_to(
                    mount,
                    Point(tip_pick_up_pos[Axis.X], tip_pick_up_pos[Axis.Y], 70.5),
                )  # ~72 mm with rectangular aluminum block
                # Plunge as if picking a tip (loads Z); then clear tip state and home Z
                await api.pick_up_tip(mount, TIP_LENGTH_MM, prep_after=False)
                api.remove_tip(mount)
                await api.home_z(mount)
            except StallOrCollisionDetectedError:
                # Tip-pick stalls (often head_r / head_l) previously killed the script
                # because this branch had no handler. Home and continue the cycle.
                print("--STALL DETECTED DURING TIP PICK--\n")
                print(f"Axis/Axes stalled: {axis_label} on {mount}\n")
                stall_counts["stall"] += 1
                if mount == OT3Mount.LEFT:
                    stall_counts["z_l"] += 1
                else:
                    stall_counts["z_r"] += 1
                print("------HOMING------\n")
                try:
                    await api.home([_stall_axis_for_mount(mount)])
                except StallOrCollisionDetectedError:
                    print("--STALL DURING HOME; retrying full home--\n")
                    await api.home()
                # Best-effort clear of HW tip state if pick_up_tip partially succeeded
                try:
                    api.remove_tip(mount)
                except Exception:
                    pass
                print(
                    f"Total stalls for this cycle: {stall_counts['stall']} "
                    f"(XY: {stall_counts['xy']}, Y: {stall_counts['y']}, "
                    f"Z_L: {stall_counts['z_l']}, Z_R: {stall_counts['z_r']})\n"
                )

            # Snapshot left-mount open-loop vs encoder after each tip-pick segment
            open_loop_pos = await api.current_position_ot3(
                OT3Mount.LEFT, refresh=True
            )
            final_encoder_pos = await api.encoder_current_position_ot3(
                OT3Mount.LEFT, refresh=True
            )

    return (
        stall_counts["stall"],
        stall_counts["xy"],
        stall_counts["y"],
        stall_counts["z_l"],
        stall_counts["z_r"],
        final_encoder_pos,
        open_loop_pos,
    )


async def _main(is_simulating: bool, cycles: int, mount: OT3Mount) -> None:
    """Set up HW API, log config, then run `cycles` bowtie loops writing CSV each cycle."""
    api = await helpers_ot3.build_async_ot3_hardware_api(
        is_simulating=is_simulating, stall_detection_enable=True
    )
    await api.cache_instruments()
    await api.home()
    load = api.gantry_load

    robot_name = get_robot_name()
    test_name = "gantry-z-lifetime-test"
    test_config = load.value
    test_tag = load.value
    print(f"\ntest_config: {load.value}\n")

    rm = api.get_attached_instrument(OT3Mount.RIGHT).get("name")
    lm = api.get_attached_instrument(OT3Mount.LEFT).get("name")
    gripper = api.get_attached_instrument(OT3Mount.GRIPPER).get("name")

    # Low-throughput bowtie uses both Z axes; refuse to run with a missing pipette
    if load == GantryLoad.LOW_THROUGHPUT and (rm is None or lm is None):
        sys.exit("Low throughput test requires two pipettes. Exiting test script...\n")

    # Snapshot motion settings for the CSV preamble (one value per axis in AXES)
    for AXIS in AXES:
        MAX_SPEED.append(
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.motion_settings.default_max_speed, AXIS, load
            )
        )
        ACCEL.append(
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.motion_settings.acceleration, AXIS, load
            )
        )
        HOLD_CURRENT.append(
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.current_settings.hold_current, AXIS, load
            )
        )
        RUN_CURRENT.append(
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.current_settings.run_current, AXIS, load
            )
        )
        MAX_DISCONTINUITY.append(
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.motion_settings.max_speed_discontinuity, AXIS, load
            )
        )
        DIRECTION_CHANGE_DISCONTINUITY.append(
            helpers_ot3.get_gantry_per_axis_setting_ot3(
                api.config.motion_settings.direction_change_speed_discontinuity,
                AXIS,
                load,
            )
        )
    print(f"MAX_SPEED: {MAX_SPEED}\nACCEL: {ACCEL}\nHOLD_CURRENT: {HOLD_CURRENT}\nRUN_CURRENT: {RUN_CURRENT}\nMAX_DISCONTINUITY: {MAX_DISCONTINUITY}\nDIRECTION_CHANGE_DISCONTINUITY: {DIRECTION_CHANGE_DISCONTINUITY}\n")
    run_id = data.create_run_id()
    file_name = data.create_file_name(test_name=test_name, run_id=run_id, tag=test_tag)
    record_test_details(
        test_name=test_name,
        run_id=run_id,
        file_name=file_name,
        robot_name=robot_name,
        test_config=test_config,
    )
    header_str = ",".join(HEADER) + "\n"
    print(f"header_str: {header_str}\n")
    data.append_data_to_file(
        test_name=test_name,
        run_id=run_id,
        file_name=file_name,
        data=header_str,
    )

    start_time = time.perf_counter()
    total_stalls = 0

    for cycle in range(cycles):
        print(f"\n========== Cycle {cycle + 1}/{cycles} ==========\n")
        (
            stall_count,
            xy_count,
            y_count,
            z_l_count,
            z_r_count,
            final_encoder_pos,
            open_loop_pos,
        ) = await _bowtie_move(api)
        total_stalls += stall_count

        # Open-loop (commanded) vs encoder (measured) drift on left mount
        print(f"{final_encoder_pos}\n")
        print(f"{open_loop_pos}\n")
        diff_pos_x = final_encoder_pos[Axis.X] - open_loop_pos[Axis.X]
        diff_pos_y = final_encoder_pos[Axis.Y] - open_loop_pos[Axis.Y]
        diff_pos_z = final_encoder_pos[Axis.Z_L] - open_loop_pos[Axis.Z_L]
        str_open = (
            f"{open_loop_pos[Axis.X]:.3f}"
            + " "
            + f"{open_loop_pos[Axis.Y]:.3f}"
            + " "
            + f"{open_loop_pos[Axis.Z_L]:.3f}"
        )
        str_enc = (
            f"{final_encoder_pos[Axis.X]:.3f}"
            + " "
            + f"{final_encoder_pos[Axis.Y]:.3f}"
            + " "
            + f"{final_encoder_pos[Axis.Z_L]:.3f}"
        )
        cycle_data = [
            str(cycle + 1),
            str(convert(time.perf_counter() - start_time)),
            str(xy_count),
            str(y_count),
            str(z_l_count),
            str(z_r_count),
            str(stall_count),
            str(total_stalls),
            str_open,
            str_enc,
            str(diff_pos_x),
            str(diff_pos_y),
            str(diff_pos_z),
        ]
        cycle_data_str = ",".join(cycle_data) + "\n"
        data.append_data_to_file(
            test_name=test_name,
            run_id=run_id,
            file_name=file_name,
            data=cycle_data_str,
        )
    await api.home()


if __name__ == "__main__":
    mount_options = {
        "left": OT3Mount.LEFT,
        "right": OT3Mount.RIGHT,
        "gripper": OT3Mount.GRIPPER,
    }
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument(
        "--mount", type=str, choices=list(mount_options.keys()), default="left"
    )
    parser.add_argument("--cycles", type=int, default=25000)
    args = parser.parse_args()
    mount = mount_options[args.mount]

    asyncio.run(_main(args.simulate, args.cycles, mount))
