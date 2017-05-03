import threading
import unittest
from unittest import mock

from opentrons.robot.robot import Robot
from opentrons.containers.placeable import Deck
from opentrons import instruments, containers, drivers
from opentrons.util.vector import Vector


class RobotTest(unittest.TestCase):
    def setUp(self):
        Robot.reset_for_tests()
        self.robot = Robot.get_instance()

        self.smoothie_version = 'edge-1c222d9NOMSD'

        self.robot.reset()
        self.robot.connect(options={'firmware': self.smoothie_version})
        self.robot.home(enqueue=False)

    def test_firmware_verson(self):
        self.assertEquals(
            self.smoothie_version, self.robot._driver.firmware_version)

    def test_add_container(self):
        c1 = self.robot.add_container('96-flat', 'A1')
        res = self.robot.containers()
        expected = {
            '96-flat': c1
        }
        self.assertEquals(res, expected)

        c2 = self.robot.add_container('96-flat', 'A2', 'my-special-plate')
        res = self.robot.containers()
        expected = {
            '96-flat': c1,
            'my-special-plate': c2
        }
        self.assertEquals(res, expected)

    def test_comment(self):
        self.robot.clear_commands()
        self.robot.comment('hello')
        self.assertEquals(len(self.robot.commands()), 1)
        self.assertEquals(self.robot._commands[0].description, 'hello')

    def test_home_after_disconnect(self):
        self.robot.disconnect()
        self.assertRaises(RuntimeError, self.robot.home)

    def test_simulate(self):
        self.robot.disconnect()
        p200 = instruments.Pipette(axis='b', name='my-fancy-pancy-pipette')
        p200.aspirate().dispense()
        self.robot.simulate()
        self.assertEquals(len(self.robot._commands), 2)
        self.assertEquals(self.robot.smoothie_drivers['live'], None)

    def test_stop_run(self):
        p200 = instruments.Pipette(axis='b', name='my-fancy-pancy-pipette')
        p200.calibrate_plunger(top=0, bottom=5, blow_out=6, drop_tip=7)

        for i in range(1000):
            p200.aspirate().dispense()

        res = None

        def _run():
            nonlocal res
            self.assertRaises(RuntimeError, self.robot.run)

        thread = threading.Thread(target=_run)
        thread.start()

        self.robot.stop()

        thread.join()

    def test_exceptions_during_run(self):
        p200 = instruments.Pipette(axis='b', name='my-fancy-pancy-pipette')

        def _do():
            return 'hello' / 3

        p200.create_command(
            do=_do,
            enqueue=True)

        self.assertRaises(RuntimeError, self.robot.run)

    def test_calibrated_max_dimension(self):

        expected = self.robot._deck.max_dimensions(self.robot._deck)
        res = self.robot._calibrated_max_dimension()
        self.assertEquals(res, expected)

        p200 = instruments.Pipette(axis='b', name='my-fancy-pancy-pipette')
        plate = containers.load('96-flat', 'A1')
        self.robot.move_head(x=10, y=10, z=10)
        p200.calibrate_position((plate, Vector(0, 0, 0)))

        res = self.robot._calibrated_max_dimension()

        expected = Vector(plate.max_dimensions(plate)) + Vector(10, 10, 10)
        self.assertEquals(res, expected)

    def test_create_arc(self):
        p200 = instruments.Pipette(axis='b', name='my-fancy-pancy-pipette')
        plate = containers.load('96-flat', 'A1')
        plate2 = containers.load('96-flat', 'B1')

        self.robot.move_head(x=10, y=10, z=10)
        p200.calibrate_position((plate, Vector(0, 0, 0)))
        self.robot.move_head(x=10, y=10, z=100)
        p200.calibrate_position((plate2, Vector(0, 0, 0)))

        res = self.robot._create_arc((0, 0, 0), plate[0])
        expected = [
            {'z': 100},
            {'x': 0, 'y': 0},
            {'z': 0}
        ]
        self.assertEquals(res, expected)

        res = self.robot._create_arc((0, 0, 0), plate[0])
        expected = [
            {'z': 20.5 + 5},
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
        self.robot.move_to((Deck(), (100, 0, 0)))
        self.robot.run()
        position = self.robot._driver.get_head_position()['current']
        self.assertEqual(position, (100, 0, 0))

    def test_move_head(self):
        self.robot.move_head(x=100, y=0, z=20)
        current = self.robot._driver.get_head_position()['current']
        self.assertEquals(current, (100, 0, 20))

    def test_home(self):

        self.robot.disconnect()
        self.robot.connect()

        self.assertDictEqual(self.robot.axis_homed, {
            'x': False, 'y': False, 'z': False, 'a': False, 'b': False
        })

        self.robot.clear_commands()
        self.robot.home('xa', enqueue=True)
        self.assertDictEqual(self.robot.axis_homed, {
            'x': False, 'y': False, 'z': False, 'a': False, 'b': False
        })
        self.assertEquals(len(self.robot._commands), 1)
        self.robot.run()
        self.assertDictEqual(self.robot.axis_homed, {
            'x': True, 'y': False, 'z': False, 'a': True, 'b': False
        })

        self.robot.clear_commands()
        self.robot.home(enqueue=False)
        self.assertEquals(len(self.robot._commands), 0)

        self.assertDictEqual(self.robot.axis_homed, {
            'x': True, 'y': True, 'z': True, 'a': True, 'b': True
        })

    def test_robot_pause_and_resume(self):
        self.robot.move_to((Deck(), (100, 0, 0)), enqueue=True)
        self.robot.move_to((Deck(), (101, 0, 0)), enqueue=True)
        self.assertEqual(len(self.robot._commands), 2)

        self.robot.pause()

        def _run():
            self.robot.run()

        thread = threading.Thread(target=_run)
        thread.start()
        self.robot.resume()
        thread.join(0.5)

        self.assertEquals(thread.is_alive(), False)
        self.assertEqual(len(self.robot._commands), 2)

        self.robot.clear_commands()
        self.assertEqual(len(self.robot._commands), 0)

        self.robot.move_to((Deck(), (100, 0, 0)), enqueue=True)
        self.robot.move_to((Deck(), (101, 0, 0)), enqueue=True)

        def _run():
            self.robot.run()

        self.robot.pause()

        thread = threading.Thread(target=_run)
        thread.start()
        thread.join(0.01)

        self.assertEquals(thread.is_alive(), True)
        self.assertEqual(len(self.robot._commands) > 0, True)

        self.robot.resume()

        thread.join(1)
        self.assertEqual(len(self.robot._commands), 2)

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

    @mock.patch('requests.get')
    @mock.patch('requests.post')
    def test_send_to_app_with_unconfigured_robot(self, req_get, req_post):
        def fake_get(url, data, headers):
            res = mock.Mock()
            res.ok = True
            return res

        def fake_post(*args, **kwargs):
            res = mock.Mock()
            res.ok = True
            return res
        req_get.side_effect = fake_get
        req_post.side_effect = fake_post
        self.robot.send_to_app()
        self.assertTrue(req_get.called)
        self.assertTrue(req_post.called)

    @mock.patch('requests.get')
    @mock.patch('requests.post')
    def test_send_to_app_with_configured_robot(self, req_get, req_post):
        def fake_get(url, data, headers):
            res = mock.Mock()
            res.ok = True
            return res

        def fake_post(*args, **kwargs):
            res = mock.Mock()
            res.ok = True
            return res
        plate = containers.load('96-flat', 'A1')
        p200 = instruments.Pipette(axis='b', max_volume=200)

        for well in plate:
            p200.aspirate(well).delay(5).dispense(well)

        req_get.side_effect = fake_get
        req_post.side_effect = fake_post
        self.robot.send_to_app()
        self.assertTrue(req_get.called)
        self.assertTrue(req_post.called)
