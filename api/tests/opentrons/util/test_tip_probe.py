import pytest
from opentrons.util.calibration_functions import (
    probe_instrument,
    update_instrument_config,
    BOUNCE_DISTANCE_MM,
    X_SWITCH_OFFSET_MM,
    Y_SWITCH_OFFSET_MM,
    Z_SWITCH_OFFSET_MM,
    Z_DECK_CLEARANCE_MM,
    Z_MARGIN
)
from opentrons.util import environment
from opentrons.robot import robot_configs


@pytest.fixture
def config(monkeypatch, tmpdir):
    monkeypatch.setenv('APP_DATA_DIR', str(tmpdir))
    environment.refresh()

    default = robot_configs.default._replace(
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
    monkeypatch.setattr(robot_configs, 'default', default)
    return default


@pytest.fixture
def fixture(config, monkeypatch):
    from opentrons.robot.robot import Robot
    from opentrons.instruments.pipette import Pipette
    from collections import namedtuple
    from opentrons.drivers.smoothie_drivers.v3_0_0 import driver_3_0

    log = []
    X = (-25, 25)
    Y = (-25, 25)
    Z = (0, 150)

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


def test_tip_probe(fixture):
    robot = fixture.robot
    instrument = fixture.instrument

    res = probe_instrument(instrument=fixture.instrument, robot=fixture.robot)
    center_x, center_y, center_z = robot.config.probe_center
    size_x, size_y, size_z = robot.config.probe_dimensions
    min_x, max_x = fixture.X
    min_y, max_y = fixture.Y
    min_z, max_z = fixture.Z

    tip_length = robot.config.tip_length[instrument.mount][instrument.type]

    assert fixture.log == [
        # Clear probe top
        ('move', {
            'A': tip_length + center_z + size_z * Z_MARGIN}),
        # Move to min Y hot spot
        ('move', {
            'X': center_x + Y_SWITCH_OFFSET_MM,
            'Y': center_y - size_y}),
        # Lower Z
        ('move', {
            'A': tip_length + Z_DECK_CLEARANCE_MM}),
        # Probe in the direction of Y axis
        ('probe_axis',
            'Y', size_y),
        # Bounce back along Y
        ('move', {
            'X': center_x + Y_SWITCH_OFFSET_MM,
            'Y': min_y - BOUNCE_DISTANCE_MM}),
        # Clear probe top
        ('move', {
            'A': tip_length + center_z + size_z * Z_MARGIN}),
        # Move to max Y hot spot
        ('move', {
            'X': center_x + Y_SWITCH_OFFSET_MM,
            'Y': center_y + size_y}),
        # Lower Z
        ('move', {
            'A': tip_length + Z_DECK_CLEARANCE_MM}),
        # Probe in the direction opposite of Y axis
        ('probe_axis',
            'Y', -size_y),
        # Bounce back along Y
        ('move', {
            'X': center_x + Y_SWITCH_OFFSET_MM,
            'Y': max_y + BOUNCE_DISTANCE_MM}),
        # Clear probe top
        ('move', {
            'A': tip_length + center_z + size_z * Z_MARGIN}),
        # Move to min X hot spot
        ('move', {
            'X': center_x - size_x,
            'Y': (min_y + max_y) / 2.0 + X_SWITCH_OFFSET_MM}),
        # Lower Z
        ('move', {
            'A': tip_length + Z_DECK_CLEARANCE_MM}),
        # Probe in the direction of X axis
        ('probe_axis',
            'X', size_x),
        # Bounce back along X
        ('move', {
            'X': min_x - BOUNCE_DISTANCE_MM,
            'Y': (min_y + max_y) / 2.0 + X_SWITCH_OFFSET_MM}),
        # Clear probe top
        ('move', {
            'A': tip_length + center_z + size_z * Z_MARGIN}),
        # Move to max X hot spot
        ('move', {
            'X': center_x + size_x,
            'Y': (min_y + max_y) / 2.0 + X_SWITCH_OFFSET_MM}),
        # Lower Z
        ('move', {
            'A': tip_length + Z_DECK_CLEARANCE_MM}),
        # Probe in the direction opposite of X axis
        ('probe_axis',
            'X', -size_x),
        # Bounce back along X
        ('move', {
            'X': max_x + BOUNCE_DISTANCE_MM,
            'Y': (min_y + max_y) / 2.0 + X_SWITCH_OFFSET_MM}),
        # Clear probe top
        ('move', {
            'A': tip_length + center_z + size_z * Z_MARGIN}),
        # Move to Z hot spot
        ('move', {
            'X': (min_x + max_x) / 2.0,
            'Y': (min_y + max_y) / 2.0 + Z_SWITCH_OFFSET_MM}),
        ('move', {
            'A': tip_length + center_z + size_z * Z_MARGIN}),
        # Probe in the direction opposite of Z axis
        ('probe_axis',
            'A', -size_z),
        # Bounce back along Z
        ('move',
            {'A': max_z + BOUNCE_DISTANCE_MM})]
    assert res == (0.0, 0.0, 100.0)


def test_update_instrument_config(fixture, monkeypatch):
    from numpy import array
    import json

    robot = fixture.robot
    instrument = fixture.instrument

    tip_length = robot.config. \
        tip_length[instrument.mount][instrument.type]
    instrument_offset = robot.config. \
        instrument_offset[instrument.mount][instrument.type]

    config = update_instrument_config(
        instrument=instrument,
        measured_center=(0.0, 0.0, 105.0)
    )

    new_tip_length = config \
        .tip_length[instrument.mount][instrument.type]
    new_instrument_offset = config \
        .instrument_offset[instrument.mount][instrument.type]

    assert new_tip_length == tip_length + 5.0
    assert new_instrument_offset == \
        tuple(array(instrument_offset) - (5.0, 5.0, 0.0))

    filename = environment.get_path('OT_CONFIG_FILE')
    with open(filename, 'r') as file:
        assert json.load(file) == {
            'instrument_offset': {
                'right': {
                    'single': [-5.0, -5.0, 0.0]
                }
            },
            'tip_length': {
                'right': {
                    'single': 55.0
                }
            }
        }
