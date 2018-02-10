import pytest
from opentrons.robot import robot_configs
from opentrons.util import environment
from opentrons.util.calibration_functions import (
    # probe_instrument,
    update_instrument_config,
    # BOUNCE_DISTANCE_MM,
    # X_SWITCH_OFFSET_MM,
    # Y_SWITCH_OFFSET_MM,
    # Z_SWITCH_OFFSET_MM,
    # Z_CLEARANCE,
    # Z_CROSSOVER_CLEARANCE,
    # SWITCH_CLEARANCE
)


@pytest.fixture
def config(monkeypatch, tmpdir):
    monkeypatch.setenv('APP_DATA_DIR', str(tmpdir))
    environment.refresh()

    default = robot_configs._get_default()._replace(
            gantry_calibration=[
                [1.0, 0.0, 0.0, 0.0],
                [0.0, 1.0, 0.0, 0.0],
                [0.0, 0.0, 1.0, 0.0],
                [0.0, 0.0, 0.0, 1.0]
            ],
            # probe top center
            probe_center=(5.0, 5.0, 100.0),
            # Bounding box relative to top center
            probe_dimensions=(50.0, 50.0, 100.0),
            # left relative to right
            instrument_offset={
                'right': (0.0, 0.0, 0.0),
                'left': (0.0, 0.0, 0.0)
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
    monkeypatch.setattr(robot_configs, '_get_default', lambda: default)
    return default


@pytest.fixture
def fixture(config, monkeypatch):
    from opentrons.robot.robot import Robot
    from opentrons.instruments.pipette import Pipette
    from collections import namedtuple
    from opentrons.drivers.smoothie_drivers import driver_3_0

    log = []
    X = (-25, 25)
    Y = (-25, 25)
    Z = (0, 100)

    def move(self, target, *args, **kwargs):
        log.append(('move', target))
        self.update_position(target)
        return target

    def probe_axis(self, axis, probing_distance):
        log.append(('probe_axis', axis, probing_distance))
        mapping = {
            'X': X,
            'Y': Y,
            'Z': Z,
            'A': Z
        }
        self.update_position({
            axis.upper(): mapping[axis][0 if probing_distance > 0 else 1]
        })
        return self._position

    monkeypatch.setattr(driver_3_0.SmoothieDriver_3_0_0, 'move', move)
    monkeypatch.setattr(
        driver_3_0.SmoothieDriver_3_0_0,
        'probe_axis',
        probe_axis)

    robot = Robot(config=config)
    pipette = Pipette(robot, mount='right')
    robot.home()

    return namedtuple('fixture', 'robot instrument log X Y Z')(
            robot=robot,
            instrument=pipette,
            log=log,
            X=X,
            Y=Y,
            Z=Z
        )


def test_update_instrument_config(fixture, monkeypatch):
    from opentrons.trackers.pose_tracker import change_base
    from numpy import array
    import json

    robot = fixture.robot
    instrument = fixture.instrument

    # tip_length = robot.config. \
    #     tip_length[instrument.mount][instrument.type]
    instrument_offset = robot.config. \
        instrument_offset[instrument.mount]

    config = update_instrument_config(
        instrument=instrument,
        measured_center=(0.0, 0.0, 105.0)
    )

    new_tip_length = config \
        .tip_length[instrument.mount][instrument.type]
    new_instrument_offset = config \
        .instrument_offset[instrument.mount]

    assert new_tip_length == 55.0
    assert new_instrument_offset == \
        tuple(array(instrument_offset) + (5.0, 5.0, 0.0))
    assert tuple(change_base(
        robot.poses,
        src=instrument,
        dst=instrument.instrument_mover)) == (5.0, 5.0, 0), \
        "Expected instrument position to update relative to mover in pose tree"

    filename = environment.get_path('OT_CONFIG_FILE')
    with open(filename, 'r') as file:
        assert json.load(file) == {
            'instrument_offset': {
                'right': [5.0, 5.0, 0.0]
            },
            'tip_length': {
                'right': {
                    'single': 55.0
                }
            }
        }
