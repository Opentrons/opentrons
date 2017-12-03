from numpy import array

from opentrons.trackers.pose_tracker import (
    update, Point, change_base
)
from opentrons.robot import robot_configs
from opentrons.data_storage import database
from opentrons.trackers.pose_tracker import absolute


X_SWITCH_OFFSET_MM = 5.0
Y_SWITCH_OFFSET_MM = 2.0
Z_SWITCH_OFFSET_MM = 5.0

Z_PROBE_CLEARANCE_MM = 5.0

BOUNCE_DISTANCE_MM = 5.0
XY_CLEARANCE = 7.5
Z_CROSSOVER_CLEARANCE = 80  # How much of z height to be added to nozzle to clear the top


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

    size_x, size_y, size_z = robot.config.probe_dimensions
    center = Point(*robot.config.probe_center)

    rel_x_start = (size_x / 2) + XY_CLEARANCE
    rel_y_start = (size_y / 2) + XY_CLEARANCE
    rel_z_start = Z_CROSSOVER_CLEARANCE

    # Each list item defines axis we are probing for, starting position vector
    # relative to probe top center and travel distance
    hot_spots = [
        ('x',       -rel_x_start, X_SWITCH_OFFSET_MM, Z_PROBE_CLEARANCE_MM,                 size_x),  # NOQA
        ('x',        rel_x_start, X_SWITCH_OFFSET_MM, Z_PROBE_CLEARANCE_MM,                -size_x),  # NOQA
        ('y', Y_SWITCH_OFFSET_MM,       -rel_y_start, Z_PROBE_CLEARANCE_MM,                 size_y),  # NOQA
        ('y', Y_SWITCH_OFFSET_MM,        rel_y_start, Z_PROBE_CLEARANCE_MM,                -size_y),  # NOQA
        ('z',                0.0, Z_SWITCH_OFFSET_MM,          rel_z_start, -Z_CROSSOVER_CLEARANCE)   # NOQA
    ]

    tip_length = robot.config.tip_length[instrument.mount][instrument.type]

    acc = []

    res = {
        'x': [], 'y': [], 'z': []
    }

    robot.home()

    for axis, *probing_vector, distance in hot_spots:
        x, y, z = array(probing_vector) + center

        safe_height = center.z + Z_CROSSOVER_CLEARANCE

        robot.poses = instrument._move(robot.poses, z=safe_height)
        robot.poses = instrument._move(robot.poses, x=x, y=y)
        robot.poses = instrument._move(robot.poses, z=z)

        axis_index = 'xyz'.index(axis)
        robot.poses = instrument._probe(robot.poses, axis, distance)

        # Tip position is stored in accumulator and averaged for each axis
        # to be used for more accurate positioning for the next axis
        value = absolute(robot.poses, instrument)[axis_index]
        acc.append(value)

        # Since we are measuring to update instrument offset and tip length
        # store mover position for XY and tip's Z
        node = instrument if axis == 'z' else instrument.instrument_mover
        res[axis].append(
            absolute(robot.poses, node)[axis_index]
        )

        # after probing two points along the same axis
        # average them out, update center and clear accumulator
        if len(acc) == 2:
            center = center._replace(**{axis: (acc[0] + acc[1]) / 2.0})
            acc.clear()

        # Bounce back to release end stop
        bounce = value + (BOUNCE_DISTANCE_MM * (-distance / abs(distance)))

        robot.poses = instrument._move(robot.poses, **{axis: bounce})
        robot.poses = instrument._move(robot.poses, z=safe_height)

    return center._replace(**{
        axis: mean(values)
        for axis, values in res.items()
    })


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

    _, _, z = instrument_offset[instrument.mount][instrument.type]
    dx, dy, dz = array(measured_center) - config.probe_center

    tip_length = deepcopy(config.tip_length)

    instrument_offset[instrument.mount][instrument.type] = (-dx, -dy, z)
    tip_length[instrument.mount][instrument.type] = dz

    config = config \
        ._replace(instrument_offset=instrument_offset) \
        ._replace(tip_length=tip_length)
    robot.config = config

    robot_configs.save(config)

    robot.poses = update(robot.poses, instrument, (-dx, -dy, z))

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
