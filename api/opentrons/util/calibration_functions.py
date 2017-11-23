from numpy import array
from numpy.linalg import norm

from opentrons.trackers.pose_tracker import (
    update, Point, change_base
)
from opentrons.data_storage import database
from opentrons.trackers.pose_tracker import absolute


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


def calibrate_pipette(probing_values, probe):
    ''' Interprets values generated from tip probing returns '''
    pass


def probe_instrument(instrument, robot):
    robot.home()

    #       Y ^
    #         * 1
    #         |
    #   --*---+---*-->
    #     -1  |   1  X
    #         * -1
    #         |
    #
    # We are using above mental model to define
    # left, right, forward, backward, center on a probe
    #
    # X, Y, Z point and travel direction
    # Z = 0 denotes the tip down for XY calibration
    # Z = 1 denotes the tip up to begin Z calibration

    # size along X, Y and Z
    probe_size = array(robot.config.probe_dimensions)
    _, _, height = probe_size
    switches = [
        (0.2,   -1, 0, 'y'),
        (0.2,    1, 0, 'y'),
        ( -1, -0.2, 0, 'x'),
        (  1, -0.2, 0, 'x'),
        (  0, -0.2, 1, 'z'),
    ]
    center = array(robot.config.probe_center)
    tip_length = robot.config.tip_length[instrument.mount][instrument.type]

    instrument._add_tip(tip_length)

    acc = []

    for *switch, axis in switches:
        sx, sy, sz = switch
        probing_vector = array((sx, sy, sz)) * probe_size
        x, y, z = probing_vector + center

        mask = [axis == a for a in 'xyz']
        inv_mask = [not bit for bit in mask]

        robot.poses = instrument._move(robot.poses, z=height * 1.2)
        robot.poses = instrument._move(robot.poses, x=x, y=y)
        robot.poses = instrument._move(robot.poses, z=z)

        robot.poses = instrument._probe(
            robot.poses,
            axis,
            -norm(probing_vector)
        )

        x, y, z = absolute(robot.poses, instrument) * mask
        acc.append(array((x, y, z)))

        # after probing two points along the same axis
        # average them out, update center and clear accumulator
        if len(acc) == 2:
            center = center * inv_mask + (acc[0] * mask + acc[1] * mask) / 2.0
            acc.clear()

        robot.poses = instrument._move(
            robot.poses,
            x=(x + sx * 5),
            y=(y + sy * 5),
            z=(z + sz * 5))

    instrument._remove_tip(tip_length)
    robot.home()

    return acc.pop()


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
