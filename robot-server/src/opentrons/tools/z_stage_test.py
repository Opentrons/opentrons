"""
Z-Stage Subassembly Test:
Travel 3x full z-stage motions @ max machine speed using 80% current.
Record for any lost steps
Travel 3x full z-stage motions @ min pickup tip current *80% current
    @ pickup tip speed. Record for any lost steps


Author: Carlos Fernandez
Date: 3/21/2018
QC Gantry Test

"""

import atexit
import logging
import optparse

from opentrons.tools import driver
from opentrons.drivers.smoothie_drivers.driver_3_0 import SmoothieError


def setup(motor_current, max_speed):
    driver.set_active_current({"Z": motor_current, "A": motor_current})
    driver.set_axis_max_speed({'Z': max_speed, 'A': max_speed})
    driver.set_speed(max_speed)


def pick_up_motion(max_dist, max_speed, low_speed):
    zero = 100
    zero_1 = 5

    # Descent Z z to 100mm
    setup(options.high_current, max_speed)
    driver.set_speed(max_speed)
    driver.move({'Z': zero, 'A': zero})
    # Press Action
    setup(options.low_current, max_speed)
    driver.set_speed(low_speed)
    driver.move({'Z': zero_1, 'A': zero_1})
    # Retract Action
    setup(options.high_current, max_speed)
    driver.set_speed(max_speed)
    driver.move({'Z': zero, 'A': zero})
    # Jog up
    driver.set_speed(max_speed)
    driver.move({'Z': max_dist, 'A': max_dist})


def test_axis(axis, tolerance):
    retract_amounts = {
        'X': 3,
        'Y': 3,
        'Z': 2,
        'A': 2,
        'B': 2,
        'C': 2
    }
    retract = retract_amounts[axis]
    expected_point = driver.homed_position[axis] + retract
    points = [expected_point - tolerance, expected_point + tolerance]
    driver.push_speed()
    driver.set_speed(8)
    try:
        driver.move({axis: points[0]})
    except SmoothieError:
        raise Exception('Test Failed: Pressing too soon')
    if axis == 'Y':
        if driver.switch_state[axis] is not False:
            raise Exception('Test Failed: Pressing too soon')
        driver.move({axis: points[1]})
        if driver.switch_state[axis] is not True:
            raise Exception('Test Failed: Not hitting switch')
    else:
        try:
            driver.move({axis: points[1]})
            raise Exception('Test Failed: Not hitting switch')
        except SmoothieError:
            pass
    driver.pop_speed()


def _exit_test():
    driver._smoothie_reset()
    driver._setup()
    driver.disengage_axis('XYZABC')


def get_options():
    parser = optparse.OptionParser(usage='usage: %prog [options] ')
    parser.add_option(
        "-m",
        "--max_speed",
        dest="max_speed",
        type='int',
        default=100,
        help="Max speed")
    parser.add_option(
        "-d",
        "--distance",
        dest="distance",
        type="float",
        default=210,
        help="Max distance to travel")
    parser.add_option(
        "--high_current",
        dest="high_current",
        type="float",
        default=0.5,
        help="Current for the Z stage to run")
    parser.add_option(
        "-p",
        "--port",
        dest="port",
        type="str",
        default='/dev/ttyS5',
        help="Port for Smoothie")
    parser.add_option(
        "-l",
        "--low_current",
        dest="low_current",
        type="float",
        default=0.05,
        help="low z motor current")
    parser.add_option(
        "-c",
        "--cycles",
        dest="cycles",
        type="int",
        default=2,
        help="Cycles to run test")
    parser.add_option(
        "-t",
        "--tolerance",
        dest="tolerance",
        type="float",
        default=0.5,
        help="Axis tolerance in millimeters")
    return parser.parse_args(args=None, values=None)


def run_z_stage():
    for cycle in range(options.cycles):
        pick_up_motion(options.distance, options.max_speed, 30)
        try:
            print("Testing Z")
            test_axis('Z', options.tolerance)
        except Exception as e:
            print("FAIL: {}".format(e))
        try:
            print("Testing A")
            test_axis('A', options.tolerance)
        except Exception as e:
            print("FAIL: {}".format(e))


if __name__ == '__main__':
    atexit.register(_exit_test)
    options, args = get_options()
    logging.basicConfig(filename='z-stage-test.log')
    try:
        print("In Progress.. ")
        setup(options.high_current, options.max_speed)
        driver.home("ZA")
        run_z_stage()
    except KeyboardInterrupt:
        print("Test Cancelled")
        exit()
    except Exception as e:
        print("FAIL: {}".format(e))
        exit()
    print("PASS")
