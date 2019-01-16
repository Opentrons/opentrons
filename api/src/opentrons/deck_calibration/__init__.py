from opentrons.config import feature_flags as ff
from opentrons import types

# Application constants
SAFE_HEIGHT = 130

left = 'Z'
right = 'A'

dots = 'dots'
holes = 'holes'
crosses = 'crosses'

z_pos = (170.5, 129.0, 5.0)

mount_by_name = {'left': types.Mount.LEFT, 'right': types.Mount.RIGHT}
mount_by_axis = {'Z': types.Mount.LEFT, 'A': types.Mount.RIGHT}


def dots_set():
    """

    :param dot_flag: a boolean represented whether the feature flag is set
    or not (if dots_deck_type is set to True
    then it will utilize old calibration points)
    :return:  List of calibration coordinates
    """
    if ff.dots_deck_type():
        # Etched dots
        slot_1_lower_left = (12.13, 6.0)
        slot_3_lower_right = (380.87, 6.0)
        slot_7_upper_left = (12.13, 261.0)
    else:
        # Etched crosses
        slot_1_lower_left = (12.13, 9.0)
        slot_3_lower_right = (380.87, 9.0)
        slot_7_upper_left = (12.13, 258.0)

    return [slot_1_lower_left, slot_3_lower_right, slot_7_upper_left]


def cli_dots_set():
    """

    :param dot_flag: a boolean represented whether the feature flag is set
    or not (if dots_deck_type is set to True
    then it will utilize old calibration points)
    :return:  List of calibration coordinates
    """
    if ff.dots_deck_type():
        slot_1_lower_left = (12.13, 6.0)
        slot_3_lower_right = (380.87, 6.0)
        slot_10_upper_left = (12.13, 351.5)
    else:
        slot_1_lower_left = (12.13, 9.0)
        slot_3_lower_right = (380.87, 9.0)
        slot_10_upper_left = (12.13, 348.5)

    return [slot_1_lower_left, slot_3_lower_right, slot_10_upper_left]


# Indicies into calibration matrix
xyz_column = 3
x_row = 0
y_row = 1
z_row = 2


def position(axis, hardware):
    """
    Read position from driver into a tuple and map 3-rd value
    to the axis of a pipette currently used
    """
    if axis == 'A':
        mount = types.Mount.RIGHT
    else:
        mount = types.Mount.LEFT
    p = hardware.current_position(mount)
    return (p['X'], p['Y'], p['Z'])


def jog(axis, direction, step, hardware):
    hardware._driver.move(
        {axis: hardware._driver.position[axis] + direction * step})
    return position(axis, hardware)


def apply_mount_offset(point, hardware):
    px, py, pz = point
    mx, my, mz = hardware.config.mount_offset
    return (px - mx, py - my, pz - mz)
