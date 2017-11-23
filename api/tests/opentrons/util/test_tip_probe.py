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
    from opentrons.drivers.smoothie_drivers.v3_0_0 import driver_3_0

    log = []

    def move(self, *args, **kwargs):
        log.append((args, kwargs))

    monkeypatch.setattr(
        driver_3_0.SmoothieDriver_3_0_0,
        'move',
        move
    )

    robot = Robot(config=config)
    pipette = Pipette(robot, mount='right')
    robot.home()

    return namedtuple('fixture', 'robot instrument log')(
            robot=robot,
            instrument=pipette,
            log=log
        )


def test_tip_probe(fixture):
    from opentrons.util.calibration_functions import probe_instrument
    probe_instrument(instrument=fixture.instrument, robot=fixture.robot)
    from pprint import pprint
    pprint(fixture.log)
