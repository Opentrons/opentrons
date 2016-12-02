import dill
import unittest

from opentrons import containers, instruments
from opentrons import Robot


class RobotSerializationTestCase(unittest.TestCase):
    def setUp(self):
        Robot.reset_for_tests()
        self.robot = Robot()

    def test_serializing_unconfigured_robot(self):
        robot_as_bytes = dill.dumps(self.robot)
        self.assertIsInstance(robot_as_bytes, bytes)
        reconstructed_robot = dill.loads(robot_as_bytes)

    def test_serializing_configured_robot(self):
        plate = containers.load('96-flat', 'A1')
        p200 = instruments.Pipette(axis='b', max_volume=200)

        for well in plate:
            p200.aspirate(well).delay(5).dispense(well)

        original_robot_cmd_cnts = len(self.robot._commands)
        robot_as_bytes = dill.dumps(self.robot)
        self.assertIsInstance(robot_as_bytes, bytes)
        deserialized_robot = dill.loads(robot_as_bytes)
        deserialized_robot_cmd_cnts = len(deserialized_robot._commands)
        self.assertEqual(deserialized_robot_cmd_cnts, original_robot_cmd_cnts)

        original_robot_instruments = self.robot.get_instruments()
        deserialized_robot_instruments = self.robot.get_instruments()
        self.assertEqual(
            len(original_robot_instruments),
            len(deserialized_robot_instruments),
        )
        self.assertEqual(
            original_robot_instruments[0][0],
            deserialized_robot_instruments[0][0],
        )

    def test_serializing_configured_robot_with_2_instruments(self):
        plate = containers.load('96-flat', 'A1')
        p200 = instruments.Pipette(axis='b', max_volume=200)
        p100 = instruments.Pipette(axis='a', max_volume=100)

        for well in plate:
            p200.aspirate(well).delay(5).dispense(well)

        for well in plate[::-1]:
            p100.aspirate(well).delay(5).dispense(well)

        original_robot_cmd_cnts = len(self.robot._commands)
        robot_as_bytes = dill.dumps(self.robot)
        self.assertIsInstance(robot_as_bytes, bytes)
        deserialized_robot = dill.loads(robot_as_bytes)
        deserialized_robot_cmd_cnts = len(deserialized_robot._commands)
        self.assertEqual(deserialized_robot_cmd_cnts, original_robot_cmd_cnts)

        original_robot_instruments = self.robot.get_instruments()
        deserialized_robot_instruments = self.robot.get_instruments()
        self.assertEqual(
            len(original_robot_instruments),
            len(deserialized_robot_instruments),
            )
        self.assertEqual(
            original_robot_instruments[0][0],
            deserialized_robot_instruments[0][0],
            )
