"""OT3 Speed Discontinuity Test."""
import argparse
import asyncio
import csv
import numpy as np
import time

from opentrons.hardware_control.ot3api import OT3API

from hardware_testing.opentrons_api.types import GantryLoad, OT3Mount, OT3Axis, Point
from hardware_testing.opentrons_api.helpers_ot3 import (
    build_async_ot3_hardware_api,
    GantryLoadSettings,
    set_gantry_load_per_axis_settings_ot3,
    set_gantry_load_per_axis_motion_settings_ot3,
    home_ot3,
)

import logging
logging.basicConfig(level=logging.INFO)

BASE_DIRECTORY = '/userfs/data/testing_data/discontinuity_test/'
SAVE_NAME = 'discontinuity_test_output_'

CYCLES = 1

TEST_LIST = {}
DISCONTINUITY_TEST_LIST = [0, 1, 5, 10, 15, 30, 50, 100];

SETTINGS = {
    OT3Axis.X: GantryLoadSettings(
        max_speed=300,
        acceleration=500,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.7,
        run_current=1.5
    ),
    OT3Axis.Y: GantryLoadSettings(
        max_speed=300,
        acceleration=500,
        max_start_stop_speed=10,
        max_change_dir_speed=5,
        hold_current=0.7,
        run_current=1.5
    ),
    OT3Axis.Z_L: GantryLoadSettings(
        max_speed=300,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=1.5,
        run_current=1.5
    ),
    OT3Axis.Z_R: GantryLoadSettings(
        max_speed=35,
        acceleration=100,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=1.5,
        run_current=1.5
    )
}

MOUNT = OT3Mount.LEFT

AXIS_MAP = {'Y': OT3Axis.Y,
                'X': OT3Axis.X,
                'L': OT3Axis.Z_L,
                'R': OT3Axis.Z_R,
                'P': OT3Axis.P_L,
                'O': OT3Axis.P_R}

LOAD = GantryLoad.NONE
GANTRY_LOAD_MAP = {'NONE': GantryLoad.NONE,
                   'LOW': GantryLoad.LOW_THROUGHPUT,
                   'TWO_LOW': GantryLoad.TWO_LOW_THROUGHPUT,
                   'HIGH': GantryLoad.HIGH_THROUGHPUT
}

DELAY = 0

step_x = 500
step_y = 300
xy_home_offset = 5
step_z = 200
HOME_POINT_MAP = {'Y': Point(y=-xy_home_offset),
             'X': Point(x=-xy_home_offset),
             'L': Point(z=0),
             'R': Point(z=0)}

POINT_MAP = {'Y': Point(y=step_y),
             'X': Point(x=step_x),
             'L': Point(z=step_z),
             'R': Point(z=step_z)}

NEG_POINT_MAP = {'Y': Point(y=-step_y),
             'X': Point(x=-step_x),
             'L': Point(z=-step_z),
             'R': Point(z=-step_z)}

#gets the delta between two position dictionaries. Must have the same keys
def get_pos_delta(final_pos, inital_pos):
    for axis in final_pos:
        final_pos[axis] = final_pos[axis] - inital_pos[axis]

    return final_pos

#compares the encoder distance between two moves to the commanded move distance
#delta_move: output of get_pos_delta from two encoder positons
#point_delta: the point representing the delta for a move_rel command
def check_move_error(delta_move, point_delta, axis):
    move_error = 0
    #compare with point based on axis
    if(axis == 'X'):
        move_error = abs(delta_move) - abs(point_delta[0])
    elif(axis == 'Y'):
        move_error = abs(delta_move) - abs(point_delta[1])
    else:
        move_error = abs(delta_move) - abs(point_delta[2])

    return abs(move_error)

def get_move_correction(actual_move, axis, direction):
    move_correction = 0
    if(axis == 'X'):
        move_correction = Point(x=actual_move*direction)
    elif(axis == 'Y'):
        move_correction = Point(y=actual_move*direction)
    else:
        move_correction = Point(z=actual_move*direction)

    return move_correction

async def _single_axis_move(axis, api: OT3API, cycles: int = 1) -> None:
    avg_error = []
    if(axis == 'L'):
        MOUNT = OT3Mount.LEFT
    else:
        MOUNT = OT3Mount.RIGHT

    #move away from the limit switch before cycling
    await api.move_rel(mount=MOUNT, delta=HOME_POINT_MAP[axis], speed=100)

    for c in range(cycles):
        #move away from homed position
        inital_pos = await api.encoder_current_position_ot3(mount=MOUNT)
        cur_speed = SETTINGS[AXIS_MAP[axis]].max_speed

        print('Executing Move: ' + str(c))
        print(' Discontinuity - ' + str(SETTINGS[AXIS_MAP[axis]].max_start_stop_speed))

        await api.move_rel(mount=MOUNT, delta=NEG_POINT_MAP[axis], speed=cur_speed)

        #check if we moved to correct position with encoder
        move_pos = await api.encoder_current_position_ot3(mount=MOUNT)
        print("inital_pos: " + str(inital_pos))
        print("mov_pos: " + str(move_pos))
        delta_move_pos = get_pos_delta(move_pos, inital_pos)
        delta_move_axis = delta_move_pos[AXIS_MAP[axis]]
        move_error = check_move_error(delta_move_axis, NEG_POINT_MAP[axis], axis)
        #if we had error in the move stop move
        print(axis + ' Error: ' + str(move_error))
        if(move_error >= 0.1):
            #attempt to move closer to the home position quickly
            move_error_correction = get_move_correction(delta_move_axis,
                                                        axis,
                                                        -1)
            print('ERROR IN NEG MOVE, CORRECTING: ' + str(move_error_correction))
            await api.move_rel(mount=MOUNT, delta=move_error_correction, speed=100)
            if(DELAY > 0):
                time.sleep(DELAY)
            return (move_error, c+1)

        #record the current position
        inital_pos = await api.encoder_current_position_ot3(mount=MOUNT)

        #move back to near homed position
        await api.move_rel(mount=MOUNT, delta=POINT_MAP[axis], speed=cur_speed)

        final_pos = await api.encoder_current_position_ot3(mount=MOUNT)
        delta_pos = get_pos_delta(final_pos, inital_pos)
        delta_pos_axis = delta_pos[AXIS_MAP[axis]]
        move_error = check_move_error(delta_move_axis, NEG_POINT_MAP[axis], axis)
        print(axis + ' Error: ' + str(move_error))
        if(abs(move_error) >= 0.1):
            print('ERROR IN POS MOVE')
            if(DELAY > 0):
                time.sleep(DELAY)
            return (move_error, c+1);
        else:
            avg_error.append(move_error)

        #home every 50 cycles in case we have drifted
        if((c+1)%50 == 0):
            await api.home([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
            #move away from the limit switch before cycling
            await api.move_rel(mount=MOUNT, delta=HOME_POINT_MAP[axis], speed=100)

    if(DELAY > 0):
        time.sleep(DELAY)

    return (sum(avg_error)/len(avg_error), c+1)


async def match_z_settings(axis, discon):
    if(axis == 'L' or axis == 'R'):
        SETTINGS[AXIS_MAP['L']].max_start_stop_speed = discon
        SETTINGS[AXIS_MAP['R']].max_start_stop_speed = discon

    return True

async def _main(is_simulating: bool) -> None:
    api = await build_async_ot3_hardware_api(is_simulating=is_simulating)
    await api.home([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    try:
        #run the test while recording raw results
        table_results = {}
        with open(BASE_DIRECTORY + SAVE_NAME + AXIS + '.csv', mode='w') as csv_file:
            fieldnames = ['axis','discontinuity', 'error', 'cycles']
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            writer.writeheader()

            test_axis_list = list(AXIS)
            for test_axis in test_axis_list:
                table_results[test_axis] = {}

                axis_parameters = TEST_LIST[test_axis]
                print('Testing Axis: ' + test_axis)
                for p in axis_parameters:
                    print("Testing Parameters:")
                    print(p)
                    SETTINGS[AXIS_MAP[test_axis]].max_start_stop_speed = p['DISCON']
                    print(test_axis)
                    print(LOAD)
                    #update the robot settings to use test speed/accel
                    await match_z_settings(test_axis,
                                     SETTINGS[AXIS_MAP[test_axis]].max_start_stop_speed)

                    await set_gantry_load_per_axis_settings_ot3(api,
                                                    SETTINGS,
                                                    load=LOAD)
                    print(api.config.motion_settings.max_speed_discontinuity)

                    #attempt to cycle with the test settings
                    # await api.home([AXIS_MAP[test_axis]])
                    await api.home([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
                    move_output_tuple = await _single_axis_move(test_axis,
                                                                api,
                                                                cycles=CYCLES)
                    run_avg_error = move_output_tuple[0]
                    cycles_completed = move_output_tuple[1]

                    # #record results to dictionary for neat formatting later
                    # if p['SPEED'] in table_results[test_axis].keys():
                    #     table_results[test_axis][p['SPEED']][p['ACCEL']] = cycles_completed
                    # else:
                    #     table_results[test_axis][p['SPEED']] = {}
                    #     table_results[test_axis][p['SPEED']][p['ACCEL']] = cycles_completed

                    #record results of cycles to raw csv
                    print("Cycles complete")
                    print("Discontinuity: " + str(p['DISCON']))
                    print("Error: " + str(run_avg_error))
                    writer.writerow({'axis': test_axis,
                                     'discontinuity': p['DISCON'],
                                     'error': run_avg_error,
                                     'cycles': cycles_completed})

        #create tableized output csv for neat presentation
        # print(table_results)
        # test_axis_list = list(AXIS)
        # for test_axis in test_axis_list:
        #     with open(BASE_DIRECTORY + SAVE_NAME + test_axis + '_table.csv', mode='w') as csv_file:
        #         fieldnames = ['Speed'] + [*parameter_range(LOAD, test_axis, 'ACCEL')]
        #         # print(fieldnames)
        #         writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        #         td = {'Speed': LOAD}
        #         writer.writerow(td)
        #         td = {'Speed': test_axis}
        #         writer.writerow(td)
        #         td = {'Speed': 'Acceleration'}
        #         writer.writerow(td)
        #         writer.writeheader()
        #         for i in parameter_range(LOAD, test_axis, 'SPEED'):
        #             td = {'Speed': i}
        #             td.update(table_results[test_axis][i])
        #             writer.writerow(td)
        #         # print(table_results[test_axis])

    except KeyboardInterrupt:
        await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    finally:
        # await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        await api.clean_up()

def parameter_range(test_load, test_axis, p_type):
    start = TEST_PARAMETERS[test_load][test_axis][p_type]['MIN']
    step = TEST_PARAMETERS[test_load][test_axis][p_type]['INC']
    #add step to stop to make range inclusive
    stop = TEST_PARAMETERS[test_load][test_axis][p_type]['MAX'] + step
    return range(start, stop, step)

#dictionary containing lists of all speed/accel combinations to for each axis
def make_test_list(test_axis, test_load):
    test_axis = list(test_axis)
    complete_test_list = {}
    for axis_t in test_axis:
        axis_test_list = []
        for discontinuity_t in DISCONTINUITY_TEST_LIST:
            axis_test_list.append({'DISCON': discontinuity_t})

        complete_test_list[axis_t] = axis_test_list

    return complete_test_list


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--axis", type=str, default='Y')
    parser.add_argument("--cycles", type=int, default=CYCLES)
    parser.add_argument("--load", type=str, default='NONE')
    parser.add_argument("--delay", type=int, default=0)

    args = parser.parse_args()
    CYCLES = args.cycles

    AXIS = args.axis
    LOAD = GANTRY_LOAD_MAP[args.load]
    DELAY = args.delay
    TEST_LIST = make_test_list(AXIS, LOAD)

    asyncio.run(_main(args.simulate))
