import os
import sys
sys.path.append('../../')
import stacker
from stacker import AXIS, DIR
import mitutoyo_digimatic_indicator as dial_indicator
import csv
import time
from typing import Dict
import numpy as np
import argparse

TEST_PARAMETERS: Dict[str, Dict[str, Dict[str, Dict[str, float]]]] = {
    "Plate_stacker": {
        "X": {
            "SPEED": {"MIN": 20, "MAX": 200, "INC": 20},
            "ACCEL": {"MIN": 100, "MAX": 2000, "INC": 100},
            "CURRENT": {"MIN": 0.5, "MAX": 1.5, "INC": 0.05}
        },
        "Z": {
            "SPEED": {"MIN": 5, "MAX": 450, "INC": 5},
            "ACCEL": {"MIN": 5, "MAX": 200, "INC": 5},
            "CURRENT": {"MIN": 1, "MAX": 1.4, "INC": 0.05}
        },
        "L": {
            "SPEED": {"MIN": 80, "MAX": 120, "INC": 5},
            "ACCEL": {"MIN": 100, "MAX": 200, "INC": 50},
            "CURRENT": {"MIN": 0.75, "MAX": 1.25, "INC": 0.05}
        },
    },
}
# print(f'{TEST_PARAMETERS}')

def build_arg_parser():
    arg_parser = argparse.ArgumentParser(description="Motion Parameter Test Script")
    arg_parser.add_argument("-c", "--cycles", default = 100, help = "number of cycles to execute")
    arg_parser.add_argument("-a", "--acceleration", default = 10, help = "Set the Acceleration")
    # arg_parser.add_argument("-")
    return arg_parser

def parameter_range(test_axis: str, p_type: str) -> np.ndarray:
    """Makes a range of a parameter based on start, stop, step."""
    start = TEST_PARAMETERS["Plate_stacker"][test_axis][p_type]["MIN"]
    step = TEST_PARAMETERS["Plate_stacker"][test_axis][p_type]["INC"]

    if step == 0:
        return np.array([start])
    else:
        # add step to stop to make range inclusive
        stop = TEST_PARAMETERS["Plate_stacker"][test_axis][p_type]["MAX"] + step*0.5
        # print(start)
        # print(stop)
        # print(step)
        return np.arange(start, stop, step)


TABLE_RESULTS_KEY: Dict[str, Dict[float, int]] = {}

# dictionary containing lists of all speed/accel/current combinations to for each axis
def make_test_list(test_axis) -> Dict[str, list]:
    """Make test list dictionary."""
    test_axis = list(test_axis)
    complete_test_list: Dict[str, list] = {}
    for axis_t in test_axis:
        axis_test_list = []
        TABLE_RESULTS_KEY[axis_t] = {}
        c_i = 0
        s_i = 0
        a_i = 0
        for current_t in parameter_range(axis_t, "CURRENT"):
            TABLE_RESULTS_KEY[axis_t][current_t] = c_i
            c_i = c_i + 1
            s_i = 0
            for speed_t in parameter_range(axis_t, "SPEED"):
                TABLE_RESULTS_KEY[axis_t][speed_t] = s_i
                s_i = s_i + 1
                a_i = 0
                for accel_t in parameter_range(axis_t, "ACCEL"):
                    TABLE_RESULTS_KEY[axis_t][accel_t] = a_i
                    a_i = a_i + 1
                    axis_test_list.append(
                        {"CURRENT": current_t, "SPEED": speed_t, "ACCEL": accel_t}
                    )

        complete_test_list[axis_t] = axis_test_list

    return complete_test_list


if __name__ == '__main__':
    arg_parser = build_arg_parser()
    options = arg_parser.parse_args()
    s = stacker.FlexStacker(None).create('COM6')
    gauge = dial_indicator.Mitutoyo_Digimatic_Indicator('COM7')
    gauge.connect()
    test_axis = AXIS.X
    # Home the Axis being tested
    s.set_run_current(1.5, test_axis)
    s.set_ihold_current(1.0, test_axis)
    s.home(test_axis, DIR.POSITIVE_HOME)
    list_1 = make_test_list(test_axis)
    # Loop through motor current
    # Loop through accelerations
    # Loop through velocity
    if test_axis == AXIS.X:
        TOTAL_TRAVEL_X = 202
    else:
        TOTAL_TRAVEL_Z = 113.75
    with open(f'motion_parameters.csv', 'w', newline='') as file:
        writer = csv.writer(file)
        fields = ["Cycle", "Position 1", "Position 2", "Position 3",
                    "SW_State_1", "SW_STATE_2", "SW_STATE_3", "MOTOR_CURRENT", "VELOCITY", "ACCELERATION"]
        writer.writerow(fields)
        for c in range(1, 2):
            print(f'Cycle Count: {c}')
            for settings in list_1['X']:
                print(settings)
                sw_states = s.get_sensor_states()
                if sw_states['XE'] == '1':
                    sw_state_1 = sw_states['XE']
                    print(f'Limite Switch Statues: {sw_state_1}')
                    home_reading = gauge.read_stable()
                    print(f'home reading: {home_reading}')
                else:
                    s.set_run_current(1.5, test_axis)
                    s.home(test_axis, DIR.POSITIVE_HOME, s.home_speed, s.home_acceleration)
                    home_reading = gauge.read_stable()
                    print(f'home reading: {home_reading}')
                    sw_state_1 = s.get_sensor_states()['XE']
                    print(f'SW state 1: {sw_state_1}')
                s.set_run_current(settings['CURRENT'], test_axis)
                s.move(test_axis,
                                TOTAL_TRAVEL_X-1, # 202 - 4 = 201
                                DIR.NEGATIVE,
                                settings['SPEED'],
                                settings['ACCEL'])
                s.move(test_axis,
                                TOTAL_TRAVEL_X-2, # 202 -4 = 200
                                DIR.POSITIVE,
                                settings['SPEED'],
                                settings['ACCEL'])
                sw_state_2 = s.get_sensor_states()['XE']
                print(f'SW State 2: {sw_state_2}')
                position_2 = gauge.read_stable()
                print(f'position_2: {position_2}')
                s.set_run_current(1.5, test_axis)
                s.move(test_axis,
                                1, # 201 - 200 = 1
                                DIR.POSITIVE,
                                settings['SPEED'],
                                settings['ACCEL'])
                sw_state_3 = s.get_sensor_states()['XE']
                print(f'SW State 3: {sw_state_3}')
                position_3 = gauge.read_stable()
                print(f'position_3: {position_3}')
                data = [c, home_reading, position_2, position_3, sw_state_1, sw_state_2, sw_state_3,
                        settings['CURRENT'], settings['SPEED'], settings['ACCEL'],
                        ]
                writer.writerow(data)
                file.flush()
        # Move to full distance - 1mm, measure the limit switch,
        # Move 1mm to photo interrupter and read switch state
        # Record
        # Home
