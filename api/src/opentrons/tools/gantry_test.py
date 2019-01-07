"""

Gantry Test
This Test objective will test the Gantry at 85% motor current
with Max speed. This will result to a good assembly vs a bad assembly process.


Author: Carlos Fernandez
"""
import optparse

from opentrons import robot
from opentrons.drivers.rpi_drivers import gpio
from opentrons.drivers.smoothie_drivers.driver_3_0 import \
    SmoothieError, DEFAULT_AXES_SPEED


def setup_motor_current():
    # only set the current, keeping all other settings at the driver's default
    robot._driver.set_speed(DEFAULT_AXES_SPEED)
    x_current = robot.config.high_current['X'] * 0.85
    y_current = robot.config.high_current['Y'] * 0.85
    robot._driver.set_active_current(
        {'X': x_current, 'Y': y_current})


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
    robot._driver.set_speed(8)
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


def run_x_axis(cycles, x_max, y_max, tolerance):
    # Test X Axis
    for cycle in range(cycles):
        print("Testing X")
        setup_motor_current()
        hourglass_pattern(x_max, y_max)
        try:
            test_axis('X', tolerance)
        except Exception as e:
            print("FAIL: {}".format(e))


def run_y_axis(cycles, x_max, y_max, tolerance):
    # Test Y Axis
    for cycle in range(cycles):
        print("Testing Y")
        setup_motor_current()
        bowtie_pattern(x_max, y_max)
        try:
            test_axis('Y', tolerance)
        except Exception as e:
            print("FAIL: {}".format(e))
        finally:
            robot._driver.home('Y')  # we tell it to home Y manually


def connect_to_port():
    parser = optparse.OptionParser(usage='usage: %prog [options] ')
    parser.add_option(
        "-p", "--p", dest="port", default='',
        type='str', help='serial port of the smoothie'
    )

    options, _ = parser.parse_args(args=None, values=None)
    if options.port:
        robot.connect(options.port)
    else:
        robot.connect()


def _exit_test():
    robot._driver._smoothie_reset()
    robot._driver._setup()
    robot._driver.disengage_axis('XYZABC')


if __name__ == '__main__':

    num_cycles = 3
    b_x_max = 417.2
    b_y_max = 320
    tolerance_mm = 0.5

    try:
        connect_to_port()
        robot.home()
        run_x_axis(num_cycles, b_x_max, b_y_max, tolerance_mm)
        run_y_axis(num_cycles, b_x_max, b_y_max, tolerance_mm)
        gpio.set_button_light(red=False, green=True, blue=False)
        print("PASS")
        _exit_test()
    except KeyboardInterrupt:
        print("Test Cancelled")
        robot._driver.turn_on_blue_button_light()
    except Exception as e:
        robot._driver.turn_on_red_button_light()
        print("FAIL: {}".format(e))
        _exit_test()
