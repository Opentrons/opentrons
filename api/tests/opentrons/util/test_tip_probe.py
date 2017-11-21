import pytest


@pytest.fixture
def config():
    from opentrons.robot.robot_configs import default
    return default._replace(
            gantry_calibration=[
                [1.0, 0.0, 0.0, 0.0],
                [0.0, 1.0, 0.0, 0.0],
                [0.0, 0.0, 1.0, 0.0],
                [0.0, 0.0, 0.0, 1.0]
            ],
            probe_center=(0.0, 0.0, 0.0),
            probe_dimensions=(50.0, 50.0, 100.0),
            # left relative to right
            instrument_offsets={
                'right': {
                    'single': (0.0, 0.0, 0.0),
                    'multi':  (0.0, 5.0, 0.0)
                },
                'left': {
                    'single': (-10.0, 0.0, 0.0),
                    'multi':  (-10.0, 5.0, 0.0)
                }
            },
            tip_length={
                'left': {
                    'single': 50.0,
                    'multi': 50.0
                },
                'right': {
                    'single': 50.0,
                    'multi': 50.0
                }
            }
        )


@pytest.fixture
def fixture(config, monkeypatch):
    from opentrons.robot.robot import Robot
    from opentrons.instruments.pipette import Pipette
    from collections import namedtuple

    log = []

    def move(self, **kwargs) {
        log.append(kwargs)
    }

    monkeypatch.setattr(
        'opentrons.drivers.v3_0_0.driver_3_0.SmoothieDriver_3_0_0.move',
        move
    )

    robot = Robot(config=config)
    pipette = Pipette(robot, mount='right')

    return namedtuple('fixture', 'robot pipette log')(
            robot=robot,
            pipette=pipette,
            log=log
        )


def test_tip_probe(fixture):
    from opentrons.util.calibration_functions import probe_instrument
    probe_instrument(instrument=fixture.instrument, robot=fixture.robt)
