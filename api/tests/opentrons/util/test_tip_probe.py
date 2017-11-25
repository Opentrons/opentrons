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
            probe_center=(5.0, 5.0, 5.0),
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

    def move(self, target, *args, **kwargs):
        log.append(('move', target))
        self.update_position(target)
        return target

    def probe_axis(self, axis, probing_distance):
        log.append(('probe_axis', axis, probing_distance))
        mapping = {
            'X': (-25, 25),
            'Y': (-25, 25),
            'Z': (0, 50),
            'A': (0, 50)
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

    return namedtuple('fixture', 'robot instrument log')(
            robot=robot,
            instrument=pipette,
            log=log
        )


def test_tip_probe(fixture):
    from opentrons.util.calibration_functions import probe_instrument
    res = probe_instrument(instrument=fixture.instrument, robot=fixture.robot)
    assert fixture.log == [
        # Move to clear probe top: (probe height + 20%) + tip length
        ('move', {'A': 170.0}),
        # Probing Y axis:
        # move 0.2 X-size off probe X center to hit the switch at
        # optimal point
        # Y = probe center Y - probe Y size
        ('move', {'X': 15.0, 'Y': -45.0}),
        # Probe bottom + tip size
        ('move', {'A': 55.0}),
        # Probe with distance equal Y-size
        # in the direction of Y axis
        ('probe_axis', 'Y', 50.0),
        # Probe triggers at Y=-25, bounce back 5mm
        ('move', {'X': 15.0, 'Y': -30.0}),
        # Clear probe top
        ('move', {'A': 170.0}),
        # Y = probe center Y + probe Y size
        ('move', {'X': 15.0, 'Y': 55.0}),
        ('move', {'A': 55.0}),
        # Probe with distance equal Y-size
        # in the direction opposite of Y axis
        ('probe_axis', 'Y', -50.0),
        # Probe triggers at Y=+25, bounce back 5mm
        ('move', {'X': 15.0, 'Y': 30.0}),
        # Clear probe top
        ('move', {'A': 170.0}),
        # After Y-probing new center is Y=0.0
        # move 0.2 Y-size off probe Y center to hit the switch at
        # optimal point
        ('move', {'X': -45.0, 'Y': -10.0}),
        ('move', {'A': 55.0}),
        # Probe with distance equal X-size
        # in the direction of X axis
        ('probe_axis', 'X', 50.0),
        # Probe triggers at X=-25, bounce back 5mm
        ('move', {'X': -30.0, 'Y': -10.0}),
        ('move', {'A': 170.0}),
        ('move', {'X': 55.0, 'Y': -10.0}),
        ('move', {'A': 55.0}),
        # Probe X axis with distance equal X-size
        # in the direction opposite of X axis
        ('probe_axis', 'X', -50.0),
        # Probe triggers at X=25, bounce back 5mm
        ('move', {'X': 30.0, 'Y': -10.0}),
        ('move', {'A': 170.0}),
        # After probing X and Y, the new center is (0,0)
        # Move 0.2 Y-size to to hit Z switch at
        # optimal point
        ('move', {'X': 0.0, 'Y': -10.0}),
        # Probe bottom + Probe height + tip size
        ('move', {'A': 155.0}),
        # Probe Z axis with distance equal height
        # in the direction opposite of Z axis
        ('probe_axis', 'A', -100.0),
        # Probe triggers at height = 50 and bounces
        # back 5mm
        ('move', {'A': 55.0})]
    assert res == (0.0, 0.0, 0.0)
