from opentrons.config import feature_flags as ff
from opentrons import types

# Application constants
SAFE_HEIGHT = 100

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
    to the axis of a pipette currently used.

    The critical point takes into account the model offset of a given pipette.
    """
    p = hardware.gantry_position(axis, critical_point=cp, refresh=True)
    return (p.x, p.y, p.z)


def jog(axis, direction, step, hardware, mount, cp=None):
    if axis == mount:
        axis = 'z'
    pt = types.Point(**{axis.lower(): direction*step})
    hardware.move_rel(mount, pt)
    return position(mount, hardware, cp)
