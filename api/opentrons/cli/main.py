#!/usr/bin/env python

# pylama:ignore=C901

# erase previous calibration file before opentrons.robot instantiates
import asyncio
import urwid
import atexit
import os
import sys
from numpy.linalg import inv
from numpy import dot, array
from opentrons.robot import robot_configs
from opentrons import robot, instruments
from opentrons.util.calibration_functions import probe_instrument
from opentrons.cli.linal import solve, add_z


# Distance increments for jog
steps = [0.1, 0.25, 0.5, 1, 5, 10, 20, 40, 80]
# Index of selected step
step_index = 2

SAFE_HEIGHT = 130

left = 'Z'
right = 'A'
current_pipette = right

status_text = urwid.Text('')  # type 'urwid.Text'
current_position = (0, 0, 0)

# 200uL tip. Used during calibration process
# The actual calibration represents end of a pipette
# without tip on
TIP_LENGTH = 51.7

# Reference point being calibrated
point_number = -1

# (0, 0) is in bottom-left corner

slot_1_lower_left = (12.13, 6.0)
slot_3_lower_right = (380.87, 6.0)
slot_10_upper_left = (12.13, 351.5)
expected_dots = [
    slot_1_lower_left,
    slot_3_lower_right,
    slot_10_upper_left
]

# for machines that cannot reach the calibration dots, use the screw holes
slot_4_screw_hole = (108.75, 92.8)
slot_6_screw_hole = (373.75, 92.8)
slot_11_screw_hole = (241.25, 273.80)
expected_holes = [
    slot_4_screw_hole,
    slot_6_screw_hole,
    slot_11_screw_hole
]

# Expected reference points
expected = []
test_points = []

# Actuals get overridden when ENTER is pressed
actual = [(0, 0)] * 3

T = robot.config.gantry_calibration
XY = None


def generate_test_points():
    global test_points, expected_dots, expected_holes, expected
    # Beta machines cannot reach deck points, use the screw holes instead
    beta_message = 'Are you running a Beta machine? (y/n)'
    res = input(beta_message)
    if 'y' in res.lower():
        expected = expected_holes
    else:
        expected = expected_dots
    # Accessible through 1,2,3 ... keyboard keys to test
    # calibration by moving to known locations
    test_points = [(x, y, TIP_LENGTH) for x, y in expected] + \
        [
            (132.50, 90.50, TIP_LENGTH),        # Slot 5
            (332.13, 47.41, TIP_LENGTH),        # Corner of 3
            (190.65, 227.57, TIP_LENGTH),       # Corner of 8
            (330.14, 222.78, TIP_LENGTH),       # Corner of 9
        ]


def current_step() -> float:
    """
    Given current step index return step value in mm
    """
    return steps[step_index]


def position():
    """
    Read position from driver into a tuple and map 3-rd value
    to the axis of a pipette currently used
    """
    try:
        p = robot._driver.position
        res = (p['X'], p['Y'], p[current_pipette.upper()])
    except KeyError:
        # for some reason we are sometimes getting
        # key error in dict returned from driver
        pass
    else:
        return res


def status(text_box: urwid.Text, text: str):
    """
    Refresh status in a text box
    """

    points = '\n'.join([
        # Highlight point being calibrated
        ('* ' if point_number == point else '') + "{0} {1}"
        # Display actual and expected coordinates
        .format(coord[0], coord[1])
        for point, coord in enumerate(zip(actual, expected))
    ])

    text = '\n'.join([
        points,
        'Smoothie: {0}'.format(current_position),
        'World: {0}'.format(tuple(dot(inv(T), list(current_position) + [1])[:-1])),  # NOQA
        'Step: {0}'.format(current_step()),
        'Current stage: ' + current_pipette,
        'Message: ' + text
    ])

    text_box.set_text(text)


def jog(axis, direction, step):
    global current_position
    robot._driver.move({axis: robot._driver.position[axis] + direction * step})
    current_position = position()
    status(status_text, 'Jog: ' + repr([axis, str(direction), str(step)]))


key_mappings = {
    'q': lambda: jog(current_pipette, +1, current_step()),
    'a': lambda: jog(current_pipette, -1, current_step()),
    'up': lambda: jog('Y', +1, current_step()),
    'down': lambda: jog('Y', -1, current_step()),
    'left': lambda: jog('X', -1, current_step()),
    'right': lambda: jog('X', +1, current_step()),
}


def key_pressed(key):
    global current_position, current_pipette, step_index, point_number, XY, T

    if key == 'z':
        current_pipette = left if current_pipette == right else right
        status(status_text, 'current pipette axis: ' + repr(current_pipette))
    elif key.isnumeric():
        validate(int(key) - 1)
    # less travel
    elif key == '-':
        if step_index > 0:
            step_index -= 1
        status(status_text, 'step: ' + repr(current_step()))
    # more travel
    elif key == '=':
        if step_index < len(steps) - 1:
            step_index += 1
        status(status_text, 'step: ' + repr(current_step()))
    # skip calibration point
    elif key == 's':
        if (point_number < len(actual) - 1):
            point_number += 1
        status(status_text, 'skipped #{0}'.format(point_number))
    # run tip probe
    elif key == 'p':

        robot.reset()

        pipette = instruments.Pipette(mount='right', channels=1)
        probe_center = tuple(probe_instrument(
            pipette, robot, tip_length=TIP_LENGTH))
        robot.config = robot.config._replace(
            probe_center=probe_center
        )
        status(status_text, 'Tip probe')
    # save calibration point and move to next
    elif key == 'enter':
        if point_number >= len(actual):
            return

        if point_number < 0:
            actual_z = position()[-1]
            expected_z = T[2][3] + TIP_LENGTH
            T[2][3] += actual_z - expected_z
            point_number += 1
            status(status_text, 'saved Z-Offset: {0}'.format(T[2][3]))
            return

        actual[point_number] = position()[:-1]
        point_number += 1
        status(status_text, 'saved #{0}: {1}'.format(
            point_number, actual[point_number-1]))

        # On last point update gantry calibration
        if point_number == len(actual):
            XY = solve(expected, actual)
            T = add_z(XY, T[2][3])
            robot.config = robot.config._replace(
                    gantry_calibration=list(map(lambda i: list(i), T)),
                )
            status(status_text, str(robot.config))

    # move to previous calibration point
    elif key == 'backspace':
        if point_number > 0:
            point_number -= 1
        status(status_text, '')
    # home
    elif key == '\\':
        robot.home()
        current_position = position()
        status(status_text, 'Homed')
    # calculate transformation matrix
    elif key == 'esc':
        raise urwid.ExitMainLoop
    elif key == ' ':
        try:
            diff = robot_configs.save(robot.config)
            status(status_text, 'Saved')
        except Exception as e:
            status(status_text, repr(e))
        else:
            status(status_text, str(diff))
    else:
        try:
            key_mappings[key]()
        except KeyError:
            status(status_text, 'invalid key: ' + repr(key))


# move to test points based on current matrix value
def validate(index):
    v = array(list(test_points[index]) + [1])
    x, y, z, _ = dot(inv(T), list(position()) + [1])

    if z < SAFE_HEIGHT:
        _, _, z, _ = dot(T, [x, y, SAFE_HEIGHT, 1])
        robot._driver.move({current_pipette: z})

    x, y, z, _ = dot(T, v)
    robot._driver.move({'X': x, 'Y': y})
    robot._driver.move({current_pipette: z})


def clear_configuration_and_reload():
    robot_configs.clear()
    robot.config = robot_configs.load()
    robot.reset()


def backup_configuration_and_reload(tag=None):
    from datetime import datetime
    if not tag:
        tag = datetime.now().isoformat(timespec="seconds")
    robot_configs.save(robot.config, tag=tag)
    clear_configuration_and_reload()


def main():
    prompt = input(
        ">>> Warning! Running this tool backup and clear any previous calibration data. Proceed (y/[n])? ")  # NOQA
    if prompt not in ['y', 'Y', 'yes']:
        print('Exiting--prior configuration data not changed')
        sys.exit()
    backup_configuration_and_reload()

    generate_test_points()

    robot.connect()
    tip = urwid.Text(u"X/Y/Z: left,right/up,down/q,a; Pipette (swap): z; Steps: -/=; Test points: 1, 2, 3")   # NOQA
    pile = urwid.Pile([tip, status_text])
    root = urwid.Filler(pile, 'top')
    event_loop = urwid.main_loop.AsyncioEventLoop(
        loop=asyncio.get_event_loop()
    )
    ui_loop = urwid.MainLoop(
        root,
        handle_mouse=False,
        unhandled_input=key_pressed,
        event_loop=event_loop)
    status(status_text, 'Hello!')
    ui_loop.run()

    print('Robot config: \n', robot.config)


def notify_and_restart():
    print('Exiting configuration tool and restarting system')
    os.system("kill 1")


if __name__ == "__main__":
    # Register hook to reboot the robot after exiting this tool (regardless of
    # whether this process exits normally or not)
    atexit.register(notify_and_restart)

    main()
