from numpy import array

from opentrons.trackers.pose_tracker import (
    update, Point, change_base
)
from opentrons.robot import robot_configs
from opentrons.data_storage import database
from opentrons.trackers.pose_tracker import absolute


X_SWITCH_OFFSET_MM = 5.0
Y_SWITCH_OFFSET_MM = 5.0
Z_SWITCH_OFFSET_MM = 5.0
Z_DECK_CLEARANCE_MM = 25.0

BOUNCE_DISTANCE_MM = 5.0
Z_MARGIN = 0.2  # How much of z height to be added to clear the top


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


def probe_instrument(instrument, robot) -> Point:
    from statistics import mean

    robot.home()

    size_x, size_y, size_z = robot.config.probe_dimensions
    center = Point(*robot.config.probe_center)

    # Each list item defines axis we are probing for, starting position vector
    # relative to probe top center and travel distance
    hot_spots = [
        ('y', Y_SWITCH_OFFSET_MM,            -size_y, -center.z + Z_DECK_CLEARANCE_MM,  size_y),  # NOQA
        ('y', Y_SWITCH_OFFSET_MM,             size_y, -center.z + Z_DECK_CLEARANCE_MM, -size_y),  # NOQA
        ('x',            -size_x, X_SWITCH_OFFSET_MM, -center.z + Z_DECK_CLEARANCE_MM,  size_x),  # NOQA
        ('x',             size_x, X_SWITCH_OFFSET_MM, -center.z + Z_DECK_CLEARANCE_MM, -size_x),  # NOQA
        ('z',                0.0, Z_SWITCH_OFFSET_MM,               size_z * Z_MARGIN, -size_z)   # NOQA
    ]

    tip_length = robot.config.tip_length[instrument.mount][instrument.type]

    instrument._add_tip(tip_length)

    acc = []

    res = {
        'x': [], 'y': [], 'z': []
    }

    for axis, *probing_vector, distance in hot_spots:
        x, y, z = array(probing_vector) + center

        robot.poses = instrument._move(robot.poses, z=center.z + size_z * Z_MARGIN)  # NOQA
        robot.poses = instrument._move(robot.poses, x=x, y=y)
        robot.poses = instrument._move(robot.poses, z=z)

        axis_index = 'xyz'.index(axis)
        robot.poses = instrument._probe(robot.poses, axis, distance)

        value = absolute(robot.poses, instrument)[axis_index]
        node = instrument if axis == 'z' else instrument.instrument_mover
        res[axis].append(
            absolute(robot.poses, node)[axis_index]
        )
        acc.append(value)

        # after probing two points along the same axis
        # average them out, update center and clear accumulator
        if len(acc) == 2:
            center = center._replace(**{axis: (acc[0] + acc[1]) / 2.0})
            acc.clear()

        # Bounce back to release end stop
        bounce = value + (BOUNCE_DISTANCE_MM * (-distance / abs(distance)))

        robot.poses = instrument._move(robot.poses, **{axis: bounce})

    instrument._remove_tip(tip_length)
    robot.home()

    return center._replace(**{
        axis: mean(values)
        for axis, values in res.items()
    })


def update_instrument_config(instrument, measured_center) -> (Point, float):
    """
    Update instrument's x and y offsets and tip length based on delta between
    probe center and measured_center, persist updated config and return it
    """
    from copy import deepcopy

    config = instrument.robot.config
    instrument_offset = deepcopy(config.instrument_offset)

    _, _, z = instrument_offset[instrument.mount][instrument.type]
    dx, dy, dz = array(measured_center) - config.probe_center

    tip_length = deepcopy(config.tip_length)

    instrument_offset[instrument.mount][instrument.type] = (-dx, -dy, z)
    tip_length[instrument.mount][instrument.type] = \
        tip_length[instrument.mount][instrument.type] + \
        dz

    config = config \
        ._replace(instrument_offset=instrument_offset) \
        ._replace(tip_length=tip_length)

    instrument.robot.config = config

    robot_configs.save(config)

    return instrument.robot.config


def move_instrument_for_probing_prep(instrument, robot):
    tip_length = robot.config.tip_length[instrument.mount][instrument.type]
    # TODO(artyom, ben 20171026): calculate from robot dimensions
    robot.poses = instrument._move(
        robot.poses,
        x=191.5,
        y=75.0,
        z=128 + tip_length
    )


def jog_instrument(instrument, axis, robot, distance):
    robot.poses = instrument._jog(robot.poses, axis, distance)
