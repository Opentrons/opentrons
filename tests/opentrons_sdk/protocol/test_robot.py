import unittest

from opentrons_sdk.robot.robot import Robot
from opentrons_sdk.containers.placeable import Deck


class RobotTest(unittest.TestCase):
    def setUp(self):
        Robot.reset()
        self.robot = Robot.get_instance()
        self.robot.connect(port='')
        self.robot.home()

    def test_robot_move_to(self):
        self.robot.move_to((Deck(), (100, 0, 0)))
        self.robot.run()
        position = self.robot._driver.get_head_position()['current']
        self.assertEqual(position, (100, 0, 0))

    def test_robot_pause_and_resume(self):
        self.robot.move_to((Deck(), (100, 0, 0)))
        self.robot.pause()
        self.robot.move_to((Deck(), (101, 0, 0)))
        self.robot.run()
        self.assertEqual(len(self.robot._commands), 2)
        self.robot.resume()
        self.assertEqual(len(self.robot._commands), 0)
