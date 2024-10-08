import os
import sys
sys.path.append('../../')
import stacker
from stacker import AXIS, DIR
import mitutoyo_digimatic_indicator as dial_indicator
import csv
import time


if __name__ == '__main__':
    s = stacker.FlexStacker(None).create('COM6')
    gauge = dial_indicator.Mitutoyo_Digimatic_Indicator('COM7')
    gauge.connect()
    test_axis = AXIS.Z
    cycles = 5
    s.home_speed = 20
    s.home_acceleration = 5
    s.set_ihold_current(1.5, test_axis)
    current_list = [1.5, 1.45, 1.4, 1.35, 1.3, 1.25, 1.2, 1.15, 1.0,
                    0.95, 0.90, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55,
                    0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1, 0.05]
    # current_list = [1.5, 1.45, 1.4, 1.35, 1.3, 1.25, 1.2, 1.15, 1.0,
    #                 0.95, 0.90, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55,
    #                 [0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1, 0.05]
    s.home(AXIS.Z, DIR.NEGATIVE_HOME, s.home_speed, s.home_acceleration)
    s.home(AXIS.X, DIR.NEGATIVE_HOME, s.home_speed, s.home_acceleration)
    if test_axis == AXIS.Z:
        with open(f'{test_axis}_holding_current_test_unit2.csv', 'w', newline='') as file:
            writer = csv.writer(file)
            field = ["Cycle", "HOME_POS", "Current", "Position_1", "Position_2" "Axis"]
            writer.writerow(field)
            backup_distance = 5
            for x in range(1, cycles+1):
                for current in current_list:
                    print(f'Cycle: {x}')
                    s.home(AXIS.Z, DIR.NEGATIVE_HOME, s.home_speed, s.home_acceleration)
                    # home_reading = gauge.read_stable()
                    time.sleep(10)
                    #print(f'home reading: {home_reading}')
                    s.move(AXIS.Z, backup_distance, DIR.POSITIVE, s.home_speed, s.home_acceleration)
                    # position_1 = gauge.read_stable()
                    #print(f'position_1 reading: {position_1}')
                    s.set_ihold_current(current, test_axis)
                    time.sleep(10)
                    # position_2 = gauge.read_stable()
                    #print(f'position_2 reading: {position_2}')
                    # writer.writerow([x, home_reading, current, position_1, position_2, test_axis])
    else:
        with open(f'{test_axis}_holding_current_test_unit2.csv', 'w', newline='') as file:
            writer = csv.writer(file)
            field = ["Cycle", "HOME_POS", "Current", "Position_1", "Position_2" "Axis"]
            writer.writerow(field)
            for x in range(1, cycles+1):
                for current in current_list:
                    print(f'Cycle: {x}, current: {current}')
                    s.home(test_axis, DIR.POSITIVE_HOME, s.home_speed, s.home_acceleration)
                    home_reading = gauge.read_stable()
                    print(f'home reading: {home_reading}')
                    # s.set_run_current(1.5, test_axis)
                    position_1 = gauge.read_stable()
                    print(f'position_1 reading: {position_1}')
                    s.set_ihold_current(current, test_axis)
                    time.sleep(60)
                    position_2 = gauge.read_stable()
                    print(f'position_2 reading: {position_2}')
                    time.sleep(60)
                    s.home(test_axis, DIR.NEGATIVE_HOME, s.home_speed, s.home_acceleration)
                    writer.writerow([x, home_reading, current, position_1, position_2, test_axis])
