"""OT3 Single Axis Movement Test."""
import argparse
import asyncio
import csv

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

MOUNT = OT3Mount.LEFT
LOAD = GantryLoad.NONE
CYCLES = 1
SPEED_X = 500
SPEED_Z = 200

SPEED_Y = 500
ACCEL_Y = 500

MAX_ACCEL = 3000
MAX_SPEED = 1000


SETTINGS = {
    OT3Axis.X: GantryLoadSettings(
        max_speed=SPEED_X,
        acceleration=1000,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=0.7,
        run_current=1.5
    ),
    OT3Axis.Y: GantryLoadSettings(
        max_speed=SPEED_Y,
        acceleration=ACCEL_Y,
        max_start_stop_speed=20,
        max_change_dir_speed=5,
        hold_current=0.7,
        run_current=1.5
    ),
    OT3Axis.Z_L: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=300,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=0.7,
        run_current=1.5
    ),
    OT3Axis.Z_R: GantryLoadSettings(
        max_speed=SPEED_Z,
        acceleration=400,
        max_start_stop_speed=10,
        max_change_dir_speed=1,
        hold_current=0.7,
        run_current=1.5
    )
}

AXIS_MAP = {'Y': OT3Axis.Y,
                'X': OT3Axis.X,
                'L': OT3Axis.Z_L,
                'R': OT3Axis.Z_R,
                'PL': OT3Axis.P_L,
                'PR': OT3Axis.P_R}

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
        a = AXIS
        with open('speed_test_output_' + a + '.csv', mode='w') as csv_file:
            fieldnames = ['axis','speed', 'acceleration', 'error', 'cycles']
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            writer.writeheader()

            initial_speed = SETTINGS[AXIS_MAP[a]].max_speed
            initial_accel = SETTINGS[AXIS_MAP[a]].acceleration
            valid_speed = True
            valid_accel = True
            while(SETTINGS[AXIS_MAP[a]].max_speed < MAX_SPEED):
                while(SETTINGS[AXIS_MAP[a]].acceleration < MAX_ACCEL):
                    #update the robot settings to use test speed/accel
                    await match_z_settings(a,
                                     SETTINGS[AXIS_MAP[a]].max_speed,
                                     SETTINGS[AXIS_MAP[a]].acceleration)
                    await set_gantry_load_per_axis_settings_ot3(api,
                                                    SETTINGS,
                                                    load=None)

                    #attempt to cycle with the test settings
                    await api.home([AXIS_MAP[a]])
                    move_output_tuple = await _single_axis_move(a,
                                                                api,
                                                                cycles=CYCLES)
                    run_avg_error = move_output_tuple[0]
                    cycles_completed = move_output_tuple[1]
                    cur_speed = SETTINGS[AXIS_MAP[a]].max_speed
                    cur_accel = SETTINGS[AXIS_MAP[a]].acceleration
                    #this acceletation setting failed
                    if(abs(run_avg_error) >= 0.1):
                        valid_accel = False
                        if(cur_accel == initial_accel):
                            valid_speed = False
                        print("Error: " + str(run_avg_error))
                        print("Failed Speed: " + str(cur_speed))
                        print("Failed Acceleration: " + str(cur_accel))
                        writer.writerow({'axis': a,
                                         'speed': cur_speed,
                                         'acceleration': cur_accel,
                                         'error': run_avg_error,
                                         'cycles': cycles_completed})
                    else:
                        print("Speed: " + str(cur_speed))
                        print("Acceleration: " + str(cur_accel))
                        print("Error: " + str(run_avg_error))
                        writer.writerow({'axis': a,
                                         'speed': cur_speed,
                                         'acceleration': cur_accel,
                                         'error': run_avg_error,
                                         'cycles': cycles_completed})

                    #increment to the next acceleration
                    SETTINGS[AXIS_MAP[a]].acceleration = cur_accel + 250

                #increment to the next speed
                SETTINGS[AXIS_MAP[a]].acceleration = initial_accel
                valid_accel = True
                cur_speed = SETTINGS[AXIS_MAP[a]].max_speed
                SETTINGS[AXIS_MAP[a]].max_speed = cur_speed + 25
    except KeyboardInterrupt:
        await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
    finally:
        # await api.disengage_axes([OT3Axis.X, OT3Axis.Y, OT3Axis.Z_L, OT3Axis.Z_R])
        await api.clean_up()


if __name__ == "__main__":
    print('2')
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--axis", type=str, default='Y')
    parser.add_argument("--cycles", type=int, default=CYCLES)
    parser.add_argument("--speed", type=int, default=100)
    parser.add_argument("--accel", type=int, default=50)
    parser.add_argument("--irun", type=float, default=1.5)
    parser.add_argument("--ihold", type=float, default=0.5)

    args = parser.parse_args()
    AXIS = args.axis
    CYCLES = args.cycles
    AXIS_SPEED = args.speed
    SETTINGS[AXIS_MAP[AXIS]].max_speed = AXIS_SPEED
    SETTINGS[AXIS_MAP[AXIS]].acceleration = args.accel
    SETTINGS[AXIS_MAP[AXIS]].run_current = args.irun
    SETTINGS[AXIS_MAP[AXIS]].hold_current = args.ihold
    asyncio.run(_main(args.simulate))
