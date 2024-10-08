import os
import sys
sys.path.append('../../')
import stacker
from stacker import AXIS, DIR
import mitutoyo_digimatic_indicator as dial_indicator
import csv


if __name__ == '__main__':
    s = stacker.FlexStacker(None).create('COM6')
    gauge = dial_indicator.Mitutoyo_Digimatic_Indicator('COM7')
    gauge.connect()
    labware_clearance = 7.0
    labware_retract_speed= 10
    cycles = 50
    s.home_speed = 40
    s.home_acceleration = 5
    s.set_ihold_current(1.5, AXIS.X)
    s.set_ihold_current(1.5, AXIS.Z)
    s.home(AXIS.X, DIR.POSITIVE_HOME, s.home_speed, s.home_acceleration)
    s.home(AXIS.Z, DIR.NEGATIVE_HOME, s.home_speed, s.home_acceleration)
    # s.home(AXIS.L, DIR.NEGATIVE_HOME, s.home_speed, s.home_acceleration)
    # s.home(AXIS.X, DIR.NEGATIVE_HOME, s.home_speed, s.home_acceleration)

    # with open(f'z_homing_repeatability_{s.home_speed}mm_per_sec_unit2.csv', 'w', newline='') as file:
    #     writer = csv.writer(file)
    #     field = ["Cycle", "HOME_POS", "Backlash", "Target position", "Speed", "Acceleration"]
    #     writer.writerow(field)
    #     for x in range(1, cycles+1):
    #         print(f'Cycle: {x}')
    #         s.home(AXIS.Z, DIR.POSITIVE_HOME, s.home_speed, s.home_acceleration)
    #         home_reading = gauge.read_stable()
    #         print(f'home reading: {home_reading}')
    #         s.move(AXIS.Z, 1, DIR.NEGATIVE, labware_retract_speed, s.home_acceleration)
    #         backlash_reading = gauge.read_stable()
    #         print(f'backlash reading: {backlash_reading}')
    #         s.move(AXIS.Z, labware_clearance, DIR.NEGATIVE, labware_retract_speed, s.home_acceleration)
    #         target_reading = gauge.read_stable()
    #         print(f'target reading: {target_reading}')
    #         s.home(AXIS.Z, DIR.NEGATIVE_HOME, s.home_speed, s.home_acceleration)
    #         writer.writerow([x, home_reading, backlash_reading, target_reading, s.home_speed, s.home_acceleration])

    with open(f'x_homing_repeatability_{s.home_speed}mm_per_sec_unit2_ihold_1.0Amps.csv', 'w', newline='') as file:
        writer = csv.writer(file)
        field = ["Cycle", "HOME_POS", "Backlash", "Target position", "Speed", "Acceleration"]
        writer.writerow(field)
        for x in range(1, cycles+1):
            print(f'Cycle: {x}')
            s.home(AXIS.X, DIR.POSITIVE_HOME, s.home_speed, s.home_acceleration)
            home_reading = gauge.read_stable()
            print(f'home reading: {home_reading}')
            s.move(AXIS.X, 2.0, DIR.NEGATIVE, labware_retract_speed, s.home_acceleration)
            backlash_reading = gauge.read_stable()
            print(f'Reading: {backlash_reading}')
            # input("Press Enter to continue")
            s.move(AXIS.X, labware_clearance, DIR.NEGATIVE, labware_retract_speed, s.home_acceleration)
            target_reading = gauge.read_stable()
            print(f'target reading: {target_reading}')
            s.home(AXIS.X, DIR.NEGATIVE_HOME, s.home_speed, s.home_acceleration)
            # home_reading = gauge.read_stable()
            writer.writerow([x, home_reading, backlash_reading, target_reading, s.home_speed, s.home_acceleration])
