from opentrons import robot


# Application constants
SAFE_HEIGHT = 130

left = 'Z'
right = 'A'

dots = 'dots'
holes = 'holes'


def position(axis):
    """
    Read position from driver into a tuple and map 3-rd value
    to the axis of a pipette currently used
    """
    try:
        p = robot._driver.position
        res = (p['X'], p['Y'], p[axis.upper()])
    except KeyError:
        # for some reason we are sometimes getting
        # key error in dict returned from driver
        pass
    return res


def jog(axis, direction, step):

    robot._driver.move(
        {axis: robot._driver.position[axis] + direction * step})

    return position(axis)
