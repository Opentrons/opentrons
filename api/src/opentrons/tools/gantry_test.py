"""

Gantry Test
This Test objective will test the Gantry at 85% motor current
with Max speed. This will result to a good assembly vs a bad assembly process.


Author: Carlos Fernandez
"""
import logging
from typing import TYPE_CHECKING

from opentrons.hardware_control.adapters import SynchronousAdapter
from opentrons.drivers.smoothie_drivers.driver_3_0 import \
    SmoothieError, DEFAULT_AXES_SPEED

if TYPE_CHECKING:
    from opentrons.drivers.smoothie_drivers.driver_3_0\
        import SmoothieDriver_3_0_0

from . import args_handler


def setup_motor_current(hardware: SynchronousAdapter,
                        driver: 'SmoothieDriver_3_0_0'):
    # only set the current, keeping all other settings at the driver's default
    driver.set_speed(DEFAULT_AXES_SPEED)
    x_current = hardware.config.high_current['X'] * 0.85
    y_current = hardware.config.high_current['Y'] * 0.85
    driver.set_active_current(
        {'X': x_current, 'Y': y_current})


def bowtie_pattern(X_max: float, Y_max: float,
                   driver: 'SmoothieDriver_3_0_0'):
    zero = 10
    offset = 5
    driver.move({'X': zero, 'Y': zero + offset})
    driver.move({'X': zero, 'Y': Y_max})
    driver.move({'X': X_max, 'Y': zero})
    driver.move({'X': X_max, 'Y': Y_max})


def hourglass_pattern(X_max: float, Y_max: float,
                      driver: 'SmoothieDriver_3_0_0'):
    zero = 10
    offset = 5
    driver.move({'X': zero, 'Y': zero + offset})
    driver.move({'X': X_max, 'Y': zero + offset})
    driver.move({'X': zero, 'Y': Y_max})
    driver.move({'X': X_max, 'Y': Y_max})


def test_axis(axis: str, tolerance: float,
              driver: 'SmoothieDriver_3_0_0'):
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
    expected_point = driver.homed_position[axis] + retract
    points = [expected_point - tolerance, expected_point + tolerance]
    # expected_point = home_position + retract
    # safe distance from switch?
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


def run_x_axis(
        cycles: int, x_max: float, y_max: float, tolerance: float,
        hardware: SynchronousAdapter, driver: 'SmoothieDriver_3_0_0'):
    # Test X Axis
    for cycle in range(cycles):
        print("Testing X")
        setup_motor_current(hardware, driver)
        hourglass_pattern(x_max, y_max, driver)
        try:
            test_axis('X', tolerance, driver)
        except Exception as e:
            print("FAIL: {}".format(e))


def run_y_axis(cycles: int, x_max: float, y_max: float, tolerance: float,
               hardware: SynchronousAdapter, driver: 'SmoothieDriver_3_0_0'):
    # Test Y Axis
    for cycle in range(cycles):
        print("Testing Y")
        setup_motor_current(hardware, driver)
        bowtie_pattern(x_max, y_max, driver)
        try:
            test_axis('Y', tolerance, driver)
        except Exception as e:
            print("FAIL: {}".format(e))
        finally:
            driver.home('Y')  # we tell it to home Y manually


def _exit_test(driver: 'SmoothieDriver_3_0_0'):
    driver._smoothie_reset()
    driver._setup()
    driver.disengage_axis('XYZABC')


if __name__ == '__main__':
    parser = args_handler.root_argparser(
        "run tests checking the assembly of the OT-2's gantry")
    args = parser.parse_args()
    hardware, driver = args_handler.build_driver(args.port)
    num_cycles = 3
    b_x_max = 417.2
    b_y_max = 320
    tolerance_mm = 0.5
    logging.basicConfig(filename='gantry-test.log')
    try:
        hardware.home()
        run_x_axis(num_cycles, b_x_max, b_y_max, tolerance_mm,
                   hardware, driver)
        run_y_axis(num_cycles, b_x_max, b_y_max, tolerance_mm,
                   hardware, driver)
        driver.turn_on_green_button_light()
        print("PASS")
        _exit_test(driver)
    except KeyboardInterrupt:
        print("Test Cancelled")
        driver.turn_on_blue_button_light()
    except Exception as e:
        driver.turn_on_red_button_light()
        print("FAIL: {}".format(e))
        _exit_test(driver)
