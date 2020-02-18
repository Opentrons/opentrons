'''
Runs the XYZA axes for 24-hours, and every 10 cycles will test to see if
any of the axes have skipped by >0.5 mm

Run through an SSH session by calling with "nohup" to keep it running after
disconnecting the terminal

Example of calling this script:

    nohup python -m opentrons.tools.overnight_test &

'''

import time
import logging

from opentrons.tools import driver
from opentrons.drivers.smoothie_drivers.driver_3_0 import \
    SmoothieError, DEFAULT_AXES_SPEED
from opentrons.drivers.rpi_drivers import gpio


test_time_minutes = 24 * 60
start_time_minutes = int(time.time() / 60)

attempts_to_home = 1
too_many_attempts_to_home = 3

XY_TOLERANCE = 30
ZA_TOLERANCE = 10

AXIS_TEST_SKIPPING_TOLERANCE = 0.5

COORDS_MAX = {
    'X': driver.homed_position['X'] - XY_TOLERANCE,
    'Y': driver.homed_position['Y'] - XY_TOLERANCE,
    'Z': driver.homed_position['Z'] - ZA_TOLERANCE,
    'A': driver.homed_position['A'] - ZA_TOLERANCE,
}

COORDS_MIN = {
    'X': XY_TOLERANCE,
    'Y': XY_TOLERANCE,
    'Z': ZA_TOLERANCE,
    'A': ZA_TOLERANCE,
}

COORDS_MIDDLE = {
    'X': ((COORDS_MAX['X'] - COORDS_MIN['X']) / 2) + COORDS_MIN['X'],
    'Y': ((COORDS_MAX['Y'] - COORDS_MIN['Y']) / 2) + COORDS_MIN['Y'],
}

COORDS_HOURGLASS = [
    {'X': COORDS_MIN['X'], 'Y': COORDS_MIN['Y']},
    {'X': COORDS_MAX['X'], 'Y': COORDS_MIN['Y']},
    {'X': COORDS_MIN['X'], 'Y': COORDS_MAX['Y']},
    {'X': COORDS_MAX['X'], 'Y': COORDS_MAX['Y']}
]

COORDS_BOWTIE = [
    {'X': COORDS_MAX['X'], 'Y': COORDS_MIN['Y']},
    {'X': COORDS_MIN['X'], 'Y': COORDS_MAX['Y']},
    {'X': COORDS_MIN['X'], 'Y': COORDS_MIN['Y']},
    {'X': COORDS_MAX['X'], 'Y': COORDS_MAX['Y']}
]

COORDS_Z_STAGE = [
    {'X': COORDS_MIDDLE['X'], 'Y': COORDS_MIDDLE['Y']},
    {'Z': COORDS_MIN['Z'], 'A': COORDS_MIN['A']},
    {'Z': COORDS_MAX['Z'], 'A': COORDS_MAX['A']},
    {'Z': COORDS_MIN['Z'], 'A': COORDS_MIN['A']},
    {'Z': COORDS_MAX['Z'], 'A': COORDS_MAX['A']},
    {'Z': COORDS_MIN['Z'], 'A': COORDS_MIN['A']},
    {'Z': COORDS_MAX['Z'], 'A': COORDS_MAX['A']}
]


def setup_logging():
    # create logger with 'spam_application'
    logger = logging.getLogger('qc-test')
    logger.setLevel(logging.DEBUG)
    # create file handler which logs even debug messages
    fh = logging.FileHandler('qc-test.log')
    fh.setLevel(logging.DEBUG)
    # create console handler with a higher log level
    ch = logging.StreamHandler()
    ch.setLevel(logging.ERROR)
    # create formatter and add it to the handlers
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    fh.setFormatter(formatter)
    ch.setFormatter(formatter)
    # add the handlers to the logger
    logger.addHandler(fh)
    logger.addHandler(ch)
    logging.getLogger().handlers = [fh, ch]
    return logger


def attempt_movement(driver, logger, coords_list):
    driver.set_speed(DEFAULT_AXES_SPEED)
    for c in coords_list:
        try:
            driver.move(c)
        except SmoothieError:
            button_red()
            logger.exception('Failed movement: {}'.format(c))
            driver._reset_from_error()
            try:
                driver.update_position()
            except Exception:
                pass
            logger.info('Current Smoothie pos: {}'.format(driver.position))
            attempt_homing(driver, logger)


def attempt_homing(driver, logger):
    global attempts_to_home
    logger.info('Resetting Smoothieware...')
    driver._smoothie_reset()
    driver._setup()
    try:
        driver.home('XYZA')
    except SmoothieError:
        button_red()
        attempts_to_home += 1
        logger.exception('Failed homing')
        if attempts_to_home < too_many_attempts_to_home:
            logger.info('Attempting to home again...')
            attempt_homing(driver, logger)
            return
        else:
            raise RuntimeError(
                'Failed to home {} times, quitting the test'.format(
                    too_many_attempts_to_home))
    # if it succeeds, reset the counter to zero
    attempts_to_home = 0


def run_time_trial(driver, logger):
    global COORDS_HOURGLASS, COORDS_BOWTIE, COORDS_Z_STAGE
    while int(time.time() / 60) - start_time_minutes < test_time_minutes:
        for i in range(10):
            attempt_movement(
                driver, logger, (COORDS_HOURGLASS + COORDS_BOWTIE))
            attempt_movement(driver, logger, COORDS_Z_STAGE)
        test_all_axes(driver, logger)
        attempt_homing(driver, logger)
        # log a message, so we get confirmation that the test is still running
        logger.info('Test is still running :)')


def button_green():
    gpio.set_low(gpio.OUTPUT_PINS['RED_BUTTON'])
    gpio.set_high(gpio.OUTPUT_PINS['GREEN_BUTTON'])
    gpio.set_low(gpio.OUTPUT_PINS['BLUE_BUTTON'])


def button_red():
    gpio.set_high(gpio.OUTPUT_PINS['RED_BUTTON'])
    gpio.set_low(gpio.OUTPUT_PINS['GREEN_BUTTON'])
    gpio.set_low(gpio.OUTPUT_PINS['BLUE_BUTTON'])


def test_all_axes(driver, logger):
    driver.move(COORDS_MAX)
    for ax in ['Z', 'A', 'X', 'Y']:
        test_axis(driver, logger, ax)


def test_axis(driver, logger, axis):
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
    points = [
        expected_point - AXIS_TEST_SKIPPING_TOLERANCE,
        expected_point + AXIS_TEST_SKIPPING_TOLERANCE
    ]
    if axis == 'Y':
        driver.move({'X': driver.homed_position['X']})
    driver.push_speed()
    driver.set_speed(8)
    driver.update_position()
    try:
        driver.move({axis: points[0]})
    except SmoothieError:
        button_red()
        logger.error('Test Failed: Pressing {} too soon'.format(axis))
    if axis == 'Y':
        if driver.switch_state[axis] is not False:
            button_red()
            logger.error('Test Failed: Pressing {} too soon'.format(axis))
        else:
            driver.move({axis: points[1]})
            if driver.switch_state[axis] is not True:
                button_red()
                logger.error(
                    'Test Failed: Not hitting {} switch'.format(axis))
    else:
        try:
            driver.move({axis: points[1]})
            button_red()
            logger.error('Test Failed: Not hitting {} switch'.format(axis))
        except SmoothieError:
            pass  # hit the switch on purpose, so it's ok
    driver.set_speed(DEFAULT_AXES_SPEED)


if __name__ == '__main__':
    logger = setup_logging()
    logger.info('Starting 24-hours Test')
    try:
        button_green()
        attempt_homing(driver, logger)
        test_all_axes(driver, logger)
        run_time_trial(driver, logger)
    except Exception:
        button_red()
        logger.exception('Unexpected Error')
        exit()
    finally:
        logger.info('Exiting test')
        driver._smoothie_reset()
