import unittest

from opentrons_sdk.drivers.motor import CNCDriver


class OpenTronsTest(unittest.TestCase):

    def setUp(self):

        # set this to True if testing with a robot connected
        # testing while connected allows the response handlers
        # and serial handshakes to be tested

        self.motor = CNCDriver()

        self.smoothie_connected = False

        myport = ''
        self.smoothie_connected = True
        success = self.motor.connect(myport)
        self.assertTrue(success)

    def tearDown(self):
        self.motor.disconnect()

    def test_get_position(self):
        self.motor.home()
        self.motor.move(x=100)
        self.motor.wait_for_arrival()
        coords = self.motor.get_head_position()
        expected_coords = {
            'target': (100, 250, 120),
            'current': (100, 250, 120)
        }
        self.assertDictEqual(coords, expected_coords)

    def test_home(self):
        success = self.motor.home('x', 'y')
        self.assertTrue(success)

        success = self.motor.home('ba')
        self.assertTrue(success)

    def test_limit_hit_exception(self):
        self.motor.home()
        try:
            self.motor.move(x=-100)
            self.motor.wait_for_arrival()
        except RuntimeWarning as e:
            self.assertEqual(str(RuntimeWarning('limit switch hit')), str(e))

        self.motor.home()

    def test_move_x(self):
        success = self.motor.move(x=100)
        self.assertTrue(success)

    def test_move_y(self):
        success = self.motor.move(y=100)
        self.assertTrue(success)

    def test_move_z(self):
        success = self.motor.move(z=30)
        self.assertTrue(success)

    def test_send_command(self):
        success = self.motor.send_command('G0 X1 Y1 Z1')
        self.assertTrue(success)

    def test_send_command_with_kwargs(self):
        success = self.motor.send_command('G0', x=1, y=2, z=3)
        self.assertTrue(success)

    def test_wait(self):
        success = self.motor.wait(1.234)
        self.assertTrue(success)

    def test_wait_for_arrival(self):
        self.motor.home()
        self.motor.move(x=200, y=200)
        self.motor.move(z=30)
        success = self.motor.wait_for_arrival()
        self.assertTrue(success)

    def test_move_relative(self):
        self.motor.home()
        self.motor.move(x=100, y=100, z=100)
        self.motor.move(x=0, absolute=False)
        self.motor.move(x=100, absolute=True)
        print(self.motor.get_head_position())
