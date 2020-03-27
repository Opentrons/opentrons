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
import functools
import logging

from opentrons.drivers.smoothie_drivers.driver_3_0 import SmoothieError
from . import args_handler


def setup(motor_current, max_speed, driver):
    driver.set_active_current({"Z": motor_current, "A": motor_current})
    driver.set_axis_max_speed({'Z': max_speed, 'A': max_speed})
    driver.set_speed(max_speed)


def pick_up_motion(max_dist, max_speed, low_speed, driver, options):
    zero = 100
    zero_1 = 5

    # Descent Z z to 100mm
    setup(options.high_current, max_speed, driver)
    driver.set_speed(max_speed)
    driver.move({'Z': zero, 'A': zero})
    # Press Action
    setup(options.low_current, max_speed, driver)
    driver.set_speed(low_speed)
    driver.move({'Z': zero_1, 'A': zero_1})
    # Retract Action
    setup(options.high_current, max_speed, driver)
    driver.set_speed(max_speed)
    driver.move({'Z': zero, 'A': zero})
    # Jog up
    driver.set_speed(max_speed)
    driver.move({'Z': max_dist, 'A': max_dist})


def test_axis(axis, tolerance, driver):
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


def _exit_test(driver):
    driver._smoothie_reset()
    driver._setup()
    driver.disengage_axis('XYZABC')


def get_options(parser):
    parser.add_argument(
        "-m",
        "--max_speed",
        dest="max_speed",
        type=int,
        default=100,
        help="Max speed")
    parser.add_argument(
        "-d",
        "--distance",
        dest="distance",
        type=float,
        default=210,
        help="Max distance to travel")
    parser.add_argument(
        "--high_current",
        dest="high_current",
        type=float,
        default=0.5,
        help="Current for the Z stage to run")
    parser.add_argument(
        "-l",
        "--low_current",
        dest="low_current",
        type=float,
        default=0.05,
        help="low z motor current")
    parser.add_argument(
        "-c",
        "--cycles",
        dest="cycles",
        type=int,
        default=2,
        help="Cycles to run test")
    parser.add_argument(
        "-t",
        "--tolerance",
        dest="tolerance",
        type=float,
        default=0.5,
        help="Axis tolerance in millimeters")
    return parser.parse_args()


def run_z_stage(driver, options):
    for cycle in range(options.cycles):
        pick_up_motion(
            options.distance, options.max_speed, 30, driver, options)
        try:
            print("Testing Z")
            test_axis('Z', options.tolerance, driver)
        except Exception as e:
            print("FAIL: {}".format(e))
        try:
            print("Testing A")
            test_axis('A', options.tolerance, driver)
        except Exception as e:
            print("FAIL: {}".format(e))


if __name__ == '__main__':
    parser = args_handler.root_argparser(
        "Test the z-stages of the OT-2")
    args = get_options(parser)
    _, driver = args_handler.build_driver(args.port)
    atexit.register(functools.partial(_exit_test, driver))
    logging.basicConfig(filename='z-stage-test.log')
    try:
        print("In Progress.. ")
        setup(args.high_current, args.max_speed, driver)
        driver.home("ZA")
        run_z_stage(driver, args)
    except KeyboardInterrupt:
        print("Test Cancelled")
        exit()
    except Exception as e:
        print("FAIL: {}".format(e))
        exit()
    print("PASS")
