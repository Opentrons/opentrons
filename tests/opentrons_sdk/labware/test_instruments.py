import unittest
from unittest import mock

from opentrons_sdk.labware import containers, instruments
from opentrons_sdk.protocol import Robot

class PipetteTest(unittest.TestCase):

    def setUp(self):
        Robot.reset()
        self.robot = Robot.get_instance()
        self.robot.connect(port='/dev/tty.usbmodem1421')
        self.robot.home()

        # self.robot.move_to = mock.Mock()

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

        # self.p200.motor = mock.Mock()

    def test_aspirate(self):
        self.p200.aspirate(100, (100,0,0))

        self.p200.aspirate(100, self.plate['H12'])

        # expected = [ mock.call.move(z=0), mock.call.move(x=100, y=0), mock.call.move(z=0) ]
        # self.assertEquals(self.robot.move_to.mock_calls, expected)

        # expected = [ mock.call.move(1) ]
        # self.assertEquals(self.p200.motor.mock_calls, expected)