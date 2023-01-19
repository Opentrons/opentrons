"""OT3 Speed and Acceleration Profile Test."""
import argparse
import asyncio
import csv
import numpy as np

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

CYCLES = 1

TEST_LIST = {}

TEST_PARAMETERS = {
    GantryLoad.NONE: {
        'X': {
            'SPEED': {
                'MIN': 500,
                'MAX': 1000,
                'INC': 50},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}},
        'Y': {
            'SPEED': {
                'MIN': 500,
                'MAX': 1000,
                'INC': 50},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}},
        'L': {
            'SPEED': {
                'MIN': 80,
                'MAX': 140,
                'INC': 10},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}},
        'R': {
            'SPEED': {
                'MIN': 80,
                'MAX': 140,
                'INC': 10},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}}
    },
    GantryLoad.LOW_THROUGHPUT: {
        'X': {
            'SPEED': {
                'MIN': 500,
                'MAX': 1000,
                'INC': 50},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}},
        'Y': {
            'SPEED': {
                'MIN': 500,
                'MAX': 1000,
                'INC': 50},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}},
        'L': {
            'SPEED': {
                'MIN': 80,
                'MAX': 140,
                'INC': 10},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}},
        'R': {
            'SPEED': {
                'MIN': 80,
                'MAX': 140,
                'INC': 10},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}}
    },
    GantryLoad.TWO_LOW_THROUGHPUT: {
        'X': {
            'SPEED': {
                'MIN': 500,
                'MAX': 1000,
                'INC': 50},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}},
        'Y': {
            'SPEED': {
                'MIN': 500,
                'MAX': 1000,
                'INC': 50},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}},
        'L': {
            'SPEED': {
                'MIN': 80,
                'MAX': 140,
                'INC': 10},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}},
        'R': {
            'SPEED': {
                'MIN': 80,
                'MAX': 140,
                'INC': 10},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}}
    },
    GantryLoad.HIGH_THROUGHPUT: {
        'X': {
            'SPEED': {
                'MIN': 500,
                'MAX': 1000,
                'INC': 50},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}},
        'Y': {
            'SPEED': {
                'MIN': 500,
                'MAX': 1000,
                'INC': 50},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}},
        'L': {
            'SPEED': {
                'MIN': 80,
                'MAX': 140,
                'INC': 10},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}},
        'R': {
            'SPEED': {
                'MIN': 80,
                'MAX': 140,
                'INC': 10},
            'ACCEL': {
                'MIN': 800,
                'MAX': 3000,
                'INC': 200}}
    }
}


SETTINGS = {
    OT3Axis.X: GantryLoadSettings(
        max_speed=500,
        acceleration=1000,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=0.7,
        run_current=1.5
    ),
    OT3Axis.Y: GantryLoadSettings(
        max_speed=500,
        acceleration=1000,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=0.7,
        run_current=1.5
    ),
    OT3Axis.Z_L: GantryLoadSettings(
        max_speed=60,
        acceleration=300,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=0.7,
        run_current=1.5
    ),
    OT3Axis.Z_R: GantryLoadSettings(
        max_speed=60,
        acceleration=400,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=0.7,
        run_current=1.5
    )
}

MOUNT = OT3Mount.LEFT

AXIS_MAP = {'Y': OT3Axis.Y,
                'X': OT3Axis.X,
                'L': OT3Axis.Z_L,
                'R': OT3Axis.Z_R,
                'PL': OT3Axis.P_L,
                'PR': OT3Axis.P_R}

LOAD = GantryLoad.NONE
GANTRY_LOAD_MAP = {'NONE': GantryLoad.NONE,
                   'LOW': GantryLoad.LOW_THROUGHPUT,
                   'TWO_LOW': GantryLoad.TWO_LOW_THROUGHPUT,
                   'HIGH': GantryLoad.HIGH_THROUGHPUT
}


step_x = 530
step_y = 400
step_z = 180
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


async def _single_axis_move(axis, api: OT3API, cycles: int = 1) -> None:
    avg_error = []
    for c in range(cycles):
        if(AXIS == 'L'):
            MOUNT = OT3Mount.LEFT
        else:
            MOUNT = OT3Mount.RIGHT
        inital_pos = await api.encoder_current_position_ot3(mount=MOUNT)
        cur_speed = SETTINGS[AXIS_MAP[axis]].max_speed

        print('Executing Move:')
        print('Speed: ' + str(cur_speed))
        print('Acceleration: ' + str(SETTINGS[AXIS_MAP[axis]].acceleration))

        await api.move_rel(mount=MOUNT, delta=NEG_POINT_MAP[axis], speed=cur_speed)

        move_pos = await api.encoder_current_position_ot3(mount=MOUNT)
        delta_move_pos = get_pos_delta(move_pos, inital_pos)
        delta_move_axis = delta_move_pos[AXIS_MAP[axis]]
        move_error = check_move_error(delta_move_axis, NEG_POINT_MAP[axis], axis)
        if(move_error >= 0.1):
            return (move_error, c+1)

        await api.move_rel(mount=MOUNT, delta=POINT_MAP[axis], speed=cur_speed)

        final_pos = await api.encoder_current_position_ot3(mount=MOUNT)
        delta_pos = get_pos_delta(final_pos, inital_pos)
        delta_pos_axis = delta_pos[AXIS_MAP[axis]]
        print(axis + ' Error: ' + str(delta_pos_axis))
        if(abs(delta_pos_axis) >= 0.1):
            return (delta_pos_axis, c+1);
        else:
            avg_error.append(delta_pos_axis)
    return (sum(avg_error)/len(avg_error), c+1)


async def match_z_settings(axis, speed, accel):
    if(axis == 'L' or axis == 'R'):
        SETTINGS[AXIS_MAP['L']].acceleration = accel
        SETTINGS[AXIS_MAP['L']].max_speed = speed
        SETTINGS[AXIS_MAP['R']].acceleration = accel
        SETTINGS[AXIS_MAP['R']].max_speed = speed

    return True

async def _main(is_simulating: bool) -> None:
    api = await build_async_ot3_hardware_api(is_simulating=is_simulating)
    try:
        #run the test while recording raw results
        table_results = {}
        with open('speed_test_output_' + AXIS + '.csv', mode='w') as csv_file:
            fieldnames = ['axis','speed', 'acceleration', 'error', 'cycles']
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            writer.writeheader()

            test_axis_list = list(AXIS)
            for test_axis in test_axis_list:
                axis_parameters = TEST_LIST[test_axis]
                print('Testing Axis: ' + test_axis)
                for p in axis_parameters:
                    print("Testing Parameters:")
                    print(p)
                    SETTINGS[AXIS_MAP[test_axis]].acceleration = p['ACCEL']
                    SETTINGS[AXIS_MAP[test_axis]].max_speed = p['SPEED']

                    #update the robot settings to use test speed/accel
                    await match_z_settings(test_axis,
                                     SETTINGS[AXIS_MAP[test_axis]].max_speed,
                                     SETTINGS[AXIS_MAP[test_axis]].acceleration)

                    await set_gantry_load_per_axis_settings_ot3(api,
                                                    SETTINGS,
                                                    load=LOAD)

                    #attempt to cycle with the test settings
                    await api.home([AXIS_MAP[test_axis]])
                    move_output_tuple = await _single_axis_move(test_axis,
                                                                api,
                                                                cycles=CYCLES)
                    run_avg_error = move_output_tuple[0]
                    cycles_completed = move_output_tuple[1]

                    #record results of cycles
                    print("Cycles complete")
                    print("Speed: " + str(p['SPEED']))
                    print("Acceleration: " + str(p['ACCEL']))
                    print("Error: " + str(run_avg_error))
                    writer.writerow({'axis': test_axis,
                                     'speed': p['SPEED'],
                                     'acceleration': p['ACCEL'],
                                     'error': run_avg_error,
                                     'cycles': cycles_completed})

        #create tableized output csv for neat presentation
        # with open('speed_test_' + AXIS + '_table.csv', mode='w') as csv_file:

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
        for speed_t in parameter_range(test_load, axis_t, 'SPEED'):
            for accel_t in parameter_range(test_load, axis_t, 'ACCEL'):
                axis_test_list.append({'SPEED': speed_t,
                                       'ACCEL': accel_t})

        complete_test_list[axis_t] = axis_test_list

    return complete_test_list


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--axis", type=str, default='Y')
    parser.add_argument("--cycles", type=int, default=CYCLES)
    parser.add_argument("--load", type=str, default='NONE')

    args = parser.parse_args()
    CYCLES = args.cycles

    AXIS = args.axis
    LOAD = GANTRY_LOAD_MAP[args.load]
    TEST_LIST = make_test_list(AXIS, LOAD)

    asyncio.run(_main(args.simulate))
