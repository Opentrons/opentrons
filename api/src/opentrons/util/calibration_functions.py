from numpy import array
from typing import Tuple
from opentrons.trackers.pose_tracker import (
    Point, change_base, absolute
)
from opentrons.config import robot_configs

import logging

log = logging.getLogger(__name__)


def probe_instrument(instrument, robot, tip_length=None) -> Point:
    robot.home()
    tp = robot.config.tip_probe
    if tip_length is None:
        tip_length = robot.config.tip_length[instrument.name]
    instrument._add_tip(tip_length)

    # probe_center is the point at the center of the switch pcb
    center = Point(*tp.center)

    hot_spots = _calculate_hotspots(
        robot,
        tip_length,
        tp)

    # The saved axis positions from limit switch response
    axis_pos = []

    safe_height = _calculate_safeheight(robot, tp.z_clearance.crossover)

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
        bounce = value + (tp.bounce_distance * (-distance / abs(distance)))

        robot.poses = instrument._move(robot.poses, **{axis: bounce})
        robot.poses = instrument._move(robot.poses, z=safe_height)

        log.debug("Updated center point tip probe {}".format(center))

    instrument._remove_tip(tip_length)

    return center


def _calculate_hotspots(
        robot,
        tip_length,
        tip_probe_settings):
    # probe_dimensions is the external bounding box of the probe unit
    size_x, size_y, size_z = tip_probe_settings.dimensions

    rel_x_start = (size_x / 2) + tip_probe_settings.switch_clearance
    rel_y_start = (size_y / 2) + tip_probe_settings.switch_clearance

    # Ensure that the nozzle will clear the probe unit and tip will clear deck
    nozzle_safe_z = round((size_z - tip_length)
                          + tip_probe_settings.z_clearance.normal, 3)

    z_start = max(tip_probe_settings.z_clearance.deck, nozzle_safe_z)

    # Each list item defines axis we are probing for, starting position vector
    # relative to probe top center and travel distance
    neg_x = ('x',
             -rel_x_start,
             tip_probe_settings.switch_offset[0],
             z_start,
             size_x)
    pos_x = ('x',
             rel_x_start,
             tip_probe_settings.switch_offset[0],
             z_start,
             -size_x)
    neg_y = ('y',
             tip_probe_settings.switch_offset[1],
             -rel_y_start,
             z_start,
             size_y)
    pos_y = ('y',
             tip_probe_settings.switch_offset[1],
             rel_y_start,
             z_start,
             -size_y)
    z = ('z',
         0.0,
         tip_probe_settings.switch_offset[2],
         tip_probe_settings.z_clearance.start,
         -size_z)

    return [
        neg_x,
        pos_x,
        neg_y,
        pos_y,
        z
    ]


def _calculate_safeheight(robot, z_crossover_clearance):
    center = Point(*robot.config.tip_probe.center)

    return center.z + z_crossover_clearance


def update_instrument_config(
        instrument, measured_center) -> Tuple[Point, float]:
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

    dx, dy, dz = array(measured_center) - config.tip_probe.center

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
    robot_configs.save_robot_settings(config)

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
