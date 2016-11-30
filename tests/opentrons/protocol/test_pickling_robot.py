import dill
import unittest

from opentrons import containers, instruments
from opentrons import Robot


class PicklingRobotTestCase(unittest.TestCase):
    def setUp(self):
        Robot.reset_for_tests()
        self.robot = Robot()

    def test_pickling_unconfigured_robot(self):
        robot_as_bytes = dill.dumps(self.robot)
        self.assertIsInstance(robot_as_bytes, bytes)
        reconstructed_robot = dill.loads(robot_as_bytes)

    def test_pickling_configured_robot(self):
        plate = containers.load('96-flat', 'A1')
        p200 = instruments.Pipette(axis='b', max_volume=200)

        for well in plate:
            p200.aspirate(well).delay(5).dispense(well)

        original_robot_cmd_cnts = len(self.robot._commands)
        robot_as_bytes = dill.dumps(self.robot)
        self.assertIsInstance(robot_as_bytes, bytes)
        reconstructed_robot = dill.loads(robot_as_bytes)
        reconstructed_robot_cmd_cnts = len(reconstructed_robot._commands)
        self.assertEqual(reconstructed_robot_cmd_cnts, original_robot_cmd_cnts)
