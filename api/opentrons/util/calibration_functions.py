from numpy import array
from opentrons.trackers.pose_tracker import (
    update, Point, translate
)
from opentrons.util.vector import Vector
from opentrons.instruments.pipette import DEFAULT_TIP_LENGTH
from opentrons.data_storage import database

# maximum distance to move during calibration attempt
PROBE_TRAVEL_DISTANCE = 20
# size along X, Y and Z
PROBE_SIZE = array((30.0, 30, 25.5))
# coordinates of the top of the probe
PROBE_TOP_COORDINATES = array((289.8, 296.4, 65.25))


def calibrate_container_with_delta(
        pose, container, delta_x,
        delta_y, delta_z, save, new_container_name=None
):
    delta = Point(delta_x, delta_y, delta_z)
    new_transform = pose[container].transform.dot(
        translate(delta)
    )
    # Take first three elements of the last column
    point = Point(*new_transform.T[-1][:-1])
    pose = update(pose, container, point)
    container._coordinates = Vector(*point)
    if save and new_container_name:
        database.save_new_container(container, new_container_name)
    elif save:
        database.overwrite_container(container)
    return pose


def calibrate_pipette(probing_values, probe):
    ''' Interprets values generated from tip probing returns '''
    pass


def probe_instrument(instrument, robot):
    robot.home()

    *_, height = PROBE_SIZE

    center = PROBE_TOP_COORDINATES - (0, 0, height)

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
        (-1, 0, -1,  1),
        (1,  0, -1, -1),
        (0, -1, -1,  1),
        (0,  1, -1, -1),
        (0,  0,  1, -1),
    ]

    switch_center = PROBE_TOP_COORDINATES

    coords = [switch[:-1] * PROBE_SIZE + center for switch in switches]

    instrument._add_tip(DEFAULT_TIP_LENGTH)

    for coord, switch in zip(coords, switches):
        x, y, z = coord
        sx, sy, sz, direction = switch

        axis = 'z'
        if sx:
            axis = 'x'
        elif sy:
            axis = 'y'

        # TODO(artyom, ben 20171026): fine tune correct probing sequence
        robot.poses = instrument._move(
            robot.poses,
            z=z+height*2+DEFAULT_TIP_LENGTH
        )

        robot.poses = instrument._move(robot.poses, x=x, y=y)
        robot.poses = instrument._move(robot.poses, z=z)
        instrument._probe(axis, direction * PROBE_TRAVEL_DISTANCE)

        robot.poses = instrument._move(robot.poses, x=x, y=y)

    instrument._remove_tip(DEFAULT_TIP_LENGTH)

    robot.home()


def move_instrument_for_probing_prep(instrument, robot):
    # TODO(artyom, ben 20171026): calculate from robot dimensions
    robot.poses = instrument._move(
        robot.poses,
        x=191.5,
        y=75.0,
        z=128+DEFAULT_TIP_LENGTH
    )


def jog_instrument(instrument, axis, robot, distance):
    robot.poses = instrument._jog(robot.poses, axis, distance)
