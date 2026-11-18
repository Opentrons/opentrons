"""Gantry Z lifetime test — high-throughput (96-channel) configuration.

Runs a repeating "bowtie" XY/Z path on the left mount only, with tip-pick plunges
against a calibration block. StallOrCollisionDetectedError is caught so the
script can home, recover, and continue rather than exiting.

Every 10th cycle uses full pick-up current (1.5 A); other cycles use partial
current (0.75 A) to stress Z under reduced current. Each cycle logs stall counts,
pick-up current, and open-loop vs encoder position drift to CSV.

Expects a 96ch pipette on the left mount (right should be empty).
"""

import argparse
import asyncio
import time
from typing import List, Dict, Union
import sys
import json
import requests

from hardware_testing.opentrons_api import helpers_ot3
from hardware_testing import data

from opentrons.config.types import GantryLoad
from opentrons.hardware_control.types import OT3Mount, Axis
from opentrons.types import Point

from opentrons.hardware_control.types import CriticalPoint
from opentrons_shared_data.errors.exceptions import StallOrCollisionDetectedError

# Tip length used for pick_up_tip plunge depth against the cal block
TIP_LENGTH_MM = 57
# Full vs partial Z pick-up currents (A); partial is used most cycles
DEFAULT_Z_CURRENT = 1.5
PARTIAL_PICK_UP_CURRENT = 0.75

# Approximate usable gantry travel used to build deck corner points
MAX_TRAVEL_MM = {
    Axis.X: 427.96,
    Axis.Y: 408.26,
    Axis.Z_L: 249.89,
}

# How far down from current Z to drop before the tip-pick plunge
PREP_POSITION_BLOCK_LOCATION = 188
MIN_LEFT_X_OFFSET = -70
MIN_LEFT_Y_OFFSET = 74

# Keep max corner slightly inset from hard travel limits
MAX_LEFT_Y_OFFSET = 21
MAX_LEFT_X_OFFSET = 1
MAX_LEFT_Z_OFFSET = 1

Z_MIN_OFFSET = 150

POINT_MAX_LEFT = Point(x=MAX_TRAVEL_MM[Axis.X] - MAX_LEFT_X_OFFSET,
                            y=MAX_TRAVEL_MM[Axis.Y] - MAX_LEFT_Y_OFFSET,
                            z = MAX_TRAVEL_MM[Axis.Z] - MAX_LEFT_Z_OFFSET)
MIN_LEFT_POINT = Point(
                        x=MIN_LEFT_X_OFFSET,
                        y=MIN_LEFT_Y_OFFSET,
                        z=POINT_MAX_LEFT.z - PREP_POSITION_BLOCK_LOCATION
                    )

# Bowtie path on LEFT mount only.
# int keys → move_to targets; str keys → tip-pick routines (Point unused).
# Stall axis for int moves is inferred from start→target deltas (see _axis_label_for_move).
BOWTIE_COORDINATES: Dict[Union[str, int], Point] = {
    0: POINT_MAX_LEFT,  # back right and up
    1: MIN_LEFT_POINT._replace(z=POINT_MAX_LEFT.z),  # front left and up
    2: MIN_LEFT_POINT,  # front left and down
    "Tip Pick Up - 1": Point(0, 0, 0),
    3: MIN_LEFT_POINT._replace(y=POINT_MAX_LEFT.y),  # back left and down
    4: POINT_MAX_LEFT._replace(x=MIN_LEFT_POINT.x),  # back left and up
    5: POINT_MAX_LEFT._replace(y=MIN_LEFT_POINT.y),  # front right and up
    6: MIN_LEFT_POINT._replace(x=POINT_MAX_LEFT.x),  # front right and down
    "Tip Pick Up - 2": Point(0, 0, 0),
    7: POINT_MAX_LEFT._replace(z=MIN_LEFT_POINT.z),  # back right and down
    8: POINT_MAX_LEFT,  # back right and up
}

# Per-cycle CSV columns written by _main (includes pick-up current for HT)
HEADER = ["Cycle", "Time (H:M:S)", "Pick Up Current (A)",
            "XY Stall", "Y Stall", "Z_L Stall", "Z_R Stall", "Cycle Stalls",
            "Total Stalls","Open-Loop Position", "Encoder Position", "Difference X (mm)",
            "Difference Y (mm)", "Difference Z (mm)"]

# Written once at the top of the CSV with motion/current settings for this run
TEST_DETAILS_HEADER = ["Robot Name", "Test Configuration", "Axis", "Max Speed (mm/s)",
                        "Acceleration (mm^2/s)", "Hold Current (A)", "Run Current (A)",
                        "Max Speed Discontinuity", "Direction Change Speed Discontinuity"]

# HT only exercises left Z (96ch); Z_R column stays 0
AXES: List[Axis] = [Axis.X, Axis.Y, Axis.Z_L]

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

def _axis_label_for_move(start: Point, target: Point) -> str:
    """Classify a bowtie segment from start→target deltas for stall recovery.

    Returns:
        "XY"  — any X change (full home on stall)
        "Y"   — Y-only change
        "Z_L" — Z-only change
        "M"   — no meaningful delta (full home fallback)
    """
    dx = abs(start.x - target.x) > 0.1
    dy = abs(start.y - target.y) > 0.1
    dz = abs(start.z - target.z) > 0.1
    if dx:
        return "XY"
    if dy and not dz:
        return "Y"
    if dz:
        return "Z_L"
    return "M"


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
      - "Z*" / "P"          → home Z_L (HT only uses left mount)
      - anything else       → full home

    If home or the retry move stalls again, fall back to a full home and continue
    so a single recovery failure cannot kill the lifetime run.
    """
    print("--STALL DETECTED--\n")
    print(f"Axis/Axes stalled: {axis_label}\n")
    stall_counts["stall"] += 1

    # Bucket this stall for the per-cycle CSV columns
    if "X" in axis_label:
        stall_counts["xy"] += 1
    elif axis_label == "Y":
        stall_counts["y"] += 1
    else:
        # Z / tip-pick / unclassified — HT script only drives left Z
        stall_counts["z_l"] += 1

    print("------HOMING------\n")
    try:
        if "X" in axis_label:
            await api.home()
        elif axis_label == "Y":
            await api.home([Axis.Y])
        elif "Z" in axis_label or axis_label == "P":
            await api.home([Axis.Z_L])
        else:
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
            Point(target.x, target.y, home_z_pos[Axis.Z_L]),
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
    mount = OT3Mount.LEFT
    # Seed last_point from live position so move 0's stall axis is classified correctly
    cur = await api.current_position_ot3(mount, refresh=True)
    last_point = Point(cur[Axis.X], cur[Axis.Y], cur[Axis.Z_L])
    print(f"bowtie coordinates: {BOWTIE_COORDINATES}\n")
    for key in BOWTIE_COORDINATES.keys():
        print(f"key: {key}\n")
        print(f"BOWTIE_COORDINATES[key]: {BOWTIE_COORDINATES[key]}\n")
        if isinstance(key, int):
            # --- Integer keys: gantry move_to segments ---
            print(f">> Move {key} <<\n")
            target = BOWTIE_COORDINATES[key]
            axis_label = _axis_label_for_move(last_point, target)
            try:
                await api.move_to(mount, target)
                print(f"Moved to {key} successfully\n")
                last_point = target
            except StallOrCollisionDetectedError:
                await _recover_from_stall(api, mount, target, axis_label, stall_counts)
                last_point = target

        else:
            # --- String keys: tip-pick plunge against the calibration block ---
            print(f">> {key} <<\n")
            print("Moving mount down to calibration block...\n")
            try:
                tip_pick_up_pos = await api.current_position_ot3(mount, 
                                    critical_point=CriticalPoint.NOZZLE, refresh=True)
                print(f"tip_pick_up_pos: {tip_pick_up_pos}\n")
                await api.move_to(
                    mount,
                    Point(
                        tip_pick_up_pos[Axis.X],
                        tip_pick_up_pos[Axis.Y],
                        tip_pick_up_pos[Axis.Z_L],
                    ),
                    critical_point = CriticalPoint.NOZZLE
                )
                tip_len = TIP_LENGTH_MM - 10.5
                print(f"tip_len: {tip_len}\n")
                print(f"picking up tip with mount: {mount}\n")
                # Plunge as if picking a tip (loads Z); then clear tip state and rise
                await api.pick_up_tip(mount, tip_len, prep_after=False)
                current_position = await api.current_position_ot3(mount, critical_point=CriticalPoint.TIP, refresh=True)
                print(f"current_position: {current_position}\n")
                api.remove_tip(mount)
                print(f"Moving mount back up to previous position...\n")
                await api.move_to(
                    mount,
                    Point(
                        tip_pick_up_pos[Axis.X],
                        tip_pick_up_pos[Axis.Y],
                        tip_pick_up_pos[Axis.Z_L],
                    ),
                    critical_point = CriticalPoint.NOZZLE,
                )
                current_position = await api.current_position_ot3(mount, refresh=True)
                print(f"current_position: {current_position}\n")
                last_point = Point(
                    tip_pick_up_pos[Axis.X],
                    tip_pick_up_pos[Axis.Y],
                    tip_pick_up_pos[Axis.Z_L],
                )
            except StallOrCollisionDetectedError:
                # Tip-pick stalls previously killed the script; home Z and continue
                print("--STALL DETECTED DURING TIP PICK--\n")
                print(f"Axis/Axes stalled: P on {mount}\n")
                stall_counts["stall"] += 1
                stall_counts["z_l"] += 1
                print("------HOMING------\n")
                try:
                    await api.home([Axis.Z_L])
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
                cur = await api.current_position_ot3(mount, refresh=True)
                last_point = Point(cur[Axis.X], cur[Axis.Y], cur[Axis.Z_L])

            # Snapshot open-loop vs encoder after each tip-pick segment
            open_loop_pos = await api.current_position_ot3(mount, refresh=True)
            final_encoder_pos = await api.encoder_current_position_ot3(
                mount, refresh=True
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

    # This script is for HT (96ch left); the LT dual-pipette check is a safety guard only
    if load == GantryLoad.LOW_THROUGHPUT and (rm is None or lm is None):
        sys.exit("Low throughput test requires two pipettes. Exiting test script...\n")
    else:
        print(f"Left mount: {lm}\n")
        print(f"Right mount (should be empty): {rm}\n")

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

    # Configure 96ch as a single-column partial tip pick (A1–H1)
    await api.update_nozzle_configuration_for_mount(mount = OT3Mount.LEFT,
        back_left_nozzle = 'A1',
        front_right_nozzle = 'H1'
    )
    for cycle in range(cycles):
        print(f"\n========== Cycle {cycle + 1}/{cycles} ==========\n")

        # Every 10th cycle: full current; otherwise partial current stress test
        if (cycle + 1) % 10 == 0:
            print("Setting pick up current to 1.5A\n")
            test_current = DEFAULT_Z_CURRENT
        else:
            print("Setting pick up current to 0.75A\n")
            test_current = PARTIAL_PICK_UP_CURRENT

        helpers_ot3.update_pick_up_current(api, mount, test_current)

        print(f"96ch pick up current: {test_current}A\n")

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
            str(test_current),
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
