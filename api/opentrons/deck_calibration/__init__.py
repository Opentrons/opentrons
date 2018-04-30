from opentrons import robot
from opentrons.robot.robot import Robot

# Application constants
SAFE_HEIGHT = 130

left = 'Z'
right = 'A'

dots = 'dots'
holes = 'holes'

# Indicies into calibration matrix
xyz_column = 3
x_row = 0
y_row = 1
z_row = 2


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


def set_calibration_value(rbt: Robot, axis: str, value: float):
    if axis is 'x':
        row = x_row
    elif axis is 'y':
        row = y_row
    else:
        row = z_row
    rbt.config.gantry_calibration[row][xyz_column] = value


def apply_mount_offset(point: tuple) -> tuple:
    px, py, pz = point
    mx, my, mz = robot.config.mount_offset
    return (px - mx, py - my, pz - mz)
