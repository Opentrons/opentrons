"""

Gantry Test
This Test objective will test the Gantry at 85% motor current
with Max speed. This will result to a good assembly vs a bad assembly process.


Author: Carlos Fernandez
"""

import atexit
import optparse
from opentrons import robot
from opentrons.drivers.smoothie_drivers.driver_3_0 import SmoothieError


def setup(max_speed):
    x_current = robot.config.high_current['X'] * 0.8
    y_current = robot.config.high_current['X'] * 0.8
    robot._driver.set_active_current(
        {'X': x_current, 'Y': y_current})
    robot._driver.set_axis_max_speed({'X': max_speed, 'Y': max_speed})
    robot._driver.set_speed(max_speed)


def bowtie_pattern(X_max, Y_max):
    zero = 10
    offset = 5
    robot._driver.move({'X': zero, 'Y': zero + offset})
    robot._driver.move({'X': zero, 'Y': Y_max})
    robot._driver.move({'X': X_max, 'Y': zero})
    robot._driver.move({'X': X_max, 'Y': Y_max})


def hourglass_pattern(X_max, Y_max):
    zero = 10
    offset = 5
    robot._driver.move({'X': zero, 'Y': zero + offset})
    robot._driver.move({'X': X_max, 'Y': zero + offset})
    robot._driver.move({'X': zero, 'Y': Y_max})
    robot._driver.move({'X': X_max, 'Y': Y_max})


def test_axis(axis, tolerance):
    retract_amounts = {
        'X': 3,
        'Y': 3,
        'Z': 2,
        'A': 2,
        'B': 2,
        'C': 2
    }
    # it moves RETRACT_MM away from the endstop
    retract = retract_amounts[axis]
    expected_point = robot._driver.homed_position[axis] + retract
    points = [expected_point - tolerance, expected_point + tolerance]
    # expected_point = home_position + retract
    # safe distance from switch?
    robot._driver.push_speed()
    robot._driver.set_speed(10)
    try:
        robot._driver.move({axis: points[0]})
    except SmoothieError:
        raise Exception('Test Failed: Pressing too soon')
    if axis == 'Y':
        if robot._driver.switch_state[axis] is not False:
            raise Exception('Test Failed: Pressing too soon')
        robot._driver.move({axis: points[1]})
        if robot._driver.switch_state[axis] is not True:
            raise Exception('Test Failed: Not hitting switch')
    else:
        try:
            robot._driver.move({axis: points[1]})
            raise Exception('Test Failed: Not hitting switch')
        except SmoothieError:
            pass
    robot._driver.pop_speed()


def run_x_axis():
    # Test X Axis
    for cycle in range(cycles):
        print("Testing X")
        setup(600)
        hourglass_pattern(b_x_max, b_y_max)
        try:
            test_axis('X', options.tolerance)
        except Exception as e:
            print("FAIL: {}".format(e))


def run_y_axis():
    # Test Y Axis
    for cycle in range(cycles):
        print("Testing Y")
        setup(600)
        bowtie_pattern(b_x_max, b_y_max)
        try:
            test_axis('Y', options.tolerance)
        except Exception as e:
            print("FAIL: {}".format(e))
        finally:
            robot._driver.home('Y')  # we tell it to home Y manually


def _exit_test():
    robot._driver._smoothie_reset()
    robot._driver._setup()
    robot._driver.disengage_axis('XYZABC')


if __name__ == '__main__':
    atexit.register(_exit_test)

    parser = optparse.OptionParser(usage='usage: %prog [options] ')
    parser.add_option(
        "-t",
        "--tolerance",
        dest="tolerance",
        type="float",
        default=0.5,
        help="Axis tolerance in millimeters")
    options, args = parser.parse_args(args=None, values=None)

    b_x_max = 417.2
    b_y_max = 320

    cycles = 3

    try:
        robot.connect()
        robot.home()
        run_x_axis()
        run_y_axis()
        robot._driver._set_button_light(red=False, green=True, blue=False)
        print("PASS")
    except KeyboardInterrupt:
        print("Test Cancelled")
        robot._driver.turn_on_blue_button_light()
        exit()
    except Exception as e:
        robot._driver.turn_on_red_button_light()
        print("FAIL: {}".format(e))
