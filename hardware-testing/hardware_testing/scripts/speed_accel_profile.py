"""OT3 Speed and Acceleration and Current Profile Test."""
import argparse
import asyncio
import csv
import numpy as np
import time
import os
from typing import Tuple, Dict

from opentrons.hardware_control.ot3api import OT3API
from opentrons.hardware_control.errors import MustHomeError

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
)

import logging

logging.basicConfig(level=logging.INFO)

BASE_DIRECTORY = "/userfs/data/testing_data/speed_accel_profile/"
SAVE_NAME = "speed_test_output_"

CYCLES = 1

TEST_LIST: Dict[str, list] = {}

TEST_PARAMETERS: Dict[GantryLoad, Dict[str, Dict[str, Dict[str, float]]]] = {
    GantryLoad.LOW_THROUGHPUT: {
        "X": {
            "SPEED": {"MIN": 300, "MAX": 500, "INC": 100},
            "ACCEL": {"MIN": 700, "MAX": 900, "INC": 100},
            "CURRENT": {"MIN": 1, "MAX": 1.5, "INC": 0.25},
        },
        "Y": {
            "SPEED": {"MIN": 275, "MAX": 375, "INC": 75},
            "ACCEL": {"MIN": 500, "MAX": 700, "INC": 100},
            "CURRENT": {"MIN": 1, "MAX": 1.5, "INC": 0.25},
        },
        "L": {
            "SPEED": {"MIN": 40, "MAX": 140, "INC": 30},
            "ACCEL": {"MIN": 100, "MAX": 300, "INC": 100},
            "CURRENT": {"MIN": 1, "MAX": 1.5, "INC": 0.25},
        },
        "R": {
            "SPEED": {"MIN": 40, "MAX": 140, "INC": 30},
            "ACCEL": {"MIN": 100, "MAX": 300, "INC": 100},
            "CURRENT": {"MIN": 1, "MAX": 1.5, "INC": 0.25},
        },
    },
    GantryLoad.HIGH_THROUGHPUT: {
        "X": {
            "SPEED": {"MIN": 275, "MAX": 475, "INC": 100},
            "ACCEL": {"MIN": 700, "MAX": 900, "INC": 100},
            "CURRENT": {"MIN": 1, "MAX": 1.5, "INC": 0.25},
        },
        "Y": {
            "SPEED": {"MIN": 325, "MAX": 425, "INC": 100},
            "ACCEL": {"MIN": 500, "MAX": 600, "INC": 100},
            "CURRENT": {"MIN": 1.4, "MAX": 1.4, "INC": 0},
        },
        "L": {
            "SPEED": {"MIN": 40, "MAX": 140, "INC": 30},
            "ACCEL": {"MIN": 100, "MAX": 300, "INC": 100},
            "CURRENT": {"MIN": 1, "MAX": 1.5, "INC": 0.25},
        },
        "R": {
            "SPEED": {"MIN": 40, "MAX": 140, "INC": 30},
            "ACCEL": {"MIN": 100, "MAX": 300, "INC": 100},
            "CURRENT": {"MIN": 1, "MAX": 1.5, "INC": 0.25},
        },
    },
}

START_CURRENT = 1.0

SETTINGS = {
    Axis.X: GantryLoadSettings(
        max_speed=500,
        acceleration=1000,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.3,
        run_current=START_CURRENT,
    ),
    Axis.Y: GantryLoadSettings(
        max_speed=500,
        acceleration=1000,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.3,
        run_current=START_CURRENT,
    ),
    Axis.Z_L: GantryLoadSettings(
        max_speed=35,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=1.5,
        run_current=START_CURRENT,
    ),
    Axis.Z_R: GantryLoadSettings(
        max_speed=35,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=1.5,
        run_current=START_CURRENT,
    ),
}

MOUNT = OT3Mount.LEFT

AXIS_MAP = {
    "Y": Axis.Y,
    "X": Axis.X,
    "L": Axis.Z_L,
    "R": Axis.Z_R,
    "P": Axis.P_L,
    "O": Axis.P_R,
}

LOAD = GantryLoad.LOW_THROUGHPUT

GANTRY_LOAD_MAP = {"LOW": GantryLoad.LOW_THROUGHPUT, "HIGH": GantryLoad.HIGH_THROUGHPUT}

DELAY = 0

step_x = 500
step_y = 300
xy_home_offset = 5
step_z = 200
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
    final_pos: Dict[Axis, float], inital_pos: Dict[Axis, float]
) -> Dict[Axis, float]:
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
    await api.move_rel(mount=MOUNT, delta=HOME_POINT_MAP[axis], speed=80)

    for c in range(cycles):
        # move away from homed position
        inital_pos = await api.encoder_current_position_ot3(mount=MOUNT)
        cur_speed = SETTINGS[AXIS_MAP[axis]].max_speed

        print("Executing Move: " + str(c))
        print(" Current - " + str(SETTINGS[AXIS_MAP[axis]].run_current))
        print(" Speed - " + str(cur_speed))
        print(" Acceleration - " + str(SETTINGS[AXIS_MAP[axis]].acceleration))

        await api.move_rel(mount=MOUNT, delta=NEG_POINT_MAP[axis], speed=cur_speed)

        # check if we moved to correct position with encoder
        move_pos = await api.encoder_current_position_ot3(mount=MOUNT)
        print("inital_pos: " + str(inital_pos))
        print("mov_pos: " + str(move_pos))
        delta_move_pos = get_pos_delta(move_pos, inital_pos)
        delta_move_axis = delta_move_pos[AXIS_MAP[axis]]
        move_error = check_move_error(delta_move_axis, NEG_POINT_MAP[axis], axis)
        # if we had error in the move stop move
        print(axis + " Error: " + str(move_error))
        if move_error >= 0.1:
            # attempt to move closer to the home position quickly
            move_error_correction = get_move_correction(delta_move_axis, axis, -1)
            print()
            print("**************************************")
            print("ERROR IN NEG MOVE, CORRECTING: " + str(move_error_correction))
            print("**************************************")
            print()
            try:
                if axis == "X" or axis == "Y":
                    await api.move_rel(
                        mount=MOUNT, delta=move_error_correction, speed=80
                    )
                else:
                    await api.move_rel(
                        mount=MOUNT, delta=move_error_correction, speed=35
                    )
            except MustHomeError:
                await api.home([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])

            if DELAY > 0:
                time.sleep(DELAY)
            await api.home([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
            return (move_error, c)

        # record the current position
        inital_pos = await api.encoder_current_position_ot3(mount=MOUNT)

        # move back to near homed position
        await api.move_rel(mount=MOUNT, delta=POINT_MAP[axis], speed=cur_speed)

        final_pos = await api.encoder_current_position_ot3(mount=MOUNT)
        delta_pos = get_pos_delta(final_pos, inital_pos)
        delta_pos_axis = delta_pos[AXIS_MAP[axis]]
        move_error = check_move_error(delta_pos_axis, POINT_MAP[axis], axis)
        print(axis + " Error: " + str(move_error))
        if abs(move_error) >= 0.1:
            print()
            print("**************************************")
            print("ERROR IN POS MOVE")
            print("**************************************")
            print()
            if DELAY > 0:
                time.sleep(DELAY)
            await api.home([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
            return (move_error, c)
        else:
            avg_error.append(move_error)

        # home every 50 cycles in case we have drifted
        if (c + 1) % 50 == 0:
            await api.home([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
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
    """Main run function."""
    api = await build_async_ot3_hardware_api(
        is_simulating=is_simulating, stall_detection_enable=False
    )
    print("HOMING")
    await api.home([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
    try:
        # #run the test while recording raw results
        table_results = {}

        # check if directory exists, make if doesn't
        if not os.path.exists(BASE_DIRECTORY):
            os.makedirs(BASE_DIRECTORY)

        with open(BASE_DIRECTORY + SAVE_NAME + AXIS + ".csv", mode="w") as csv_file:
            fieldnames = ["axis", "current", "speed", "acceleration", "error", "cycles"]
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            writer.writeheader()

            test_axis_list = list(AXIS)
            for test_axis in test_axis_list:
                c_len = len(parameter_range(LOAD, test_axis, "CURRENT"))
                s_len = len(parameter_range(LOAD, test_axis, "SPEED"))
                a_len = len(parameter_range(LOAD, test_axis, "ACCEL"))
                table_results[test_axis] = np.zeros((c_len, s_len, a_len))

                axis_parameters = TEST_LIST[test_axis]
                print("Testing Axis: " + test_axis)
                for p in axis_parameters:
                    print("Testing Parameters:")
                    print(p)
                    SETTINGS[AXIS_MAP[test_axis]].acceleration = p["ACCEL"]
                    SETTINGS[AXIS_MAP[test_axis]].max_speed = p["SPEED"]
                    SETTINGS[AXIS_MAP[test_axis]].run_current = p["CURRENT"]

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
                    await api.home([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
                    move_output_tuple = await _single_axis_move(
                        test_axis, api, cycles=CYCLES
                    )
                    run_avg_error = move_output_tuple[0]
                    cycles_completed = move_output_tuple[1]

                    # #record results to dictionary for neat formatting later
                    # if p['SPEED'] in table_results[test_axis].keys():
                    #     table_results[test_axis][p['SPEED']][p['ACCEL']] = cycles_completed
                    # else:
                    #     table_results[test_axis][p['SPEED']] = {}
                    #     table_results[test_axis][p['SPEED']][p['ACCEL']] = cycles_completed
                    c_i = table_results_key[test_axis][p["CURRENT"]]
                    s_i = table_results_key[test_axis][p["SPEED"]]
                    a_i = table_results_key[test_axis][p["ACCEL"]]
                    table_results[test_axis][c_i][s_i][a_i] = cycles_completed

                    # record results of cycles to raw csv
                    print("Cycles complete")
                    print("Current: " + str(p["CURRENT"]))
                    print("Speed: " + str(p["SPEED"]))
                    print("Acceleration: " + str(p["ACCEL"]))
                    print("Error: " + str(run_avg_error))
                    writer.writerow(
                        {
                            "axis": test_axis,
                            "current": p["CURRENT"],
                            "speed": p["SPEED"],
                            "acceleration": p["ACCEL"],
                            "error": run_avg_error,
                            "cycles": cycles_completed,
                        }
                    )

        # create tableized output csv for neat presentation
        # print(table_results)
        test_axis_list = list(AXIS)
        for test_axis in test_axis_list:
            with open(
                BASE_DIRECTORY + SAVE_NAME + test_axis + "_table.csv", mode="w"
            ) as csv_file:
                fieldnames = ["Current", "Speed"] + [
                    *parameter_range(LOAD, test_axis, "ACCEL")
                ]
                # print(fieldnames)
                writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
                writer.writerow({"Current": LOAD})
                writer.writerow({"Current": test_axis})
                writer.writerow({"Speed": "Acceleration"})
                writer.writeheader()
                for c in parameter_range(LOAD, test_axis, "CURRENT"):
                    for s in parameter_range(LOAD, test_axis, "SPEED"):
                        td = {"Current": c, "Speed": s}
                        c_i = table_results_key[test_axis][c]
                        s_i = table_results_key[test_axis][s]
                        for a in parameter_range(LOAD, test_axis, "ACCEL"):
                            a_i = table_results_key[test_axis][a]
                            val = table_results[test_axis][c_i][s_i][a_i]
                            td.update({a: val})

                        writer.writerow(td)
                # print(table_results[test_axis])

    except KeyboardInterrupt:
        await api.disengage_axes([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
    finally:
        # await api.disengage_axes([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
        await api.clean_up()


def parameter_range(test_load: GantryLoad, test_axis: str, p_type: str) -> np.ndarray:
    """Makes a range of a parameter based on start, stop, step."""
    start = TEST_PARAMETERS[test_load][test_axis][p_type]["MIN"]
    step = TEST_PARAMETERS[test_load][test_axis][p_type]["INC"]

    if step == 0:
        return np.array([start])
    else:
        # add step to stop to make range inclusive
        stop = TEST_PARAMETERS[test_load][test_axis][p_type]["MAX"] + step
        return np.arange(start, stop, step)


table_results_key: Dict[str, Dict[float, int]] = {}


# dictionary containing lists of all speed/accel/current combinations to for each axis
def make_test_list(test_axis: list, test_load: GantryLoad) -> Dict[str, list]:
    """Make test list dictionary."""
    test_axis = list(test_axis)
    complete_test_list: Dict[str, list] = {}
    for axis_t in test_axis:
        axis_test_list = []
        table_results_key[axis_t] = {}
        c_i = 0
        s_i = 0
        a_i = 0
        for current_t in parameter_range(test_load, axis_t, "CURRENT"):
            table_results_key[axis_t][current_t] = c_i
            c_i = c_i + 1
            s_i = 0
            for speed_t in parameter_range(test_load, axis_t, "SPEED"):
                table_results_key[axis_t][speed_t] = s_i
                s_i = s_i + 1
                a_i = 0
                for accel_t in parameter_range(test_load, axis_t, "ACCEL"):
                    table_results_key[axis_t][accel_t] = a_i
                    a_i = a_i + 1
                    axis_test_list.append(
                        {"CURRENT": current_t, "SPEED": speed_t, "ACCEL": accel_t}
                    )

        complete_test_list[axis_t] = axis_test_list

    return complete_test_list


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--axis", type=str, default="Y")
    parser.add_argument("--cycles", type=int, default=CYCLES)
    parser.add_argument("--load", type=str, default="LOW")
    parser.add_argument("--delay", type=int, default=0)
    parser.add_argument("--current", type=float, default=START_CURRENT)

    args = parser.parse_args()
    CYCLES = args.cycles

    AXIS = args.axis
    LOAD = GANTRY_LOAD_MAP[args.load]
    DELAY = args.delay
    START_CURRENT = args.current
    TEST_LIST = make_test_list(AXIS, LOAD)

    asyncio.run(_main(args.simulate))
