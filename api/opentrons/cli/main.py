#!/usr/bin/env python

import asyncio
import urwid
from numpy.linalg import inv
from numpy import dot, array, insert
from opentrons.drivers.smoothie_drivers.v3_0_0.driver_3_0 import SmoothieDriver_3_0_0  # NOQA
from translate import solve

driver = SmoothieDriver_3_0_0()

# Distance increments for jog
steps = [0.25, 0.5, 1, 5, 10, 20, 40, 80]
# Index of selected step
step_index = 2


left = 'z'
right = 'a'
current_pipette = right

status_text = urwid.Text('')
<<<<<<< HEAD
current_position = (0, 0, 0)

# 200uL tip. Used during calibration process
# The actual calibration represents end of a pipette
# without tip on
TIP_LENGTH = 46
# Smoothie Z value when Deck's Z=0
Z_OFFSET = 45
=======
>>>>>>> functioning calibration cli

# Reference point being calibrated
point_number = 0

<<<<<<< HEAD
# (0, 0) is in bottom-left corner
# Expected reference points
expected = [
    (64.0, -2.5 + 90.5),        # 4
    (329.16, -2.5 + 90.5),      # 6
    (196.58, 274.0)             # 11
]

# Expected
# Updated during calibration process when you press ENTER
# Default values don't matter and get overridden when ENTER is pressed
actual = [
    (-301.00000021211997, -300.50000034319999),
    (230.99999983788001, -297.5000003477),
    (228.66666650148005, 66.499998972299977),
]

# Accessible through 1,2,3 ... keyboard keys to test
# calibration by moving to known locations
test_points = [
    (64.0, -2.5 + 90.5, TIP_LENGTH),            # 4
    (329.16, -2.5 + 90.5, TIP_LENGTH),          # 6
    (196.58, 274.0, TIP_LENGTH),                # 11
    (196.58, -2.5 + 90.5, TIP_LENGTH+127.8)     # 5?
]

# World > Smoothie XY-plane transformation
# Gets updated when you press SPACE after calibrating all points
# You can also default it to the last known good calibration
# if you want to test points or to measure real-world objects
# using the tool
XY = \
    array([[  2.00633580e+00,   1.16263441e-02,  -4.51928609e+02],
           [ -3.34703575e-03,   1.95997984e+00,  -3.65876516e+02],
           [ -4.83204440e-19,   1.73472348e-18,   1.00000000e+00]])

# Add fixed Z offset which is known so we don't have to calibrate for height
# during calibration process
T = insert(
        insert(XY, 2, [0, 0, 0], axis=1),
        2,
        [0, 0, 1, Z_OFFSET],
        axis=0)


def step():
    """
    Given current step index return step value in mm
    """
=======
# Top-left
# expected = [
#     (64,    354.70),  # 1
#     (329,   354.70),  # 3
#     (196.50, 83.70),  # 11
# ]


# (0, 0) in bottom-left
expected = [
    (64.0, 2.30),       # 1
    (329.0, 2.30),      # 3
    (196.50, 273.80)    # 11
]

# Has X, Y only. To be able to calculate Z
# we need known points of variable height.
# Deck's zero Z is Smoothie's 140.0
actual = [
    (33.0, 5.25),
    (298.0, 6.25),
    (169.5, 276.0),
]

# These correspond to sharp edge
# of machined numbers on the deck
# to test translation accuracy.
test_points = [
    (332.13, 47.41),   # 3
    (190.65, 227.57),  # 8
    (330.14, 222.78)   # 9
]

# T * World = Smoothie
T = \
    array([[1.00094340e+00,   1.33517495e-02,  -3.10910864e+01],
           [2.83018868e-03,   9.95856354e-01,   2.27839831e+00],
           [8.67361738e-19,   1.60461922e-17,   1.00000000e+00]])

# To showcase what uncalibrated robot looks like
# T = \
#     array([[1.0,  0.0,  0.0],
#            [0.0,  1.0,  0.0],
#            [0.0,  0.0,  1.0]])


def step():
>>>>>>> functioning calibration cli
    return steps[step_index]


def position():
<<<<<<< HEAD
    """
    Read position from driver into a tuple and map 3-rd value
    to the axis of a pipette currently used
    """
=======
>>>>>>> functioning calibration cli
    while True:
        try:
            p = driver.position
            res = (p['x'], p['y'], p[current_pipette])
        except KeyError:
            # for some reason we are sometimes getting
            # key error in dict returned from driver
            pass
        else:
            return res


def status(text):
<<<<<<< HEAD
    """
    Refresh status in a text box
    """

    points = '\n'.join([
        # Highlight point being calibrated
        ('* ' if point_number == point else '') + "{0} {1}"
        # Display actual and expected coordinates
=======
    points = '\n'.join([
        ('* ' if point_number == point else '') + "{0} {1}"
>>>>>>> functioning calibration cli
        .format(coord[0], coord[1])
        for point, coord in enumerate(zip(actual, expected))
    ])

    text = '\n'.join([
        points,
<<<<<<< HEAD
        'Smoothie: {0}'.format(current_position),
        'World: {0}'.format(tuple(dot(inv(T), list(current_position) + [1])[:-1])),  # NOQA
=======
        'Position: {0}'.format(position()),
>>>>>>> functioning calibration cli
        'Step: {0}'.format(step()),
        'Current stage: ' + current_pipette,
        'Message: ' + text
    ])

    status_text.set_text(text)


def jog(axis, direction, step):
<<<<<<< HEAD
    global current_position
    driver.move(**{axis: driver.position[axis] + direction * step})
    current_position = position()
=======
    driver.move(**{axis: driver.position[axis] + direction * step})
>>>>>>> functioning calibration cli
    status('Jog: ' + repr([axis, str(direction), str(step)]))

key_mappings = {
    'q': lambda: jog(current_pipette, +1, step()),
    'a': lambda: jog(current_pipette, -1, step()),
    'up': lambda: jog('y', +1, step()),
    'down': lambda: jog('y', -1, step()),
    'left': lambda: jog('x', -1, step()),
    'right': lambda: jog('x', +1, step()),
}


def key_pressed(key):
<<<<<<< HEAD
    global current_position, current_pipette, step_index, point_number, T
=======
    global current_pipette, step_index, point_number, T
>>>>>>> functioning calibration cli

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
        status('step: ' + repr(step()))
    # more travel
    elif key == '=':
        if step_index < len(steps) - 1:
            step_index += 1
        status('step: ' + repr(step()))
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
        driver.home('bcx')
        driver.home()
<<<<<<< HEAD
        current_position = position()
        status('Homed')
    # calculate transformation matrix
    elif key == ' ':
        try:
            XY = solve(expected, actual)
        except Exception as e:
            status(repr(e))
        else:
            status(repr(XY))
=======
    # calculate transformation matrix
    elif key == ' ':
        try:
            T = solve(expected, actual)
        except Exception as e:
            status(repr(e))
        else:
            status(repr(T))
>>>>>>> functioning calibration cli
    else:
        try:
            key_mappings[key]()
        except KeyError:
            status('invalid key: ' + repr(key))


<<<<<<< HEAD
# move to test points based on current matrix value
def validate(index):
    v = array(list(test_points[index]) + [1])
    x, y, z, _ = dot(inv(T), list(position()) + [1])

    safe_height = 130

    if z < safe_height:
        _, _, z, _ = dot(T, [x, y, safe_height, 1])
        driver.move(**{current_pipette: z})

    x, y, z, _ = dot(T, v)
    driver.move(**{'x': x, 'y': y})
    driver.move(**{current_pipette: z})
=======
# move to test points based on T value
def validate(index):
    v = array(list(test_points[index]) + [1])
    x, y, _ = dot(T, v)
    _, _, z = position()
    if z < 170:
        jog(current_pipette, +1, 30)
    driver.move(**{'x': x, 'y': y})
    driver.move(**{current_pipette: 140})
>>>>>>> functioning calibration cli


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
        unhandled_input=key_pressed,
        event_loop=event_loop)
    status('Hello!')
    ui_loop.run()


if __name__ == "__main__":
    main()
