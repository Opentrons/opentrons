from numpy import array

from opentrons.trackers.pose_tracker import (
    update, Point, change_base
)
from opentrons.robot import robot_configs
from opentrons.data_storage import database
from opentrons.trackers.pose_tracker import absolute


# The X and Y switch offsets are to position relative to the *opposite* axes
# during calibration, to make the tip hit the raised end of the switch plate,
# which requires less pressure to activate. E.g.: when probing in the x
# direction, the tip will be moved by X_SWITCH_OFFSET in the y axis, and when
# probing in y, it will be adjusted by the Y_SWITCH_OFFSET in the x axis.
# When probing in z, it will be adjusted by the Z_SWITCH_OFFSET in the y axis.
X_SWITCH_OFFSET_MM = 2.0
Y_SWITCH_OFFSET_MM = 5.0
Z_SWITCH_OFFSET_MM = 5.0

Z_DECK_CLEARANCE = 15.0
Z_PROBE_CLEARANCE = 5.0
Z_PROBE_START_CLEARANCE = 20

BOUNCE_DISTANCE_MM = 5.0

SWITCH_CLEARANCE = 7.5  # How far to move outside the probe box before probing
Z_CROSSOVER_CLEARANCE = Z_PROBE_CLEARANCE + 30  # Z mm between tip and probe


def calibrate_container_with_delta(
        pose_tree, container, delta_x,
        delta_y, delta_z, save, new_container_name=None
):
    delta = Point(delta_x, delta_y, delta_z)
    new_coordinates = change_base(
        pose_tree,
        src=container,
        dst=container.parent) + delta
    pose_tree = update(pose_tree, container, new_coordinates)
    container._coordinates = container._coordinates + delta
    if save and new_container_name:
        database.save_new_container(container, new_container_name)
    elif save:
        database.overwrite_container(container)
    return pose_tree


def probe_instrument(instrument, robot, tip_length=None) -> Point:
    robot.home()

    if tip_length is None:
        tip_length = robot.config.tip_length[instrument.mount][instrument.type]
    instrument._add_tip(tip_length)

    # probe_dimensions is the external bounding box of the probe unit
    size_x, size_y, size_z = robot.config.probe_dimensions
    # probe_center is the point at the center of the switch pcb
    center = Point(*robot.config.probe_center)

    rel_x_start = (size_x / 2) + SWITCH_CLEARANCE
    rel_y_start = (size_y / 2) + SWITCH_CLEARANCE

    # Ensure that the nozzle will clear the probe unit and tip will clear deck
    nozzle_safe_z = (size_z - tip_length) + Z_PROBE_CLEARANCE
    rel_z_start = center.z - max(Z_DECK_CLEARANCE, nozzle_safe_z)

    # Each list item defines axis we are probing for, starting position vector
    # relative to probe top center and travel distance
    hot_spots = [
        ('x',       -rel_x_start, X_SWITCH_OFFSET_MM,            -rel_z_start,  size_x),  # NOQA
        ('x',        rel_x_start, X_SWITCH_OFFSET_MM,            -rel_z_start, -size_x),  # NOQA
        ('y', Y_SWITCH_OFFSET_MM,       -rel_y_start,            -rel_z_start,  size_y),  # NOQA
        ('y', Y_SWITCH_OFFSET_MM,        rel_y_start,            -rel_z_start, -size_y),  # NOQA
        ('z',                0.0, Z_SWITCH_OFFSET_MM, Z_PROBE_START_CLEARANCE, -size_z)   # NOQA
    ]

    acc = []

    safe_height = center.z + Z_CROSSOVER_CLEARANCE

    robot.poses = instrument._move(robot.poses, z=safe_height)

    for axis, *probing_vector, distance in hot_spots:
        x, y, z = array(probing_vector) + center

        robot.poses = instrument._move(robot.poses, x=x, y=y)
        robot.poses = instrument._move(robot.poses, z=z)

        axis_index = 'xyz'.index(axis)
        robot.poses = instrument._probe(robot.poses, axis, distance)

        # Tip position is stored in accumulator and averaged for each axis
        # to be used for more accurate positioning for the next axis
        value = absolute(robot.poses, instrument)[axis_index]
        acc.append(value)

        # after probing two points along the same axis
        # average them out, update center and clear accumulator
        if len(acc) == 2:
            center = center._replace(**{axis: (acc[0] + acc[1]) / 2.0})
            acc.clear()

        # Bounce back to release end stop
        bounce = value + (BOUNCE_DISTANCE_MM * (-distance / abs(distance)))

        robot.poses = instrument._move(robot.poses, **{axis: bounce})
        robot.poses = instrument._move(robot.poses, z=safe_height)

    instrument._remove_tip(tip_length)

    return center


def update_instrument_config(instrument, measured_center) -> (Point, float):
    """
    Update config and pose tree with instrument's x and y offsets
    and tip length based on delta between probe center and measured_center,
    persist updated config and return it
    """
    from copy import deepcopy
    from opentrons.trackers.pose_tracker import update

    robot = instrument.robot
    config = robot.config
    instrument_offset = deepcopy(config.instrument_offset)

    dx, dy, dz = array(measured_center) - config.probe_center

    tip_length = deepcopy(config.tip_length)

    old_x, old_y, _ = instrument_offset[instrument.mount]
    # any Z offsets adjusts the tip length, so instruments have Z=0.0 offset
    new_offset = (old_x - dx, old_y - dy, 0.0)

    # remove the instrument model's designed offsets from the saved offset
    instrument_offset[instrument.mount] = new_offset
    tip_length[instrument.mount][instrument.type] = \
        tip_length[instrument.mount][instrument.type] + dz

    config = config \
        ._replace(instrument_offset=instrument_offset) \
        ._replace(tip_length=tip_length)
    robot.config = config

    robot_configs.save(config)

    mx, my, mz = instrument.model_offset
    new_absolute_pos = (mx + new_offset[0], my + new_offset[1], mz)
    robot.poses = update(robot.poses, instrument, new_absolute_pos)

    return instrument.robot.config


def move_instrument_for_probing_prep(instrument, robot):
    instrument.move_to(robot.deck['5'].top(150))


def jog_instrument(instrument, axis, robot, distance):
    robot.poses = instrument._jog(robot.poses, axis, distance)
