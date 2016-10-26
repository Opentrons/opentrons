import unittest
from unittest import mock
from opentrons import containers

from opentrons import instruments
from opentrons.robot import Robot


class MagbeadTest(unittest.TestCase):

    def setUp(self):
        self.robot = Robot.reset_for_tests()
        options = {
            'limit_switches': False,
            'firmware': 'v1.0.5',
            'config': {
                'ot_version': 'one_pro',
                'version': 'v1.0.3',        # config version
                'alpha_steps_per_mm': 80.0,
                'beta_steps_per_mm': 80.0
            }
        }
        self.robot.connect(options=options)
        self.robot.home()

        self.plate = containers.load('96-flat', 'A2')
        self.magbead = instruments.Magbead(mosfet=0, container=self.plate)

        self.robot._driver.set_mosfet = mock.Mock()
        self.robot._driver.wait = mock.Mock()

    def test_magbead_engage(self):
        self.magbead.engage()
        self.robot.run()

        calls = self.robot._driver.set_mosfet.mock_calls
        expected = [mock.call(0, True)]
        self.assertEquals(calls, expected)

    def test_magbead_disengage(self):
        self.magbead.engage()
        self.magbead.disengage()
        self.robot.run()

        calls = self.robot._driver.set_mosfet.mock_calls
        expected = [mock.call(0, True), mock.call(0, False)]
        self.assertEquals(calls, expected)

    def test_magbead_delay(self):
        self.magbead.engage()
        self.magbead.delay(2.2)
        self.magbead.disengage()
        self.robot.run()

        calls = self.robot._driver.set_mosfet.mock_calls
        expected = [mock.call(0, True), mock.call(0, False)]
        self.assertEquals(calls, expected)

        calls = self.robot._driver.wait.mock_calls
        expected = [mock.call(2.2)]
        self.assertEquals(calls, expected)
