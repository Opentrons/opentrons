import unittest
from unittest import mock
from unittest.mock import call
from opentrons_sdk import containers

from opentrons_sdk.labware import instruments
from opentrons_sdk.robot import Robot


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
            min_volume=10,  # These are variable
            axis="b",
            channels=1
        )

        self.p200.calibrate_plunger(top=0, bottom=10, blow_out=12, drop_tip=13)
        self.p200.set_max_volume(200)

    def test_empty_aspirate(self):

        self.p200.aspirate(100)

        self.robot.run()

        expected = [
            call.move(absolute=True, b=10, speed=None),
            call.move(absolute=False, b=-5, speed=None),
            call.wait_for_arrival()
        ]

        self.assertEquals(self.robot._driver.mock_calls, expected)

    def test_non_empty_aspirate(self):

        self.p200.aspirate(100)
        self.p200.aspirate(20)

        self.robot.run()

        expected = [
            call.move(absolute=True, b=10, speed=None),
            call.move(absolute=False, b=-5, speed=None),
            call.wait_for_arrival(),
            call.move(absolute=False, b=-1, speed=None),
            call.wait_for_arrival()
        ]

        self.assertEquals(self.robot._driver.mock_calls, expected)

    def test_aspirate_no_args(self):
        self.p200.aspirate()

        self.robot.run()

        expected = [
            call.move(absolute=True, b=10, speed=None),
            call.move(absolute=False, b=-10, speed=None),
            call.wait_for_arrival()
        ]

        self.assertEquals(self.robot._driver.mock_calls, expected)

    def test_invalid_aspirate(self):
        self.assertRaises(RuntimeWarning, self.p200.aspirate, 500)
        self.assertRaises(IndexError, self.p200.aspirate, -1)

    def test_dispense(self):
        self.p200.aspirate(100)
        self.p200.dispense(20)

        self.robot.run()

        expected = [
            call.move(absolute=True, b=10, speed=None),
            call.move(absolute=False, b=-5, speed=None),
            call.wait_for_arrival(),
            call.move(absolute=False, b=1, speed=None),
            call.wait_for_arrival()
        ]

        self.assertEquals(self.robot._driver.mock_calls, expected)

    def test_dispense_no_args(self):
        self.p200.aspirate(100)
        self.p200.dispense()

        self.robot.run()

        expected = [
            call.move(absolute=True, b=10, speed=None),
            call.move(absolute=False, b=-5, speed=None),
            call.wait_for_arrival(),
            call.move(absolute=False, b=5, speed=None),
            call.wait_for_arrival()
        ]

        self.assertEquals(self.robot._driver.mock_calls, expected)

    def test_invalid_dispense(self):
        self.assertRaises(RuntimeWarning, self.p200.dispense, 1)
        self.assertRaises(IndexError, self.p200.dispense, -1)

    def test_blow_out(self):

        self.p200.blow_out()

        self.robot.run()

        expected = [
            call.move(absolute=True, b=12, speed=None),
            call.wait_for_arrival()
        ]

        self.assertEquals(self.robot._driver.mock_calls, expected)

    def test_drop_tip(self):

        self.p200.drop_tip()

        self.robot.run()

        expected = [
            call.move(absolute=True, b=13, speed=None),
            call.home('b'),
            call.wait_for_arrival()
        ]

        self.assertEquals(self.robot._driver.mock_calls, expected)

    def test_pick_up_tip(self):
        well = self.tiprack['A1']

        self.p200.pick_up_tip(well)
        self.robot.run()

        expected = [
            call.move(z=0),
            call.move(y=0, x=0),
            call.move(z=0),
            call.wait_for_arrival(),
            call.move(z=-6),
            call.move(z=0),
            call.move(z=-6),
            call.move(z=0),
            call.move(z=-6),
            call.move(z=0),
            call.wait_for_arrival(),
            call.resume(),
            call.home('z')
        ]
        self.assertEquals(self.robot._driver.mock_calls, expected)
