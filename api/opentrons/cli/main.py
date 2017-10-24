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
current_position = (0, 0, 0)

# 200uL tip. Used during calibration process
# The actual calibration represents end of a pipette
# without tip on
TIP_LENGTH = 46
# Smoothie Z value when Deck's Z=0
current_position = (0, 0, 0)
Z_OFFSET = 3.75

# Reference point being calibrated
point_number = 0

# (0, 0) is in bottom-left corner
# Expected reference points
# v0
# expected = [
#     (64.0, -2.5 + 90.5),        # 4
#     (329.16, -2.5 + 90.5),      # 6
#     (196.58, 274.0)             # 11
# ]
expected = [
    (64.0, 92.8),       # 1
    (329.0, 92.8),      # 3
    (196.50, 273.80)    # 11
]
# Expected
# Updated during calibration process when you press ENTER
# Default values don't matter and get overridden when ENTER is pressed
actual = [
    (33.0, 5.25),
    (298.0, 6.25),
    (169.5, 276.0),
]
# Accessible through 1,2,3 ... keyboard keys to test
# calibration by moving to known locations
test_points = [
    (64.0, 92.8, TIP_LENGTH),            # 4
    (329.0, 92.8, TIP_LENGTH),          # 6
    (196.50, 183.30, TIP_LENGTH),                # 11
    (196.50, 273.80, TIP_LENGTH+127.8)     # 5?
]

# World > Smoothie XY-plane transformation
# Gets updated when you press SPACE after calibrating all points
# You can also default it to the last known good calibration
# if you want to test points or to measure real-world objects
# using the tool
XY = \
    array([[  9.98113208e-01,  -5.52486188e-03,  -3.46165381e+01],
           [ -3.77358491e-03,   1.00000000e+00,  -1.03084906e+01],
           [ -5.03305613e-19,   2.60208521e-18,   1.00000000e+00]])

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
    return steps[step_index]


def position():
    """
    Read position from driver into a tuple and map 3-rd value
    to the axis of a pipette currently used
    """
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
        'Step: {0}'.format(step()),
        'Current stage: ' + current_pipette,
        'Message: ' + text
    ])

    status_text.set_text(text)


def jog(axis, direction, step):
    global current_position
    driver.move(**{axis: driver.position[axis] + direction * step})
    current_position = position()
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
    global current_position, current_pipette, step_index, point_number, XY

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
        driver.home('x')
        driver.home()
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
    else:
        try:
            key_mappings[key]()
        except KeyError:
            status('invalid key: ' + repr(key))


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
