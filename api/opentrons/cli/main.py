#!/usr/bin/env python

# pylama:ignore=C901

import asyncio
import urwid
from numpy.linalg import inv
from numpy import dot, array, insert
from opentrons.drivers.smoothie_drivers.v3_0_0.driver_3_0 import SmoothieDriver_3_0_0  # NOQA
from solve import solve

driver = SmoothieDriver_3_0_0()

# Distance increments for jog
steps = [0.25, 0.5, 1, 5, 10, 20, 40, 80]
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
TIP_LENGTH = 47
# Smoothie Z value when Deck's Z=0
Z_OFFSET = 4.5

# Reference point being calibrated
point_number = 0

# (0, 0) is in bottom-left corner
# Expected reference points
expected = [
    (64.0, 92.8),       # dimple 4
    (329.0, 92.8),      # dimple 6
    (196.50, 273.80)    # dimple 11
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

# World > Smoothie XY-plane transformation
# Gets updated when you press SPACE after calibrating all points
# You can also default it to the last known good calibration
# if you want to test points or to measure real-world objects
# using the tool
XY = \
    array([[  1.00283019e+00,  -4.83425414e-03, -3.52323132e+01],
       [ -1.13207547e-02,   9.97237569e-01, -1.81761811e+00],
       [ -5.03305613e-19,   2.60208521e-18, 1.00000000e+00]])   # NOQA


# Add fixed Z offset which is known so we don't have to calibrate for height
# during calibration process
def add_z(XY):
    return insert(
        insert(XY, 2, [0, 0, 0], axis=1),
        2,
        [0, 0, 1, Z_OFFSET],
        axis=0)


T = add_z(XY)


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
        p = driver.position
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
    driver.move({axis: driver.position[axis] + direction * step})
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
    global current_position, current_pipette, step_index, point_number, XY, T

    if not isinstance(key, str):  # mouse clicked?
        return

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
    # save calibration point and move to next
    elif key == 'enter':
        actual[point_number] = position()[:-1]
        if (point_number < len(actual) - 1):
            point_number += 1
        status('saved #{0}: {1}'.format(point_number, actual[point_number]))
    # move to previous calibration point
    elif key == 'backspace':
        if (point_number > 0):
            point_number -= 1
        status('')
    # home
    elif key == '\\':
        driver.home('za')
        driver.home('x')
        driver.home()
        current_position = position()
        status('Homed')
    # calculate transformation matrix
    elif key == 'esc':
        raise urwid.ExitMainLoop
    elif key == ' ':
        try:
            XY = solve(expected, actual)
            T = add_z(XY)
        except Exception as e:
            status(repr(e))
        else:
            status(repr(XY))
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
        driver.move({current_pipette: z})

    x, y, z, _ = dot(T, v)
    driver.move({'X': x, 'Y': y})
    driver.move({current_pipette: z})


def main():
    driver.connect()
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

    print('Calibration data: \n', repr(T))


if __name__ == "__main__":
    main()
