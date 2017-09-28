import unittest
import pytest

from opentrons import drivers
from opentrons.containers import load as containers_load
from opentrons.instruments import pipette
from opentrons.robot.robot import Robot


def test_pos_tracker_persistance(robot):
    p200 = pipette.Pipette(
        robot, axis='b', name='my-fancy-pancy-pipette'
    )
    plate = containers_load(robot, 'trough-12row', 'B2')
    assert robot.max_deck_height() == 40

    robot.move_head(x=10, y=10, z=10)
    robot.calibrate_container_with_instrument(plate, p200, save=False)

    assert robot.max_deck_height() == 50


def test_calibrated_max_z(robot):
    p200 = pipette.Pipette(
        robot, axis='b', name='my-fancy-pancy-pipette'
    )
    plate = containers_load(robot, '96-flat', 'A1')
    assert robot.max_deck_height() == 10.5

    robot.move_head(x=10, y=10, z=10)
    robot.calibrate_container_with_instrument(plate, p200, save=False)

    assert robot.max_deck_height() == 20.5


@pytest.fixture
def robot():
    from opentrons import robot
    robot.__dict__ = {**Robot().__dict__}
    return robot


def test_get_serial_ports_list(robot, monkeypatch):
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'false')
    assert 'Virtual Smoothie' not in robot.get_serial_ports_list()
    monkeypatch.setenv('ENABLE_VIRTUAL_SMOOTHIE', 'true')
    assert 'Virtual Smoothie' in robot.get_serial_ports_list()


class RobotTest(unittest.TestCase):
    def setUp(self):
        self.robot = Robot()

        self.smoothie_version = 'edge-1c222d9NOMSD'

        self.robot.reset()
        self.robot.connect(options={'firmware': self.smoothie_version})
        self.robot.home(enqueue=False)

    def tearDown(self):
        del self.robot

    def test_firmware_verson(self):
        self.assertEquals(
            self.smoothie_version, self.robot._driver.firmware_version)

    def test_add_container(self):
        c1 = self.robot.add_container('96-flat', 'A1')
        res = self.robot.get_containers()
        expected = [
            c1
        ]
        self.assertEquals(res, expected)

        c2 = self.robot.add_container('96-flat', 'A2', 'my-special-plate')
        res = self.robot.get_containers()
        expected = [
            c1,
            c2
        ]
        self.assertEquals(res, expected)

    def test_comment(self):
        self.robot.clear_commands()
        self.robot.comment('hello')
        self.assertEquals(len(self.robot.commands()), 1)
        self.assertEquals(self.robot.commands()[0], 'hello')

    def test_home_after_disconnect(self):
        self.robot._driver.connection = None
        self.assertRaises(RuntimeError, self.robot.home)

    def test_create_arc(self):
        p200 = pipette.Pipette(
            self.robot, axis='b', name='my-fancy-pancy-pipette'
        )
        plate = containers_load(self.robot, '96-flat', 'A1')
        plate2 = containers_load(self.robot, '96-flat', 'B1')
        self.robot.move_head(x=10, y=10, z=10)
        self.robot.calibrate_container_with_instrument(plate, p200, save=False)

        res = self.robot._create_arc((0, 0, 0), plate[0])
        expected = [
            {'z': 25.5},
            {'x': 0, 'y': 0},
            {'z': 0}
        ]
        self.assertEquals(res, expected)

        self.robot.move_head(x=10, y=10, z=100)
        self.robot.calibrate_container_with_instrument(
            plate2, p200, save=False
        )
        res = self.robot._create_arc((0, 0, 0), plate2[0])
        expected = [
            {'z': 100},
            {'x': 0, 'y': 0},
            {'z': 0}
        ]
        self.assertEquals(res, expected)

    def test_disconnect(self):
        self.robot.disconnect()
        res = self.robot.is_connected()
        self.assertEquals(bool(res), False)

    def test_get_connected_port(self):
        res = self.robot.get_connected_port()
        self.assertEquals(res, drivers.VIRTUAL_SMOOTHIE_PORT)

    def test_robot_move_to(self):
        self.robot.move_to((self.robot._deck, (100, 0, 0)))
        position = self.robot._driver.get_head_position()['current']
        self.assertEqual(position, (100, 0, 0))

    def test_move_head(self):
        self.robot.move_head(x=100, y=0, z=20)
        current = self.robot._driver.get_head_position()['current']
        self.assertEquals(current, (100, 0, 20))

    def test_home(self):
        self.robot.disconnect()
        self.robot.connect()

        # Check that all axes are marked as not homed
        self.assertDictEqual(self.robot.axis_homed, {
            'x': False, 'y': False, 'z': False, 'a': False, 'b': False
        })

        # self.robot.clear_commands()
        # Home X & Y axes
        self.robot.home('xa')
        # self.assertDictEqual(self.robot.axis_homed, {
        #     'x': False, 'y': False, 'z': False, 'a': False, 'b': False
        # })

        # Verify X & Y axes are marked as homed
        self.assertDictEqual(self.robot.axis_homed, {
            'x': True, 'y': False, 'z': False, 'a': True, 'b': False
        })

        # Home all axes
        self.robot.home()

        # Verify all axes are marked as homed
        self.assertDictEqual(self.robot.axis_homed, {
            'x': True, 'y': True, 'z': True, 'a': True, 'b': True
        })

    def test_versions(self):
        res = self.robot.versions()
        expected = {
            'config': {
                'version': 'v2.0.0',
                'compatible': True
            },
            'firmware': {
                'version': self.smoothie_version,
                'compatible': True
            },
            'ot_version': {
                'version': 'one_pro_plus',
                'compatible': True
            }
        }
        self.assertDictEqual(res, expected)

    def test_diagnostics(self):
        res = self.robot.diagnostics()
        expected = {
            'axis_homed': {
                'x': True, 'y': True, 'z': True, 'a': True, 'b': True
            },
            'switches': {
                'x': False,
                'y': False,
                'z': False,
                'a': False,
                'b': False
            },
            'steps_per_mm': {
                'x': 80.0,
                'y': 80.0
            }
        }
        self.assertDictEqual(res, expected)

        self.robot.disconnect()
        self.robot.connect()
        self.assertRaises(RuntimeWarning, self.robot.move_head, x=-199)
        res = self.robot.diagnostics()
        expected = {
            'axis_homed': {
                'x': False, 'y': False, 'z': False, 'a': False, 'b': False
            },
            'switches': {
                'x': True,
                'y': False,
                'z': False,
                'a': False,
                'b': False
            },
            'steps_per_mm': {
                'x': 80.0,
                'y': 80.0
            }
        }
        self.assertDictEqual(res, expected)

        self.robot.home('x', enqueue=False)
        res = self.robot.diagnostics()
        expected = {
            'axis_homed': {
                'x': True, 'y': False, 'z': False, 'a': False, 'b': False
            },
            'switches': {
                'x': False,
                'y': False,
                'z': False,
                'a': False,
                'b': False
            },
            'steps_per_mm': {
                'x': 80.0,
                'y': 80.0
            }
        }
        self.assertDictEqual(res, expected)

    def test_get_motor_caching(self):
        a_motor = self.robot.get_motor('a')
        self.assertEqual(a_motor, self.robot.get_motor('a'))

        b_motor = self.robot.get_motor('b')
        self.assertEqual(b_motor, self.robot.get_motor('b'))

    def test_get_mosfet_caching(self):
        m0 = self.robot.get_mosfet(0)
        self.assertEqual(m0, self.robot.get_mosfet(0))
        m1 = self.robot.get_mosfet(1)
        self.assertEqual(m1, self.robot.get_mosfet(1))
