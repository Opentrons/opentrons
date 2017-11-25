from numpy import array

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
    # Z = 0 denotes the tip down for XY calibration
    # Z = 1 denotes the tip up to begin Z calibration

    size_x, size_y, size_z = robot.config.probe_dimensions

    # Each list item defines axis we are probing for
    # and position within probing bounding box, where
    # -1 is minimum value and 1 is maximum value
    # (i.e. leftmost, rightmost, top, bottom, etc)
    hot_spots = [
        ('y', 0.2*size_x,   -1*size_y, 0*size_z),
        ('y', 0.2*size_x,    1*size_y, 0*size_z),
        ('x',  -1*size_x, -0.2*size_y, 0*size_z),
        ('x',   1*size_x, -0.2*size_y, 0*size_z),
        ('z',   0*size_x, -0.2*size_y, 1*size_z),
    ]

    center = Point(*robot.config.probe_center)
    tip_length = robot.config.tip_length[instrument.mount][instrument.type]

    instrument._add_tip(tip_length)

    acc = []

    for axis, *probing_vector in hot_spots:
        x, y, z = array(probing_vector) + center
        index = 'xyz'.index(axis)

        robot.poses = instrument._move(robot.poses, z=size_z * 1.2)
        robot.poses = instrument._move(robot.poses, x=x, y=y)
        robot.poses = instrument._move(robot.poses, z=z)

        robot.poses = instrument._probe(
            robot.poses,
            axis,
            -probing_vector[index]
        )

        value = absolute(robot.poses, instrument)[index]
        acc.append(value)

        # after probing two points along the same axis
        # average them out, update center and clear accumulator
        if len(acc) == 2:
            center = center._replace(**{axis: (acc[0] + acc[1]) / 2.0})
            acc.clear()

        # Bounce back to release end stop
        bounce = value + 5 * probing_vector[index] / abs(probing_vector[index])
        robot.poses = instrument._move(
            robot.poses,
            **{axis: bounce}
        )

    instrument._remove_tip(tip_length)
    robot.home()

    return center._replace(**{axis: acc.pop()})


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
