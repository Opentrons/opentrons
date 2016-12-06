import dill
import unittest

from opentrons import containers, instruments
from opentrons import Robot
from opentrons.util.singleton import Singleton


class RobotSerializationTestCase(unittest.TestCase):
    def setUp(self):
        Robot.reset_for_tests()
        self.robot = Robot()

    def test_serializing_and_deserializing_unconfigured_robot(self):
        robot_as_bytes = dill.dumps(self.robot)
        self.assertIsInstance(robot_as_bytes, bytes)
        dill.loads(robot_as_bytes)

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
        trash = containers.load('point', 'A2')
        tiprack = containers.load('tiprack-200ul', 'A3')

        p200 = instruments.Pipette(
            axis='b',
            tip_racks=[tiprack],
            trash_container=trash,
            max_volume=200
        )
        p100 = instruments.Pipette(
            axis='a',
            channels=8,
            tip_racks=[tiprack],
            trash_container=trash,
            max_volume=100
        )
        self.make_commands(p200, plate, p100, plate)

        original_robot_cmds_txt = self.robot.commands()
        original_robot_cmd_cnts = len(self.robot._commands)

        robot_as_bytes = dill.dumps(self.robot)
        self.assertIsInstance(robot_as_bytes, bytes)

        deserialized_robot = dill.loads(robot_as_bytes)
        deserialized_robot_cmd_cnts = len(deserialized_robot._commands)

        # Check commands are unmarshalled
        self.assertEqual(deserialized_robot_cmd_cnts, original_robot_cmd_cnts)

        # Check instruments are unmarshalled
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

        # Set deserialized robot as the global robot and attempt to
        # reconstruct the same commands again
        Singleton._instances[Robot] = deserialized_robot
        deserialized_robot._commands = []
        r2_p200 = deserialized_robot_instruments[0][1]
        r2_p100 = deserialized_robot_instruments[1][1]
        self.make_commands(r2_p200, plate, r2_p100, plate)
        self.assertEqual(
            original_robot_cmd_cnts,
            len(deserialized_robot._commands)
        )
        self.assertListEqual(
            original_robot_cmds_txt,
            deserialized_robot.commands()
        )

    def make_commands(self, inst1, inst1_plate, inst2, inst2_plate):
        for well in inst1_plate:
            inst1.aspirate(well).delay(5).dispense(well)
        for row in inst2_plate.rows[::-1]:
            inst2.aspirate(row).delay(5).dispense(row)
