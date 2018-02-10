from opentrons import robot, instruments
from opentrons.api import calibration
from numpy import array


def introduce_error(config, poses, instrument, error):
    """
    Mutates config instrument_offset and tip_length and
    updates poses introducing error defined by error vector

    Returns new instance of pose tree
    """
    from opentrons.trackers.pose_tracker import update

    dx, dy, dz = error

    mount = instrument.mount
    _type = instrument.type

    config.instrument_offset[mount] = tuple(
        array((dx, dy, 0)) + config.instrument_offset[mount]
    )

    config.tip_length[mount][_type] = \
        config.tip_length[mount][_type] + dz

    return update(
        poses,
        obj=instrument,
        point=config.instrument_offset[mount])


def init_instruments():
    left = instruments.Pipette(mount='left', channels=8)
    right = instruments.Pipette(mount='right', channels=1)

    left._instrument = left
    right._instrument = right

    return left, right


def error_vector(x, y, z):
    from random import uniform
    return uniform(-x, y), uniform(-y, y), uniform(-z, z)


def test_instrument(calibration_manager, robot, instrument, error):
    robot.poses = introduce_error(
        config=robot.config,
        poses=robot.poses,
        instrument=instrument,
        error=error
    )

    mount = instrument.mount
    _type = instrument.type

    calibration_manager.tip_probe(instrument)

    return (
        robot.config.instrument_offset[mount],
        robot.config.tip_length[mount][_type]
    )


def main():
    robot.connect()
    robot.home()

    calibration_manager = calibration.CalibrationManager()

    left, right = init_instruments()

    while True:
        error = error_vector(5, 5, 10)

        print('Pipette: RIGHT')
        print('Error: ', error)
        offset, tip_length = test_instrument(
            calibration_manager, robot, right, error)
        print('Offset: ', offset)
        print('Tip: ', tip_length)

        error = error_vector(5, 5, 10)

        print('Pipette: LEFT')
        print('Error: ', error)
        offset, tip_length = test_instrument(
            calibration_manager, robot, left, error)
        print('Offset: ', offset)
        print('Tip: ', tip_length)


if __name__ == "__main__":
    main()
