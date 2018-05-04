from numpy import array

from opentrons.trackers.pose_tracker import (
    update, Point, change_base
)
from opentrons.robot import robot_configs
from opentrons.data_storage import database
from opentrons.trackers.pose_tracker import absolute
from opentrons.config import feature_flags as ff

import logging

log = logging.getLogger(__name__)

# The X and Y switch offsets are to position relative to the *opposite* axes
# during calibration, to make the tip hit the raised end of the switch plate,
# which requires less pressure to activate. E.g.: when probing in the x
# direction, the tip will be moved by X_SWITCH_OFFSET in the y axis, and when
# probing in y, it will be adjusted by the Y_SWITCH_OFFSET in the x axis.
# When probing in z, it will be adjusted by the Z_SWITCH_OFFSET in the y axis.
X_SWITCH_OFFSET_MM = 2.0
Y_SWITCH_OFFSET_MM = 5.0
Z_SWITCH_OFFSET_MM = 5.0

Z_DECK_CLEARANCE = 5.0
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

    if ff.split_labware_definitions():
        for well in container.wells():
            well._coordinates = well._coordinates + delta
    else:
        container._coordinates = container._coordinates + delta

    if save and new_container_name:
        database.save_new_container(container, new_container_name)
    elif save:
        database.overwrite_container(container)
    return pose_tree


def probe_instrument(instrument, robot, tip_length=None) -> Point:

    if tip_length is None:
        tip_length = robot.config.tip_length[instrument.name]
    instrument._add_tip(tip_length)

    # probe_center is the point at the center of the switch pcb
    center = Point(*robot.config.probe_center)

    hot_spots = _calculate_hotspots(
        robot,
        tip_length,
        SWITCH_CLEARANCE,
        X_SWITCH_OFFSET_MM,
        Y_SWITCH_OFFSET_MM,
        Z_SWITCH_OFFSET_MM,
        Z_DECK_CLEARANCE,
        Z_PROBE_CLEARANCE,
        Z_PROBE_START_CLEARANCE)

    # The saved axis positions from limit switch response
    axis_pos = []

    safe_height = _calculate_safeheight(robot, Z_CROSSOVER_CLEARANCE)

    log.info("Moving to safe z: {}".format(safe_height))
    robot.poses = instrument._move(robot.poses, z=safe_height)

    for axis, x, y, z, distance in hot_spots:
        if axis == 'z':

            x = x + center.x
            y = y + center.y
            z = z + center.z
        else:
            x = x + center.x
            y = y + center.y

        log.info("Moving to {}".format((x, y, z)))
        robot.poses = instrument._move(robot.poses, x=x, y=y)
        robot.poses = instrument._move(robot.poses, z=z)

        axis_index = 'xyz'.index(axis)
        robot.poses = instrument._probe(robot.poses, axis, distance)

        # Tip position is stored in accumulator and averaged for each axis
        # to be used for more accurate positioning for the next axis
        value = absolute(robot.poses, instrument)[axis_index]
        axis_pos.append(value)

        # after probing two points along the same axis
        # average them out, update center and clear accumulator
        # except Z, we're only probing that once
        if axis == 'z':
            center = center._replace(**{axis: axis_pos[0]})
            axis_pos.clear()
        elif len(axis_pos) == 2:
            center = center._replace(**{axis:
                                        (axis_pos[0] + axis_pos[1]) / 2.0})

            axis_pos.clear()

        log.debug("Current axis positions for {}: {}".format(axis, axis_pos))

        # Bounce back to release end stop
        bounce = value + (BOUNCE_DISTANCE_MM * (-distance / abs(distance)))

        robot.poses = instrument._move(robot.poses, **{axis: bounce})
        robot.poses = instrument._move(robot.poses, z=safe_height)

        log.debug("Updated center point tip probe {}".format(center))

    instrument._remove_tip(tip_length)

    return center


def _calculate_hotspots(
        robot,
        tip_length,
        switch_clearance,
        x_switch_offset,
        y_switch_offset,
        z_switch_offset,
        deck_clearance,
        z_probe_clearance,
        z_start_clearance):

    # probe_dimensions is the external bounding box of the probe unit
    size_x, size_y, size_z = robot.config.probe_dimensions

    rel_x_start = (size_x / 2) + switch_clearance
    rel_y_start = (size_y / 2) + switch_clearance

    # Ensure that the nozzle will clear the probe unit and tip will clear deck
    nozzle_safe_z = round((size_z - tip_length) + z_probe_clearance, 3)

    z_start = max(deck_clearance, nozzle_safe_z)

    # Each list item defines axis we are probing for, starting position vector
    # relative to probe top center and travel distance
    neg_x = ('x',
             -rel_x_start,
             x_switch_offset,
             z_start,
             size_x)
    pos_x = ('x',
             rel_x_start,
             x_switch_offset,
             z_start,
             -size_x)
    neg_y = ('y',
             y_switch_offset,
             -rel_y_start,
             z_start,
             size_y)
    pos_y = ('y',
             y_switch_offset,
             rel_y_start,
             z_start,
             -size_y)
    z = ('z',
         0.0,
         z_switch_offset,
         z_start_clearance,
         -size_z)

    return [
        neg_x,
        pos_x,
        neg_y,
        pos_y,
        z
    ]


def _calculate_safeheight(robot, z_crossover_clearance):
    center = Point(*robot.config.probe_center)

    return center.z + z_crossover_clearance


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

    log.debug("This is measured probe center dx {}".format(Point(dx, dy, dz)))
    # any Z offset will adjust the tip length, so instruments have Z=0 offset
    old_x, old_y, _ = instrument_offset[instrument.mount][instrument.type]
    instrument_offset[instrument.mount][instrument.type] = \
        (old_x - dx, old_y - dy, 0.0)
    tip_length = deepcopy(config.tip_length)
    tip_length[instrument.name] = tip_length[instrument.name] + dz

    config = config \
        ._replace(instrument_offset=instrument_offset) \
        ._replace(tip_length=tip_length)
    robot.config = config
    log.debug("Updating config for {} instrument".format(instrument.mount))
    robot_configs.save(config)

    new_coordinates = change_base(
        robot.poses,
        src=instrument,
        dst=instrument.instrument_mover) - Point(dx, dy, 0.0)
    robot.poses = update(robot.poses, instrument, new_coordinates)

    return robot.config


def move_instrument_for_probing_prep(instrument, robot):
    instrument.move_to(robot.deck['5'].top(150))


def jog_instrument(instrument, axis, robot, distance):
    robot.poses = instrument._jog(robot.poses, axis, distance)
