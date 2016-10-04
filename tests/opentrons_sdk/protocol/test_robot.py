import unittest
from unittest import mock
from unittest.mock import call

from opentrons_sdk.robot.robot import Robot
from opentrons_sdk.containers.placeable import Deck

class RobotTest(unittest.TestCase):
	def setUp(self):
		Robot.reset()
		self.robot = Robot.get_instance()
		# self.robot.connect(port='/dev/tty.usbmodem1421')
		# self.robot.home()
		self.robot._driver = mock.Mock()

	def test_robot_move_to(self):
		self.robot.move_to((Deck(), (100,0,0)))
		self.robot.run()
		expected = [ call.move(z=10), call.move(x=100, y=0), call.move(z=0), call.wait_for_arrival() ]
		self.assertEquals(self.robot._driver.mock_calls, expected)

	def test_robot_pause_and_resume(self):
		self.robot.move_to((Deck(), (100,0,0)))
		self.robot.pause()
		self.robot.move_to((Deck(), (101,0,0)))
		self.robot.run()
		self.assertEquals(len(self.robot._commands), 1)
		self.robot.resume()
		self.assertEquals(len(self.robot._commands), 0)
