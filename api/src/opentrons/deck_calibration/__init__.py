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


def position(axis, hardware, cp=None):
    """
    Read position from driver into a tuple and map 3-rd value
    to the axis of a pipette currently used
    """

    if not ff.use_protocol_api_v2():
        p = hardware._driver.position
        return (p['X'], p['Y'], p[axis])
    else:
        p = hardware.gantry_position(axis, critical_point=cp)
        return (p.x, p.y, p.z)


def jog(axis, direction, step, hardware, mount, cp=None):
    if not ff.use_protocol_api_v2():
        if axis == 'z':
            if mount == 'left':
                axis = 'Z'
            elif mount == 'right':
                axis = 'A'

        hardware._driver.move(
            {axis.upper():
                hardware._driver.position[axis.upper()] + direction * step})
        return position(axis.upper(), hardware)
    else:
        if axis == mount:
            axis = 'z'
        pt = types.Point(**{axis.lower(): direction*step})
        hardware.move_rel(mount, pt)
        return position(mount, hardware, cp)


def apply_mount_offset(point, hardware):
    px, py, pz = point
    mx, my, mz = hardware.config.mount_offset
    return (px - mx, py - my, pz - mz)
