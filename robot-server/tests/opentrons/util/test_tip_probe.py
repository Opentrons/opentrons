import pytest
from opentrons.config import robot_configs, CONFIG
from opentrons.util.calibration_functions import update_instrument_config


@pytest.fixture
def config(monkeypatch):
    default = robot_configs.build_config({}, {})._replace(
        gantry_calibration=[
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0]
        ],
        # probe top center
        tip_probe=robot_configs._build_tip_probe({})._replace(
            center=[5.0, 5.0, 100.0],
            # Bounding box relative to top center
            dimensions=[50.0, 50.0, 100.0]
        ),
        # left relative to right
        instrument_offset={
            'right': {
                'single': [0.0, 0.0, 0.0],
                'multi': [0.0, 0.0, 0.0]
            },
            'left': {
                'single': [0.0, 0.0, 0.0],
                'multi': [0.0, 0.0, 0.0]
            }
        },
        tip_length={
            'Pipette': 50
        }
    )

    def dummy_default(a, b):
        return default

    monkeypatch.setattr(robot_configs, 'build_config', dummy_default)
    return default


@pytest.fixture
def fixture(config, monkeypatch):
    from opentrons.legacy_api.robot import Robot
    from opentrons.legacy_api.instruments.pipette import Pipette
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
    pipette = Pipette(robot, mount='right', ul_per_mm=1000)
    robot.home()

    return namedtuple('fixture', 'robot instrument log X Y Z')(
            robot=robot,
            instrument=pipette,
            log=log,
            X=X,
            Y=Y,
            Z=Z
        )


def test_update_instrument_config(fixture):
    from opentrons.trackers.pose_tracker import change_base
    from numpy import array
    import json

    robot = fixture.robot
    inst = fixture.instrument

    inst_offset = robot.config.instrument_offset[inst.mount][inst.type]

    cfg = update_instrument_config(
        instrument=inst,
        measured_center=(0.0, 0.0, 105.0)
    )

    new_tip_length = cfg.tip_length[inst.name]
    new_instrument_offset = cfg.instrument_offset[inst.mount][inst.type]

    assert new_tip_length == 55.0
    assert new_instrument_offset == tuple(array(inst_offset) + (5.0, 5.0, 0.0))
    assert tuple(change_base(
        robot.poses,
        src=inst,
        dst=inst.instrument_mover)) == (5.0, 5.0, 0), \
        "Expected instrument position to update relative to mover in pose tree"

    filename = CONFIG['robot_settings_file']
    _, expected = robot_configs.config_to_save(
        robot_configs.build_config([[]], {}))
    expected['instrument_offset']['right']['single'] = [5.0, 5.0, 0.0]
    expected['tip_length']['Pipette'] = 55.0

    with open(filename, 'r') as file:
        actual = json.load(file)

    # from pprint import pprint
    # print('=------> <------=')
    # print("Expected:")
    # pprint(expected)
    # print()
    # print("Actual:")
    # pprint(actual)
    # print()
    assert actual == expected
