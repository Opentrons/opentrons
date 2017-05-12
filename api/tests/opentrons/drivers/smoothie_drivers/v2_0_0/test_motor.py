import time
from threading import Thread
import unittest

from opentrons import Robot, drivers
from opentrons.util.vector import Vector


class OpenTronsTest(unittest.TestCase):

    def setUp(self):
        self.robot = Robot.get_instance()

        # set this to True if testing with a robot connected
        # testing while connected allows the response handlers
        # and serial handshakes to be tested

        options = {
            'firmware': 'edge-1c222d9NOMSD',
            'limit_switches': True,
            'config': {
                'alpha_steps_per_mm': 80.0,
                'beta_steps_per_mm': 80.0
            }
        }

        self.robot.disconnect()
        self.robot.connect(options=options)

        self.motor = self.robot._driver

    def test_is_simulating(self):
        self.assertTrue(self.motor.is_simulating())

    def test_reset(self):
        self.motor.reset()
        self.assertFalse(self.motor.is_connected())

    def test_write_with_lost_connection(self):
        self.motor.connection.serial_port.is_open = False
        old_method = getattr(self.motor, 'is_connected')

        def _temp():
            return True

        setattr(self.motor, 'is_connected', _temp)

        self.assertTrue(self.motor.is_connected())
        self.assertRaises(RuntimeError, self.motor.calm_down)
        setattr(self.motor, 'is_connected', old_method)

    def test_write_after_disconnect(self):
        self.motor.disconnect()
        self.assertRaises(RuntimeError, self.motor.calm_down)

    def test_version_compatible(self):
        self.motor.versions_compatible()

        kwargs = {
            'options': {
                'firmware': 'v2.0.0',
                'config': {
                    'version': 'v3.1.2',
                    'ot_version': 'hoodie'
                }
            }
        }
        self.assertRaises(RuntimeError, self.robot.connect, **kwargs)

    def test_invalid_coordinate_system(self):
        self.assertRaises(ValueError, self.motor.set_coordinate_system, 'andy')

    def test_message_timeout(self):
        self.robot._driver.connection.flush_input()
        self.assertRaises(RuntimeWarning, self.motor.readline_from_serial, 0.1)

    def test_set_plunger_speed(self):
        self.motor.set_plunger_speed(400, 'a')
        self.assertRaises(ValueError, self.motor.set_plunger_speed, 400, 'x')

    def test_set_speed(self):
        self.motor.set_speed(4000)
        self.assertEquals(self.motor.speeds['x'], 4000)
        self.assertEquals(self.motor.speeds['y'], 4000)

        self.motor.set_speed(3000, z=2000, a=700, b=600)
        self.assertEquals(self.motor.speeds['x'], 3000)
        self.assertEquals(self.motor.speeds['y'], 3000)
        self.assertEquals(self.motor.speeds['z'], 2000)
        self.assertEquals(self.motor.speeds['a'], 700)
        self.assertEquals(self.motor.speeds['b'], 600)

    def test_get_connected_port(self):
        res = self.motor.get_connected_port()
        self.assertEquals(res, drivers.VIRTUAL_SMOOTHIE_PORT)
        self.motor.disconnect()
        res = self.motor.get_connected_port()
        self.assertEquals(res, None)
        self.assertFalse(self.motor.is_connected())

    def test_get_dimensions(self):
        self.motor.ot_version = None
        res = self.motor.get_dimensions()
        self.assertEquals(res, Vector(400.00, 400.00, 100.00))

    def test_pause_resume(self):
        self.motor.home()

        self.motor.pause()

        def _move_head():
            self.motor.move_head(x=100, y=0, z=0)

        thread = Thread(target=_move_head)
        thread.start()

        self.motor.resume()
        thread.join()

        coords = self.motor.get_head_position()
        expected_coords = {
            'target': (100, 0, 0),
            'current': (100, 0, 0)
        }
        self.assertDictEqual(coords, expected_coords)

    def test_stop(self):
        self.motor.home()

        self.motor.pause()

        def _move_head():
            self.assertRaises(
                RuntimeWarning,
                self.motor.move_head,
                **{'x': 100, 'y': 0, 'z': 0}
            )

        thread = Thread(target=_move_head)
        thread.start()

        self.motor.stop()

        thread.join()

        coords = self.motor.get_head_position()
        expected_coords = {
            'target': (0, 400, 100),
            'current': (0, 400, 100)
        }
        self.assertDictEqual(coords, expected_coords)

        self.motor.move_head(x=100, y=0, z=0)
        coords = self.motor.get_head_position()
        expected_coords = {
            'target': (100, 0, 0),
            'current': (100, 0, 0)
        }
        self.assertDictEqual(coords, expected_coords)

    def test_halt(self):
        self.motor.home()

        self.motor.pause()

        def _move_head():
            self.assertRaises(
                RuntimeWarning,
                self.motor.move_head,
                **{'x': 100, 'y': 0, 'z': 0}
            )

        thread = Thread(target=_move_head)
        thread.start()

        self.motor.halt()

        thread.join()

        coords = self.motor.get_head_position()
        expected_coords = {
            'target': (0, 400, 100),
            'current': (0, 400, 100)
        }
        self.assertDictEqual(coords, expected_coords)

        self.motor.move_head(x=100, y=0, z=0)
        coords = self.motor.get_head_position()
        expected_coords = {
            'target': (100, 0, 0),
            'current': (100, 0, 0)
        }
        self.assertDictEqual(coords, expected_coords)

    def test_get_position(self):
        self.motor.home()
        self.motor.ot_version = None
        self.motor.move_head(x=100)
        coords = self.motor.get_head_position()
        expected_coords = {
            'target': (100, 400, 100),
            'current': (100, 400, 100)
        }
        self.assertDictEqual(coords, expected_coords)

    def test_home(self):

        self.motor.home('x', 'y')
        pos = self.motor.get_head_position()['current']
        self.assertEquals(pos['x'], 0)

        self.motor.home('ba')
        pos = self.motor.get_plunger_positions()['current']
        self.assertEquals(pos['a'], 0)
        self.assertEquals(pos['b'], 0)

    def test_limit_hit_exception(self):
        self.motor.home()
        try:
            self.motor.move_head(x=-100)
            self.motor.wait_for_arrival()
        except RuntimeWarning as e:
            self.assertEqual(
                str(
                    RuntimeWarning('Robot Error: limit switch hit')), str(e))

        self.motor.home()

    def test_move_x(self):
        self.motor.ot_version = None
        self.motor.move_head(x=100)
        pos = self.motor.get_head_position()['current']
        self.assertEquals(pos['x'], 100)

    def test_move_y(self):
        self.motor.ot_version = None
        self.motor.move_head(y=100)
        pos = self.motor.get_head_position()['current']
        self.assertEquals(pos['y'], 100)

    def test_move_z(self):
        self.motor.ot_version = None
        self.motor.move_head(z=30)
        pos = self.motor.get_head_position()['current']
        self.assertEquals(pos['z'], 30)

    def test_send_command(self):
        res = self.motor.send_command('G0 X1 Y1 Z1')
        self.assertEquals(res, 'ok')
        if self.motor.firmware_version != 'v1.0.5':
            self.assertEquals(self.motor.readline_from_serial(), 'ok')
        pos = self.motor.get_head_position()['current']
        self.assertEquals(pos['x'], 1)
        self.assertEquals(pos['y'], 399)
        self.assertEquals(pos['z'], 99)

    def test_send_command_with_kwargs(self):
        res = self.motor.send_command('G0', X=1, Y=2, Z=3)
        self.assertEquals(res, 'ok')
        if self.motor.firmware_version != 'v1.0.5':
            self.assertEquals(self.motor.readline_from_serial(), 'ok')
        pos = self.motor.get_head_position()['current']
        self.assertEquals(pos['x'], 1)
        self.assertEquals(pos['y'], 398)
        self.assertEquals(pos['z'], 97)

    def test_wait(self):
        # do not use Virtual Smoothie for this test
        old_method = getattr(self.motor.connection, 'device')

        def _temp():
            return int()

        setattr(self.motor.connection, 'device', _temp)

        start_time = time.time()
        self.motor.wait(1.234)
        end_time = time.time()
        self.assertAlmostEquals(end_time - start_time, 1.234, places=1)

        start_time = time.time()
        self.motor.wait(1.0)
        end_time = time.time()
        self.assertAlmostEquals(end_time - start_time, 1.0, places=1)

        setattr(self.motor.connection, 'device', old_method)

    def test_wait_for_arrival(self):
        self.motor.home()
        self.motor.move_head(x=200, y=200)
        self.motor.move_head(z=30)
        self.motor.wait_for_arrival()

        old_coords = dict(self.motor.connection.serial_port.coordinates)
        vs = self.motor.connection.serial_port
        for ax in vs.coordinates['target'].keys():
            vs.coordinates['target'][ax] += 10
        self.assertRaises(RuntimeError, self.motor.wait_for_arrival)
        vs.coordinates = old_coords

    def test_move_relative(self):
        self.motor.home()
        self.motor.move_head(x=100, y=100, z=100)
        self.motor.move_head(x=0, mode='relative')
        self.motor.move_head(x=100, mode='absolute')

    def test_calibrate_steps_per_mm(self):
        self.motor.home()
        self.motor.set_steps_per_mm('x', 80.0)
        self.motor.set_steps_per_mm('y', 80.0)
        self.motor.set_steps_per_mm('z', 400)
        self.motor.move_head(x=200, y=200)

        self.motor.calibrate_steps_per_mm('x', 200, 198)
        self.motor.calibrate_steps_per_mm('y', 200, 202)
        self.motor.calibrate_steps_per_mm('z', 100, 101)

        new_x_steps = self.motor.get_steps_per_mm('x')
        new_y_steps = self.motor.get_steps_per_mm('y')
        new_z_steps = self.motor.get_steps_per_mm('z')

        exptected_x = round((200 / 198) * 80.0, 2)
        exptected_y = round((200 / 202) * 80.0, 2)
        exptected_z = round((100 / 101) * 400, 2)

        self.assertEqual(exptected_x, new_x_steps)
        self.assertEqual(exptected_y, new_y_steps)
        self.assertEqual(exptected_z, new_z_steps)

        self.assertRaises(ValueError, self.motor.get_steps_per_mm, 'd')
        self.assertRaises(ValueError, self.motor.set_steps_per_mm, 'd', 80.0)

        self.motor.set_steps_per_mm('x', 80.0)
        self.motor.set_steps_per_mm('y', 80.0)
        self.motor.set_steps_per_mm('z', 400)

    def test_get_endstop_switches(self):
        res = self.motor.get_endstop_switches()
        expected = {
            'x': False,
            'y': False,
            'z': False,
            'a': False,
            'b': False
        }
        self.assertEquals(res, expected)
        try:
            self.motor.move_head(x=-100)
            self.motor.move_head(x=-101)
        except Exception:
            pass
        res = self.motor.get_endstop_switches()
        expected = {
            'x': True,
            'y': False,
            'z': False,
            'a': False,
            'b': False
        }
        self.assertEquals(res, expected)

    def test_set_mosfet(self):
        res = self.motor.set_mosfet(0, True)
        self.assertTrue(res)

        res = self.motor.set_mosfet(5, False)
        self.assertTrue(res)

        self.assertRaises(IndexError, self.motor.set_mosfet, 6, True)

    def test_power_on_off(self):
        self.motor.power_on()

        self.motor.power_off()

        assert True
