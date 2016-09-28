import unittest
from unittest import mock
from unittest.mock import call

from opentrons_sdk.labware import containers, instruments
from opentrons_sdk.protocol.robot import Robot

class RobotTest(unittest.TestCase):

	def setUp(self):
		Robot.reset()
		self.robot = Robot.get_instance()
		# self.robot.connect(port='/dev/tty.usbmodem1421')
		# self.robot.home()
		self.robot.simulate()
		self.robot._driver = mock.Mock()

	def test_robot_move_to(self):
		self.robot.move_to((100,0,0))
		self.robot.run()
		expected = [ call.move(z=0), call.move(x=100, y=0), call.move(z=0), call.wait_for_arrival() ]
		self.assertEquals(self.robot._driver.mock_calls, expected)
		