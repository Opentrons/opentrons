import unittest
from unittest import mock
from opentrons_sdk import containers

from opentrons_sdk import instruments
from opentrons_sdk.robot import Robot


class MagbeadTest(unittest.TestCase):

    def setUp(self):
        self.robot = Robot.reset()
        self.robot.connect()
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
