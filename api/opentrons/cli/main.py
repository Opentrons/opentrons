#!/usr/bin/env python

# pylama:ignore=C901

import asyncio
import urwid
from numpy.linalg import inv
from numpy import dot, array, insert
from opentrons import robot, instruments
from opentrons.robot import robot_configs
from opentrons.util.calibration_functions import probe_instrument
from solve import solve

pipette = instruments.Pipette(mount='right')

# Distance increments for jog
steps = [0.1, 0.25, 0.5, 1, 5, 10, 20, 40, 80]
# Index of selected step
step_index = 2

SAFE_HEIGHT = 130

left = 'Z'
right = 'A'
current_pipette = right

status_text = urwid.Text('')
current_position = (0, 0, 0)

# 200uL tip. Used during calibration process
# The actual calibration represents end of a pipette
# without tip on
TIP_LENGTH = 51.7

# Reference point being calibrated
point_number = 0

# (0, 0) is in bottom-left corner
# Expected reference points
expected = [
    (108.75, 92.8),       # dimple 4
    (373.75, 92.8),      # dimple 6
    (241.25, 273.80)    # dimple 11
]

# Actuals get overridden when ENTER is pressed
actual = [(0, 0)] * 3

# Accessible through 1,2,3 ... keyboard keys to test
# calibration by moving to known locations
test_points = [(x, y, TIP_LENGTH) for x, y in expected] + \
    [
        (132.50, 90.50, TIP_LENGTH),        # Slot 5
        (332.13, 47.41, TIP_LENGTH),        # Corner of 3
        (190.65, 227.57, TIP_LENGTH),       # Corner of 8
        (330.14, 222.78, TIP_LENGTH),       # Corner of 9
    ]


T = robot.config.gantry_calibration
XY = None

# 3rd row, 4th column corresponds to Z-shift in
# heterogeneous 4x4 matrix T
Z_OFFSET = T[2][3]


# Add fixed Z offset which is known so we don't have to calibrate for height
# during calibration process
def add_z(XY):
    return insert(
        insert(XY, 2, [0, 0, 0], axis=1),
        2,
        [0, 0, 1, Z_OFFSET],
        axis=0)


def current_step():
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


def status(text):
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

    status_text.set_text(text)


def jog(axis, direction, step):
    global current_position
    robot._driver.move({axis: robot._driver.position[axis] + direction * step})
    current_position = position()
    status('Jog: ' + repr([axis, str(direction), str(step)]))


key_mappings = {
    'q': lambda: jog(current_pipette, +1, current_step()),
    'a': lambda: jog(current_pipette, -1, current_step()),
    'up': lambda: jog('Y', +1, current_step()),
    'down': lambda: jog('Y', -1, current_step()),
    'left': lambda: jog('X', -1, current_step()),
    'right': lambda: jog('X', +1, current_step()),
}


def key_pressed(key):
    global current_position, current_pipette, step_index, \
        point_number, XY, T

    if key == 'z':
        current_pipette = left if current_pipette == right else right
        status('current pipette axis: ' + repr(current_pipette))
    elif key.isnumeric():
        validate(int(key) - 1)
    # less travel
    elif key == '-':
        if step_index > 0:
            step_index -= 1
        status('step: ' + repr(current_step()))
    # more travel
    elif key == '=':
        if step_index < len(steps) - 1:
            step_index += 1
        status('step: ' + repr(current_step()))
    # skip calibration point
    elif key == 's':
        if (point_number < len(actual) - 1):
            point_number += 1
        status('skipped #{0}'.format(point_number))
    # run tip probe
    elif key == 'p':
        probe_center = probe_instrument(pipette, robot)
        robot.config = robot.config._replace(
            probe_center=probe_center
        )
        status('Tip probe')
    # save calibration point and move to next
    elif key == 'enter':
        actual[point_number] = position()[:-1]
        if (point_number < len(actual) - 1):
            point_number += 1

        # On last point update gantry calibration
        if point_number == 3:
            XY = solve(expected, actual)
            T = add_z(XY)
            robot.config = robot.config._replace(
                    gantry_calibration=T,
                )

        status('saved #{0}: {1}'.format(point_number, actual[point_number]))
    # move to previous calibration point
    elif key == 'backspace':
        if (point_number > 0):
            point_number -= 1
        status('')
    # home
    elif key == '\\':
        robot.home()
        current_position = position()
        status('Homed')
    # calculate transformation matrix
    elif key == 'esc':
        raise urwid.ExitMainLoop
    elif key == ' ':
        try:
            diff = robot_configs.save(robot.config)
            status('Saved')
        except Exception as e:
            status(repr(e))
        else:
            status(str(diff))
    else:
        try:
            key_mappings[key]()
        except KeyError:
            status('invalid key: ' + repr(key))


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


def main():
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
    status('Hello!')
    ui_loop.run()

    print('Robot config: \n', robot.config)


if __name__ == "__main__":
    main()
