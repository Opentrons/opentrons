from numpy import array


DEFAULT_TIP_LENGTH = 46

'''
 IDEA: For OT1, we calibrate everything with respect to one of the pipettes,
 including the other pipette. So, we have the user jog the first pipette
 to MY_PLATE[0]. Then calibrate the whole deck with respect to that pipette.
 Then the user brings the second pipette to any well that the first has already
 been to. This creates a relationship between second pipette and the first.
 Since the first already has a relationship with all the plates, we should
then be able to avoid calibrating all the other plates with with the
second pipette.
'''


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
    robot._driver.home('za')
    robot._driver.home('bcx')
    robot._driver.home()

    pose_tracker = robot.pose_tracker

    size = array((30.0, 30, 25.5, 20))
    top = array((289.8, 296.4, 65.25, 0))
    _, _, height, _ = size

    center = array(top) - (0, 0, height, 0)

    switches = [
        (-1, 0, -1,  1),
        (1,  0, -1, -1),
        (0, -1, -1,  1),
        (0,  0,  1, -1),
        (0,  1, -1, -1)
    ]

    coords = [switch * size + center for switch in switches]
    instrument._add_tip(DEFAULT_TIP_LENGTH)

    for coord, switch in zip(coords, switches):
        x, y, z, length = coord
        sx, sy, sz, _ = switch

        axis = 'z'
        if sx != 0:
            axis = 'x'
        elif sy:
            axis = 'y'
        else:
            axis = 'z'

        instrument._move(z=z+height*2+DEFAULT_TIP_LENGTH)
        instrument._move(x=x, y=y)
        instrument._move(z=z)
        instrument._probe(axis, length)

        instrument._move(x=x, y=y)

    instrument._remove_tip(DEFAULT_TIP_LENGTH)

    robot._driver.home('za')
    robot._driver.home('bcx')
    robot._driver.home()


def move_instrument_for_probing_prep(instrument, robot):
    instrument._move(x=191.5, y=75.0, z=128+DEFAULT_TIP_LENGTH)


def jog_instrument(instrument, axis, robot, distance):
    instrument._jog(axis, distance)
