"""OT3 Speed and Acceleration and Current Profile Test."""
import argparse
import asyncio
import csv
import numpy as np
import time
import os
from typing import Tuple, Dict

from opentrons.hardware_control.ot3api import OT3API
from opentrons_shared_data.errors.exceptions import PositionUnknownError

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
)

from opentrons_hardware.firmware_bindings.constants import NodeId

import logging

logging.basicConfig(level=logging.INFO)

BASE_DIRECTORY = "/userfs/data/testing_data/speed_accel_profile/"
SAVE_NAME = "speed_test_output_"

CYCLES = 1
ENCODER_DELAY = 0.1 #seconds
ENCODER_REFRESH = True
ERROR_THRESHOLD = 0.2 #mm

TEST_LIST: Dict[str, list] = {}

FAKE_STATUS = {NodeId.gantry_x: MotorStatus(motor_ok=True, encoder_ok=True),
                NodeId.gantry_y: MotorStatus(motor_ok=True, encoder_ok=True),
                NodeId.head_l: MotorStatus(motor_ok=True, encoder_ok=True),
                NodeId.head_r: MotorStatus(motor_ok=True, encoder_ok=True)}

FAKE_GRIPPER = {NodeId.gripper_g: MotorStatus(motor_ok=True, encoder_ok=True)}

TEST_PARAMETERS: Dict[GantryLoad, Dict[str, Dict[str, Dict[str, float]]]] = {
    GantryLoad.LOW_THROUGHPUT: {
        "X": {
            "SPEED": {"MIN": 250, "MAX": 450, "INC": 100},
            "ACCEL": {"MIN": 700, "MAX": 900, "INC": 100},
            "CURRENT": {"MIN": 1, "MAX": 1.5, "INC": 0.25}
        },
        "Y": {
            "SPEED": {"MIN": 225, "MAX": 375, "INC": 75},
            "ACCEL": {"MIN": 500, "MAX": 700, "INC": 100},
            "CURRENT": {"MIN": 1, "MAX": 1.4, "INC": 0.2}
        },
        "L": {
            "SPEED": {"MIN": 80, "MAX": 120, "INC": 20},
            "ACCEL": {"MIN": 100, "MAX": 200, "INC": 50},
            "CURRENT": {"MIN": 0.75, "MAX": 1.25, "INC": 0.25}
        },
        "R": {
            "SPEED": {"MIN": 80, "MAX": 120, "INC": 20},
            "ACCEL": {"MIN": 100, "MAX": 200, "INC": 50},
            "CURRENT": {"MIN": 0.75, "MAX": 1.25, "INC": 0.25}
        },
        "G": {
            "SPEED": {"MIN": 50, "MAX": 100, "INC": 10},
            "ACCEL": {"MIN": 150, "MAX": 200, "INC": 0},
            "CURRENT": {"MIN": 0.6, "MAX": 1, "INC": 0}
        }
    },
    GantryLoad.HIGH_THROUGHPUT: {
        "X": {
            "SPEED": {"MIN": 275, "MAX": 425, "INC": 75},
            "ACCEL": {"MIN": 600, "MAX": 800, "INC": 100},
            "CURRENT": {"MIN": 1, "MAX": 1.5, "INC": 0.25}
        },
        "Y": {
            "SPEED": {"MIN": 200, "MAX": 350, "INC": 75},
            "ACCEL": {"MIN": 500, "MAX": 700, "INC": 100},
            "CURRENT": {"MIN": 1.3, "MAX": 1.5, "INC": 0.1}
        },
        "L": {
            "SPEED": {"MIN": 25, "MAX": 45, "INC": 10},
            "ACCEL": {"MIN": 120, "MAX": 180, "INC": 30},
            "CURRENT": {"MIN": 0.8, "MAX": 1.4, "INC": 0.2}
        },
        "R": {
            "SPEED": {"MIN": 25, "MAX": 45, "INC": 10},
            "ACCEL": {"MIN": 120, "MAX": 180, "INC": 30},
            "CURRENT": {"MIN": 1.3, "MAX": 1.5, "INC": 0.1}
        },
        "G": {
            "SPEED": {"MIN": 10, "MAX": 50, "INC": 10},
            "ACCEL": {"MIN": 50, "MAX": 200, "INC": 50},
            "CURRENT": {"MIN": 0.3, "MAX": 1, "INC": 0.1}
        }
    },
}

START_CURRENT = 1.0
HIGH_CURRENT = 1.5
MAX_CURRENT = 1.5

SETTINGS = {
    Axis.X: GantryLoadSettings(
        max_speed=500,
        acceleration=1000,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.5,
        run_current=START_CURRENT,
    ),
    Axis.Y: GantryLoadSettings(
        max_speed=500,
        acceleration=1000,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.5,
        run_current=START_CURRENT,
    ),
    Axis.Z_L: GantryLoadSettings(
        max_speed=35,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=0.8,
        run_current=START_CURRENT,
    ),
    Axis.Z_R: GantryLoadSettings(
        max_speed=35,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=0.8,
        run_current=START_CURRENT,
    ),
    Axis.Z_G: GantryLoadSettings(
        max_speed=50,
        acceleration=150,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=0.2,
        run_current=0.67,
    )
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

MOUNT_MAP = {
    "Y": OT3Mount.LEFT,
    "X": OT3Mount.LEFT,
    "L": OT3Mount.LEFT,
    "R": OT3Mount.RIGHT,
    "G": OT3Mount.GRIPPER,
    "P": OT3Mount.LEFT,
    "O": OT3Mount.RIGHT
}

DELAY = 0

step_x = 500
step_y = 300
xy_home_offset = 7
step_z = 200
step_g = 150
HOME_POINT_MAP = {
    "Y": Point(y=-xy_home_offset),
    "X": Point(x=-xy_home_offset),
    "L": Point(z=0),
    "R": Point(z=0),
    "G": Point(z=0)
}

POINT_MAP = {
    "Y": Point(y=step_y),
    "X": Point(x=step_x),
    "L": Point(z=step_z),
    "R": Point(z=step_z),
    "G": Point(z=step_g)
}

NEG_POINT_MAP = {
    "Y": Point(y=-step_y),
    "X": Point(x=-step_x),
    "L": Point(z=-step_z),
    "R": Point(z=-step_z),
    "G": Point(z=-step_g)
}

#find real value for G
ENCODER_RESOLUTION = {
    "Y": 0.0399,
    "X": 0.0399,
    "L": 0.00293,
    "R": 0.00293,
    "G": 0.05
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
        #move_error = abs(delta_move) - abs(point_delta[0])
        move_error = delta_move - point_delta[0]
        #print("Actual Move Error: " + str(delta_move - point_delta[0]))
    elif axis == "Y":
        #move_error = abs(delta_move) - abs(point_delta[1])
        move_error = delta_move - point_delta[1]
        #print("Actual Move Error: " + str(delta_move - point_delta[1]))
    else:
        #move_error = abs(delta_move) - abs(point_delta[2])
        move_error = delta_move - point_delta[2]

    return move_error


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

async def get_stable_encoder(axis: str, api: OT3API, MOUNT: OT3Mount) -> Dict[Axis, float]:
    """Keep reading the encoder until it's value is stable"""
    # Keep reading until we have 3 stable reads
    stable_value_count = 0
    while stable_value_count < 2:
        read0 = await api.encoder_current_position_ot3(mount=MOUNT,
                                                            refresh=True)
        read1 = await api.encoder_current_position_ot3(mount=MOUNT,
                                                            refresh=True)

        jitter = get_pos_delta(read1, read0)[AXIS_MAP[axis]]
        #check if difference in subsequent reads is less than an encoder tic
        if jitter < ENCODER_RESOLUTION[axis]:
            stable_value_count = stable_value_count + 1

    # Return the stable reading
    return await api.encoder_current_position_ot3(mount=MOUNT,
                                                        refresh=True)


async def move_and_check(axis: str, api: OT3API, MOUNT: OT3Mount,
                         move_dist: Point, move_speed: int) -> list:
    """Move the Gantry a set distance, check the movement positional error"""

    inital_pos = await get_stable_encoder(axis, api, MOUNT)
    await api.move_rel(mount=MOUNT, delta=move_dist, speed=move_speed)

    final_pos = await get_stable_encoder(axis, api, MOUNT)

    print("inital_pos: " + str(inital_pos))
    print("final_pos: " + str(final_pos))

    delta_move_pos = get_pos_delta(final_pos, inital_pos)
    delta_move_axis = delta_move_pos[AXIS_MAP[axis]]
    move_error = check_move_error(delta_move_axis, move_dist, axis)

    print(axis + " Error: " + str(move_error))

    return [move_error, delta_move_axis]


async def _single_axis_move(
    axis: str, api: OT3API, cycles: int = 1
) -> list:
    """Move and check error of single axis."""
    avg_error = []
    neg_errors = []
    pos_errors = []
    MOUNT = MOUNT_MAP[axis]

    # move away from the limit switch before cycling
    await api.move_rel(mount=MOUNT, delta=HOME_POINT_MAP[axis], speed=80)
    #time.sleep(ENCODER_DELAY*2) #let postition settle

    # if axis == "G":
    #     await api.home_gripper_jaw()
    #     api._backend._motor_status.update(FAKE_GRIPPER)
    for c in range(cycles):
        # print("before encoder check")
        # print("api._encoder_position: "+str(api._encoder_position))
        # print("Axis.by_mount(MOUNT): "+str(Axis.by_mount(MOUNT)))
        # if api._encoder_position:
        #     print("api._encoder_position evaluates True")
        # position_axes = [Axis.X, Axis.Y, Axis.by_mount(MOUNT)]
        # check = str(api._backend.check_encoder_status(position_axes))
        # print("api._backend.check_encoder_status(position_axes): "+check)
        # print(api._backend.check_encoder_status([Axis.X, Axis.Y, Axis.G]))
        # print("valid motor check: " + str(api._encoder_position and check))
        # valid_motor = api._encoder_position and api._backend.check_encoder_status(
        #     position_axes
        # )
        # print("valid_motor: "+str(valid_motor))
        # if not valid_motor:
        #     print("must home error should be raised")
        # else:
        #     print("must home error should NOT be raised")


        # inital_pos = await api.encoder_current_position_ot3(mount=MOUNT,
        #                                                     refresh=ENCODER_REFRESH)
        cur_speed = SETTINGS[AXIS_MAP[axis]].max_speed

        print("Executing Move: " + str(c))
        print(" Current - " + str(SETTINGS[AXIS_MAP[axis]].run_current))
        print(" Speed - " + str(cur_speed))
        print(" Acceleration - " + str(SETTINGS[AXIS_MAP[axis]].acceleration))

        neg_move = await move_and_check(axis, api, MOUNT, NEG_POINT_MAP[axis], cur_speed)
        neg_move_error = neg_move[0]
        neg_move_dist = neg_move[1]

        avg_error.append(abs(neg_move_error))
        neg_errors.append(neg_move_error)

        if abs(neg_move_error) >= ERROR_THRESHOLD:
            # attempt to move closer to the home position quickly
            move_error_correction = get_move_correction(neg_move_dist, axis, -1)
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
            except PositionUnknownError:
                await api.home([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])

            if DELAY > 0:
                time.sleep(DELAY)
            if axis == "G":
                await api.home([Axis.Z_G])
            if not BENCH:
                await api.home([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])

            output_list = [sum(avg_error) / len(avg_error), c, max(avg_error), neg_errors, pos_errors]
            return output_list

        pos_move = await move_and_check(axis, api, MOUNT, POINT_MAP[axis], cur_speed)
        pos_move_error = pos_move[0]
        pos_move_dist = pos_move[1]

        avg_error.append(abs(pos_move_error))
        pos_errors.append(pos_move_error)

        if abs(pos_move_error) >= ERROR_THRESHOLD:
            print()
            print("**************************************")
            print("ERROR IN POS MOVE")
            print("**************************************")
            print()
            if DELAY > 0:
                time.sleep(DELAY)
            if axis == "G":
                await api.home([Axis.Z_G])
            if not BENCH:
                await api.home([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
            output_list = [sum(avg_error) / len(avg_error), c, max(avg_error), neg_errors, pos_errors]
            return output_list

        # home every 50 cycles in case we have drifted
        if (c + 1) % 50 == 0:
            if axis == "G":
                await api.home([Axis.Z_G])
            if not BENCH:
                await api.home([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
            # move away from the limit switch before cycling
            await api.move_rel(mount=MOUNT, delta=HOME_POINT_MAP[axis], speed=80)
            # time.sleep(ENCODER_DELAY*2) #let postition settle

    if DELAY > 0:
        time.sleep(DELAY)

    output_list = [sum(avg_error) / len(avg_error), c + 1, max(avg_error), neg_errors, pos_errors]
    return output_list


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

def save_table(test_axis_list: list, file_suffix: str, results: np.ndarray, data_round: int) -> None:
    """Saves output to a table format."""
    for test_axis in test_axis_list:
        with open(
            BASE_DIRECTORY + SAVE_NAME + test_axis + "_" + file_suffix + ".csv", mode="w"
        ) as csv_file:
            fieldnames = ["Current", "Speed"] + [
                *parameter_range(LOAD, test_axis, "ACCEL")
            ]
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            writer.writerow({"Current": TEST_NAME})
            writer.writerow({"Current": LOAD})
            writer.writerow({"Current": test_axis})
            writer.writerow({"Speed": "Acceleration"})
            writer.writeheader()
            for c in parameter_range(LOAD, test_axis, "CURRENT"):
                for s in parameter_range(LOAD, test_axis, "SPEED"):
                    td = {"Current": c, "Speed": s}
                    c_i = round(TABLE_RESULTS_KEY[test_axis][c], 3)
                    s_i = TABLE_RESULTS_KEY[test_axis][s]
                    for a in parameter_range(LOAD, test_axis, "ACCEL"):
                        a_i = TABLE_RESULTS_KEY[test_axis][a]
                        val = round(results[test_axis][c_i][s_i][a_i], data_round)
                        td.update({a: val})

                    writer.writerow(td)

async def _main(is_simulating: bool) -> None:
    """Main run function."""
    if "G" in list(AXIS):
        print("Building API with GRIPPER")
        api = await build_async_ot3_hardware_api(
            is_simulating=is_simulating,
            stall_detection_enable=False,
            gripper="GRPV1120230323A01"
        )
        await api.reset()
    else:
        print("Building API")
        api = await build_async_ot3_hardware_api(
            is_simulating=is_simulating, stall_detection_enable=False
        )

    #do not home all axes if on bench
    if not BENCH:
        print("HOMING")
        await api.home([Axis.X, Axis.Y, Axis.Z_L, Axis.Z_R])
    else:
        api._backend._motor_status.update(FAKE_STATUS)

    try:
        # #run the test while recording raw results
        results_cycles = {}
        results_error = {}
        results_max_error = {}

        # check if directory exists, make if doesn't
        if not os.path.exists(BASE_DIRECTORY):
            os.makedirs(BASE_DIRECTORY)

        test_axis_list = list(AXIS)
        with open(BASE_DIRECTORY + SAVE_NAME + AXIS + ".csv", mode="w") as csv_file:
            fieldnames = ["test_name", "axis", "current", "speed",
                          "acceleration", "neg_error", "pos_error"]
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            writer.writeheader()

            for test_axis in test_axis_list:
                c_len = len(parameter_range(LOAD, test_axis, "CURRENT"))
                s_len = len(parameter_range(LOAD, test_axis, "SPEED"))
                a_len = len(parameter_range(LOAD, test_axis, "ACCEL"))
                results_cycles[test_axis] = np.zeros((c_len, s_len, a_len))
                results_error[test_axis] = np.zeros((c_len, s_len, a_len))
                results_max_error[test_axis] = np.zeros((c_len, s_len, a_len))

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
                    print("HOMING: " + str(test_axis))
                    await api.home(axes = [AXIS_MAP[test_axis]])
                    if BENCH:
                        api._backend._motor_status.update(FAKE_STATUS)
                        print(api._backend._motor_status)

                    move_output_list = await _single_axis_move(
                        test_axis, api, cycles=CYCLES
                    )
                    run_avg_error = move_output_list[0]
                    cycles_completed = move_output_list[1]
                    max_error = move_output_list[2]
                    neg_errors = move_output_list[3]
                    pos_errors = move_output_list[4]

                    # #record results to dictionary for neat formatting later
                    c_i = TABLE_RESULTS_KEY[test_axis][p["CURRENT"]]
                    s_i = TABLE_RESULTS_KEY[test_axis][p["SPEED"]]
                    a_i = TABLE_RESULTS_KEY[test_axis][p["ACCEL"]]
                    results_cycles[test_axis][c_i][s_i][a_i] = cycles_completed
                    results_error[test_axis][c_i][s_i][a_i] = run_avg_error
                    results_max_error[test_axis][c_i][s_i][a_i] = max_error

                    # record results of cycles to raw csv
                    print("Cycles complete")
                    print("Current: " + str(p["CURRENT"]))
                    print("Speed: " + str(p["SPEED"]))
                    print("Acceleration: " + str(p["ACCEL"]))
                    print("Error: " + str(run_avg_error))
                    for row in neg_errors:
                        writer.writerow(
                            {
                                "test_name" : TEST_NAME,
                                "axis": test_axis,
                                "current": p["CURRENT"],
                                "speed": p["SPEED"],
                                "acceleration": p["ACCEL"],
                                "neg_error": round(row, 5)
                            }
                        )
                    for row in pos_errors:
                        writer.writerow(
                            {
                                "test_name" : TEST_NAME,
                                "axis": test_axis,
                                "current": p["CURRENT"],
                                "speed": p["SPEED"],
                                "acceleration": p["ACCEL"],
                                "pos_error": round(row, 5)
                            }
                        )

                    # create tableized output csv for neat presentation
                    # output for cycles completed
                    save_table([test_axis], "cycles", results_cycles, 0)

                    # #output for average error
                    save_table([test_axis], "error", results_error, 3)

                    # #output for average error
                    save_table([test_axis], "max_error", results_max_error, 3)


    except KeyboardInterrupt:
        disengage_list = [AXIS_MAP[x] for x in list(AXIS)]
        await api.disengage_axes(disengage_list)
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
        stop = TEST_PARAMETERS[test_load][test_axis][p_type]["MAX"] + step*0.5

        return np.arange(start, stop, step)


TABLE_RESULTS_KEY: Dict[str, Dict[float, int]] = {}


# dictionary containing lists of all speed/accel/current combinations to for each axis
def make_test_list(test_axis: list, test_load: GantryLoad) -> Dict[str, list]:
    """Make test list dictionary."""
    test_axis = list(test_axis)
    complete_test_list: Dict[str, list] = {}
    for axis_t in test_axis:
        axis_test_list = []
        TABLE_RESULTS_KEY[axis_t] = {}
        c_i = 0
        s_i = 0
        a_i = 0
        for current_t in parameter_range(test_load, axis_t, "CURRENT"):
            TABLE_RESULTS_KEY[axis_t][current_t] = c_i
            c_i = c_i + 1
            s_i = 0
            for speed_t in parameter_range(test_load, axis_t, "SPEED"):
                TABLE_RESULTS_KEY[axis_t][speed_t] = s_i
                s_i = s_i + 1
                a_i = 0
                for accel_t in parameter_range(test_load, axis_t, "ACCEL"):
                    TABLE_RESULTS_KEY[axis_t][accel_t] = a_i
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
    parser.add_argument("--bench", type=bool, default=False)
    parser.add_argument("--name", type=str, default="ot3")

    args = parser.parse_args()
    CYCLES = args.cycles

    AXIS = args.axis
    LOAD = GANTRY_LOAD_MAP[args.load]
    DELAY = args.delay
    START_CURRENT = args.current
    BENCH = args.bench
    TEST_NAME = args.name
    TEST_LIST = make_test_list(AXIS, LOAD)

    if args.load == "HIGH":
        print("Setting high hold current")
        SETTINGS[AXIS_MAP["L"]].hold_current = HIGH_CURRENT
        SETTINGS[AXIS_MAP["R"]].hold_current = HIGH_CURRENT

    asyncio.run(_main(args.simulate))
