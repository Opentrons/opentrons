from opentrons import robot
from opentrons.robot.robot import Robot

# Application constants
SAFE_HEIGHT = 130

left = 'Z'
right = 'A'

dots = 'dots'
holes = 'holes'


def position(axis: str):
    """
    Read position from driver into a tuple and map 3-rd value
    to the axis of a pipette currently used
    """
    p = robot._driver.position
    return (p['X'], p['Y'], p[axis.upper()])


def jog(axis, direction, step):

    robot._driver.move(
        {axis: robot._driver.position[axis] + direction * step})

    return position(axis)


def get_z(rbt: Robot) -> float:
    return rbt.config.gantry_calibration[2][3]


def set_z(rbt: Robot, value: float):
    rbt.config.gantry_calibration[2][3] = value
