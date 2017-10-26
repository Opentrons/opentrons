from numpy import array

# TODO(artyom, ben 20171026): move to config
DEFAULT_TIP_LENGTH = 46


def calibrate_container_with_delta(
        container, position_tracker, delta_x,
        delta_y, delta_z, save, new_container_name=None
):
    delta = (delta_x, delta_y, delta_z)
    position_tracker.translate_object(container, *delta)
    container._coordinates += delta
    if save and new_container_name:
        database.save_new_container(container, new_container_name)
    elif save:
        database.overwrite_container(container)


def calibrate_pipette(probing_values, probe):
    ''' Interprets values generated from tip probing returns '''
    pass


def probe_instrument(instrument, robot):
    robot.home()

    travel = 20
    # size along X, Y and Z
    size = array((30.0, 30, 25.5))
    # coordinates of the top of the probe
    top = array((289.8, 296.4, 65.25))
    *_, height = size

    center = array(top) - (0, 0, height)

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
    switches = [
        (-1, 0, -1,  1),
        (1,  0, -1, -1),
        (0, -1, -1,  1),
        (0,  0,  1, -1),
        (0,  1, -1, -1)
    ]

    coords = [switch[:-1] * size + center for switch in switches]

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
        instrument._probe(axis, direction * travel)

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
