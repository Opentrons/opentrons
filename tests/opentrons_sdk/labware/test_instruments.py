import unittest
from unittest import mock
from unittest.mock import call
from opentrons_sdk import containers

from opentrons_sdk.labware import instruments
from opentrons_sdk.robot import Robot
from opentrons_sdk.robot.command import Command

class PipetteTest(unittest.TestCase):

    def setUp(self):
        Robot.reset()
        self.robot = Robot.get_instance()
        # self.robot.connect(port='/dev/tty.usbmodem1421')
        # self.robot.home()

        self.robot._driver = mock.Mock()

        self.trash = containers.load('point', 'A1')
        self.tiprack = containers.load('tiprack-10ul', 'B2')

        self.plate = containers.load('96-flat', 'A2')

        self.p200 = instruments.Pipette(
            trash_container=self.trash,
            tip_racks=[self.tiprack],
            min_vol=10,  # These are variable
            axis="b",
            channels=1
        )

        self.p200.calibrate(top=0,bottom=10,blowout=12,droptip=13,max_volume=100)

    def test_aspirate(self):

        self.p200.aspirate(100, (100,0,0))

        self.assertEquals(len(self.robot._commands), 2)
        for command in self.robot._commands:
            self.assertTrue(isinstance(command, Command))

    def test_run(self):

        self.p200.aspirate(100, (100,0,0))

        self.robot.run()

        expected = [
            call.move(absolute=True, b=10, speed=None),
            call.move(absolute=True, b=0, speed=None),
            call.wait_for_arrival(),
            call.move(z=0),
            call.move(x=100, y=0),
            call.move(z=0),
            call.wait_for_arrival()
        ]

        self.assertEquals(self.robot._driver.mock_calls, expected)
