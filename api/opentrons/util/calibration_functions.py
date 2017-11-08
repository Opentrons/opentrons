from numpy import array
from opentrons.trackers.pose_tracker import (
    update, Point, transform
)
from opentrons.instruments.pipette import DEFAULT_TIP_LENGTH
from opentrons.data_storage import database
from ..robot.robot_configs import config


# maximum distance to move during calibration attempt
PROBE_TRAVEL_DISTANCE = 30
# size along X, Y and Z
PROBE_SIZE = array(config.probe_dimensions)
# coordinates of the top of the probe
PROBE_TOP_COORDINATES = array(config.probe_center)


def calibrate_container_with_delta(
        pose_tree, container, delta_x,
        delta_y, delta_z, save, new_container_name=None
):
    delta = Point(delta_x, delta_y, delta_z)
    new_coordinates = transform(
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

    *_, height = PROBE_SIZE

    center = PROBE_TOP_COORDINATES * (1, 1, 0) + (0, 0, height / 2.0)

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
    # Z = -1 denotes the tip down for XY calibration
    # Z =  1 denotes the tip up to begin Z calibration
    # Travel direction is in the same axis as the non-zero
    #   XY coordinate, or in the Z axis if both X and Y
    #   are zero
    switches = [
        (-1, 0, -0.5,  1),
        (1,  0, -0.5, -1),
        (0, -1, -0.5,  1),
        (0,  1, -0.5, -1),
        (0,  0,    1, -1),
    ]

    coords = [switch[:-1] * PROBE_SIZE / 2.0 + center for switch in switches]
    instrument._add_tip(DEFAULT_TIP_LENGTH)

    values = {'x': [], 'y': [], 'z': []}

    for coord, switch in zip(coords, switches):
        x, y, z = coord
        sx, sy, sz, direction = switch

        axis = 'z'
        if sx:
            axis = 'x'
        elif sy:
            axis = 'y'

        robot.poses = instrument._move(robot.poses, z=height * 1.2)
        robot.poses = instrument._move(robot.poses, x=x, y=y)
        robot.poses = instrument._move(robot.poses, z=z)

        values[axis].append(
            instrument._probe(
                axis,
                direction * PROBE_TRAVEL_DISTANCE
            )
        )

        robot.poses = instrument._move(
            robot.poses,
            x=(x + sx * 5),
            y=(y + sy * 5))

    instrument._remove_tip(DEFAULT_TIP_LENGTH)
    robot.home()


def move_instrument_for_probing_prep(instrument, robot):
    # TODO(artyom, ben 20171026): calculate from robot dimensions
    robot.poses = instrument._move(
        robot.poses,
        x=191.5,
        y=75.0,
        z=128 + DEFAULT_TIP_LENGTH
    )


def jog_instrument(instrument, axis, robot, distance):
    robot.poses = instrument._jog(robot.poses, axis, distance)
