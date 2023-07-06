"""OT3 Resonance Finder Test."""
import argparse
import asyncio
import csv
import numpy as np
import time
import os
from typing import Tuple, Dict

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
)

import logging

logging.basicConfig(level=logging.INFO)

BASE_DIRECTORY = "/userfs/data/testing_data/resonance_finder/"
SAVE_NAME = "resonance_finder_"

CYCLES = 1

AXIS_MICROSTEP = {"X": 16, "Y": 16, "L": 16, "R": 16}

# units of mm/ustep
AXIS_FSTEP_CONVERT = {
    "X": (12.7 * np.pi) / (200 * AXIS_MICROSTEP["X"]),
    "Y": (12.7254 * np.pi) / (200 * AXIS_MICROSTEP["Y"]),
    "L": 3 / (200 * AXIS_MICROSTEP["L"]),
    "R": 3 / (200 * AXIS_MICROSTEP["R"]),
}

TEST_LIST: Dict[str, list] = {}

ACCEL = 1000
START_CURRENT = 1.5
TEST_PARAMETERS: Dict[GantryLoad, Dict[str, Dict[str, Dict[str, float]]]] = {
    GantryLoad.LOW_THROUGHPUT: {
        "X": {
            "SPEED": {"MIN": 450, "MAX": 800, "INC": 50},
            "ACCEL": {"MIN": 800, "MAX": 3000, "INC": 400},
            "CURRENT": {"MIN": START_CURRENT, "MAX": 1.5, "INC": 0.5},
        },
        "Y": {
            "SPEED": {"MIN": 450, "MAX": 800, "INC": 100},
            "ACCEL": {"MIN": 800, "MAX": 2200, "INC": 400},
            "CURRENT": {"MIN": START_CURRENT, "MAX": 1.5, "INC": 0.1},
        },
        "L": {
            "SPEED": {"MIN": 40, "MAX": 140, "INC": 30},
            "ACCEL": {"MIN": 100, "MAX": 300, "INC": 100},
            "CURRENT": {"MIN": START_CURRENT, "MAX": 1.5, "INC": 0.1},
        },
        "R": {
            "SPEED": {"MIN": 40, "MAX": 140, "INC": 30},
            "ACCEL": {"MIN": 100, "MAX": 300, "INC": 100},
            "CURRENT": {"MIN": START_CURRENT, "MAX": 1.5, "INC": 0.1},
        },
    },
    GantryLoad.HIGH_THROUGHPUT: {
        "X": {
            "SPEED": {"MIN": 450, "MAX": 800, "INC": 50},
            "ACCEL": {"MIN": 300, "MAX": 1800, "INC": 200},
            "CURRENT": {"MIN": 1.0, "MAX": 1.5, "INC": 0.1},
        },
        "Y": {
            "SPEED": {"MIN": 275, "MAX": 475, "INC": 25},
            "ACCEL": {"MIN": 700, "MAX": 1200, "INC": 50},
            "CURRENT": {"MIN": 1.0, "MAX": 1.5, "INC": 0.1},
        },
        "L": {
            "SPEED": {"MIN": 40, "MAX": 140, "INC": 10},
            "ACCEL": {"MIN": 100, "MAX": 300, "INC": 100},
            "CURRENT": {"MIN": 1.0, "MAX": 1.5, "INC": 0.1},
        },
        "R": {
            "SPEED": {"MIN": 40, "MAX": 140, "INC": 10},
            "ACCEL": {"MIN": 100, "MAX": 300, "INC": 100},
            "CURRENT": {"MIN": 1.0, "MAX": 1.5, "INC": 0.1},
        },
    },
}


SETTINGS = {
    OT3Axis.X: GantryLoadSettings(
        max_speed=500,
        acceleration=ACCEL,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.3,
        run_current=1.5,
    ),
    OT3Axis.Y: GantryLoadSettings(
        max_speed=500,
        acceleration=ACCEL,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.3,
        run_current=1.5,
    ),
    OT3Axis.Z_L: GantryLoadSettings(
        max_speed=35,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=1.5,
        run_current=1.5,
    ),
    OT3Axis.Z_R: GantryLoadSettings(
        max_speed=35,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=1.5,
        run_current=1.5,
    ),
}

MOUNT = OT3Mount.LEFT

AXIS_MAP = {
    "Y": OT3Axis.Y,
    "X": OT3Axis.X,
    "L": OT3Axis.Z_L,
    "R": OT3Axis.Z_R,
    "P": OT3Axis.P_L,
    "O": OT3Axis.P_R,
}

LOAD = GantryLoad.LOW_THROUGHPUT

GANTRY_LOAD_MAP = {"LOW": GantryLoad.LOW_THROUGHPUT, "HIGH": GantryLoad.HIGH_THROUGHPUT}

DELAY = 0

step_x = 500
step_y = 300
xy_home_offset = 5
step_z = 200

MAX_MOVES = {"X": step_x, "Y": step_y, "L": step_z, "R": step_z}

HOME_POINT_MAP = {
    "Y": Point(y=-xy_home_offset),
    "X": Point(x=-xy_home_offset),
    "L": Point(z=0),
    "R": Point(z=0),
}

POINT_MAP = {
    "Y": Point(y=step_y),
    "X": Point(x=step_x),
    "L": Point(z=step_z),
    "R": Point(z=step_z),
}

NEG_POINT_MAP = {
    "Y": Point(y=-step_y),
    "X": Point(x=-step_x),
    "L": Point(z=-step_z),
    "R": Point(z=-step_z),
}


def get_pos_delta(
    final_pos: Dict[OT3Axis, float], inital_pos: Dict[OT3Axis, float]
) -> Dict[OT3Axis, float]:
    """Get delta between positions. Dict must have the same keys."""
    for axis in final_pos:
        final_pos[axis] = final_pos[axis] - inital_pos[axis]

    return final_pos


# compares the encoder distance between two moves to the commanded move distance
# delta_move: output of get_pos_delta from two encoder positons
# point_delta: the point representing the delta for a move_rel command
def check_move_error(delta_move: float, point_delta: Point, axis: str) -> float:
    """Check error between encoder positions."""
    move_error = 0.0

    # compare with point based on axis
    if axis == "X":
        move_error = abs(delta_move) - abs(point_delta[0])
    elif axis == "Y":
        move_error = abs(delta_move) - abs(point_delta[1])
    else:
        move_error = abs(delta_move) - abs(point_delta[2])

    return abs(move_error)


def get_move_correction(actual_move: float, axis: str, direction: int) -> Point:
    """Check error between encoder positions."""
    move_correction = Point()
    if axis == "X":
        move_correction = Point(x=actual_move * direction)
    elif axis == "Y":
        move_correction = Point(y=actual_move * direction)
    else:
        move_correction = Point(z=actual_move * direction)

    return move_correction


def determine_move_distance(
    speed: float, acceleration: float, axis: str, direction: int
) -> Point:
    """Find distance to move based on speed."""
    # find acceleration and braking distance
    ramp_distance = 2 * 0.5 * (speed**2 / acceleration)

    # add some distance to get ~1000 steps at max speed
    # steps * (usteps/step) * mm/ustep
    const_distance = 1000 * AXIS_MICROSTEP[axis] * AXIS_FSTEP_CONVERT[axis]

    # take the lower of the time traveled in 2 second and the 1k step distance
    distance = ramp_distance + min(const_distance, speed * 2)
    print("Distance: " + str(distance))
    print("Ramp Distance: " + str(ramp_distance))
    print("Constant Distance: " + str(min(const_distance, speed)))

    if distance > MAX_MOVES[axis]:
        print("TOO LONG")
        distance = MAX_MOVES[axis]

    point_dist = Point()
    if axis == "Y":
        point_dist = Point(y=distance * direction)
    elif axis == "X":
        point_dist = Point(x=distance * direction)
    elif axis == "L":
        point_dist = Point(z=distance * direction)
    elif axis == "R":
        point_dist = Point(z=distance * direction)
    else:
        point_dist = Point(x=0)

    return point_dist


async def _single_axis_move(
    axis: str, api: OT3API, cycles: int = 1
) -> Tuple[float, int]:
    """Move and check error of single axis."""
    avg_error = []
    if axis == "L":
        MOUNT = OT3Mount.LEFT
    else:
        MOUNT = OT3Mount.RIGHT

    # move away from the limit switch before cycling
    # await api.move_rel(mount=MOUNT, delta=HOME_POINT_MAP[axis], speed=80)
    # await api.move_rel(mount=MOUNT, delta={'Y': Point(y=-100)}, speed=80)

    for c in range(cycles):
        # move away from homed position
        inital_pos = await api.encoder_current_position_ot3(mount=MOUNT)
        cur_speed = SETTINGS[AXIS_MAP[axis]].max_speed

        move_distance = determine_move_distance(
            cur_speed, SETTINGS[AXIS_MAP[axis]].acceleration, axis, -1
        )

        print("Executing Move: " + str(c))
        print(" Speed - " + str(cur_speed))
        fstep = AXIS_FSTEP_CONVERT[axis]
        print(" MicroStep Frequency - " + str(cur_speed / fstep))
        fstep = fstep * 16
        print(" Step Frequency - " + str(cur_speed / fstep))
        print(" Acceleration - " + str(SETTINGS[AXIS_MAP[axis]].acceleration))
        print(" Current - " + str(SETTINGS[AXIS_MAP[axis]].run_current))

        await api.move_rel(mount=MOUNT, delta=move_distance, speed=cur_speed)

        # check if we moved to correct position with encoder
        move_pos = await api.encoder_current_position_ot3(mount=MOUNT)
        print("NEG MOVE - inital_pos: " + str(inital_pos))
        print("NEG MOVE - mov_pos: " + str(move_pos))
        delta_move_pos = get_pos_delta(move_pos, inital_pos)
        # print("delta_move_pos: " + str(delta_move_pos))
        delta_move_axis = delta_move_pos[AXIS_MAP[axis]]
        # print("delta_move_axis: " + str(delta_move_axis))
        # print("move_distance: " + str(move_distance))
        move_error = check_move_error(delta_move_axis, (move_distance * -1), axis)
        # if we had error in the move stop move
        print(axis + " Error: " + str(move_error))
        if move_error >= 0.1:
            # attempt to move closer to the home position quickly
            move_error_correction = get_move_correction(delta_move_axis, axis, -1)
            print()
            print("**************************************")
            print("ERROR IN NEG MOVE, CORRECTING: " + str(move_error_correction))
            print("**************************************")
            input()
            if axis == "X" or axis == "Y":
                await api.move_rel(mount=MOUNT, delta=move_error_correction, speed=80)
            else:
                await api.move_rel(mount=MOUNT, delta=move_error_correction, speed=35)
            if DELAY > 0:
                time.sleep(DELAY)
            await api.home([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
            return (move_error, c + 1)

        # record the current position
        inital_pos = await api.encoder_current_position_ot3(mount=MOUNT)

        move_distance = determine_move_distance(
            cur_speed, SETTINGS[AXIS_MAP[axis]].acceleration, axis, 1
        )

        # move back to near homed position
        await api.move_rel(mount=MOUNT, delta=move_distance, speed=cur_speed)

        final_pos = await api.encoder_current_position_ot3(mount=MOUNT)
        print("POS MOVE - inital_pos: " + str(inital_pos))
        print("POS MOVE - final_pos: " + str(final_pos))
        delta_pos = get_pos_delta(final_pos, inital_pos)
        # print("delta_pos: " + str(delta_pos))
        delta_pos_axis = delta_pos[AXIS_MAP[axis]]
        # print("delta_pos_axis: " + str(delta_pos_axis))
        # print("move_distance: " + str(move_distance))
        move_error = check_move_error(delta_pos_axis, move_distance, axis)
        print(axis + " Error: " + str(move_error))
        if abs(move_error) >= 0.1:
            print()
            print("**************************************")
            print("ERROR IN POS MOVE")
            print("**************************************")
            input()
            if DELAY > 0:
                time.sleep(DELAY)
            await api.home([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
            return (move_error, c + 1)
        else:
            avg_error.append(move_error)

        # home every 50 cycles in case we have drifted
        if (c + 1) % 50 == 0:
            await api.home([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
            # move away from the limit switch before cycling
            await api.move_rel(mount=MOUNT, delta=HOME_POINT_MAP[axis], speed=80)

    if DELAY > 0:
        time.sleep(DELAY)

    return (sum(avg_error) / len(avg_error), c + 1)


async def match_z_settings(
    axis: str, speed: float, accel: float, current: float
) -> bool:
    """Ensure L and R don't overwrite eachother."""
    if axis == "L" or axis == "R":
        SETTINGS[AXIS_MAP["L"]].acceleration = accel
        SETTINGS[AXIS_MAP["L"]].max_speed = speed
        SETTINGS[AXIS_MAP["L"]].run_current = current
        SETTINGS[AXIS_MAP["R"]].acceleration = accel
        SETTINGS[AXIS_MAP["R"]].max_speed = speed
        SETTINGS[AXIS_MAP["R"]].run_current = current

    return True


async def _main(is_simulating: bool) -> None:
    api = await build_async_ot3_hardware_api(
        is_simulating=is_simulating, stall_detection_enable=False
    )
    # api = await build_async_ot3_hardware_api(is_simulating=is_simulating)
    print("HOMING")
    await api.home([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    try:
        # check if directory exists, make if doesn't
        if not os.path.exists(BASE_DIRECTORY):
            os.makedirs(BASE_DIRECTORY)

        with open(BASE_DIRECTORY + SAVE_NAME + AXIS + ".csv", mode="w") as csv_file:
            fieldnames = ["axis", "speed", "acceleration", "current", "error"]
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            writer.writeheader()

            test_axis_list = list(AXIS)
            for test_axis in test_axis_list:

                axis_parameters = TEST_LIST[test_axis]
                print("Testing Axis: " + test_axis)
                for p in axis_parameters:
                    print("Testing Parameters:")
                    print(p)
                    SETTINGS[AXIS_MAP[test_axis]].run_current = p["CURRENT"]
                    SETTINGS[AXIS_MAP[test_axis]].max_speed = p["SPEED"]
                    SETTINGS[AXIS_MAP[test_axis]].acceleration = ACCEL

                    # update the robot settings to use test speed/accel
                    await match_z_settings(
                        test_axis,
                        SETTINGS[AXIS_MAP[test_axis]].max_speed,
                        SETTINGS[AXIS_MAP[test_axis]].acceleration,
                        SETTINGS[AXIS_MAP[test_axis]].run_current,
                    )

                    await set_gantry_load_per_axis_settings_ot3(
                        api, SETTINGS, load=LOAD
                    )

                    # attempt to cycle with the test settings
                    # await api.home([AXIS_MAP[test_axis]])
                    print("HOMING")
                    await api.home([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
                    move_output_tuple = await _single_axis_move(
                        test_axis, api, cycles=CYCLES
                    )

                    run_avg_error = move_output_tuple[0]

                    # record results of cycles to raw csv
                    print("Cycles complete")
                    print("Speed: " + str(p["SPEED"]))
                    print(
                        "Acceleration: "
                        + str(SETTINGS[AXIS_MAP[test_axis]].acceleration)
                    )
                    print("Current: " + str(p["CURRENT"]))
                    print("Error: " + str(run_avg_error))

    except KeyboardInterrupt:
        await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    finally:
        # await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        await api.clean_up()


def parameter_range(test_load: GantryLoad, test_axis: str, p_type: str) -> np.ndarray:
    """Makes a range of a parameter based on start, stop, step."""
    start = TEST_PARAMETERS[test_load][test_axis][p_type]["MIN"]
    step = TEST_PARAMETERS[test_load][test_axis][p_type]["INC"]
    # add step to stop to make range inclusive
    stop = TEST_PARAMETERS[test_load][test_axis][p_type]["MAX"] + step
    return np.arange(start, stop, step)


START_FREQ = 10
FREQ_INC = 50


def speed_range_from_freq(test_axis: str) -> np.ndarray:
    """Find a range of speeds from a step frequency."""
    freq_range = np.arange(
        START_FREQ * AXIS_MICROSTEP[test_axis],
        50000 * AXIS_MICROSTEP[test_axis],
        FREQ_INC * AXIS_MICROSTEP[test_axis],
    )

    # ustep/s * mm/ustep
    return freq_range * AXIS_FSTEP_CONVERT[test_axis]


# dictionary containing lists of all speed/accel combinations to for each axis
def make_test_list(test_axis: list, test_load: GantryLoad) -> Dict[str, list]:
    """Make test list dictionary."""
    test_axis = list(test_axis)  # convert axis string from arg to list
    complete_test_list = {}
    # make dictionary with axes to test as keys
    for axis_t in test_axis:
        axis_test_list = []
        for current_t in parameter_range(test_load, axis_t, "CURRENT"):
            for speed_t in speed_range_from_freq(axis_t):
                axis_test_list.append({"CURRENT": current_t, "SPEED": speed_t})

        complete_test_list[axis_t] = axis_test_list

    return complete_test_list


def update_test_parameters(ptype: str, psub: str, value: float) -> None:
    """Update a test parameter with a value."""
    for load in TEST_PARAMETERS:
        for axis in ["X", "Y", "L", "R"]:
            TEST_PARAMETERS[load][axis][ptype][psub] = value


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--axis", type=str, default="Y")
    parser.add_argument("--cycles", type=int, default=CYCLES)
    parser.add_argument("--load", type=str, default="LOW")
    parser.add_argument("--delay", type=int, default=0)
    parser.add_argument("--start", type=int, default=START_FREQ)
    parser.add_argument("--inc", type=int, default=FREQ_INC)
    parser.add_argument("--accel", type=int, default=ACCEL)
    parser.add_argument("--current", type=float, default=START_CURRENT)

    args = parser.parse_args()
    CYCLES = args.cycles

    AXIS = args.axis
    LOAD = GANTRY_LOAD_MAP[args.load]
    DELAY = args.delay
    START_FREQ = args.start
    FREQ_INC = args.inc
    ACCEL = args.accel
    START_CURRENT = args.current
    update_test_parameters("CURRENT", "MIN", START_CURRENT)
    TEST_LIST = make_test_list(AXIS, LOAD)

    asyncio.run(_main(args.simulate))
