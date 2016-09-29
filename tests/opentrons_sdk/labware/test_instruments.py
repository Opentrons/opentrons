import unittest
from unittest import mock
from unittest.mock import call
from opentrons_sdk import containers

from opentrons_sdk.labware import instruments
from opentrons_sdk.robot import Robot

from opentrons_sdk.containers.placeable import unpack_location
from opentrons_sdk.containers.calibrator import Calibrator


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

    def test_unpack_location(self):

        location = (self.plate[0], (1, 0, -1))
        res = unpack_location(location)
        self.assertEquals(res, (self.plate[0], (1, 0, -1)))

        res = unpack_location(self.plate[0])
        self.assertEquals(res, (self.plate[0], self.plate[0].center()))

    def test_calibrate_placeable(self):
        robot_actual = (161.0, 416.7, 3.0)
        well = self.plate[0]
        location = (self.plate, well.center(self.plate))

        self.p200.calibrate_placeable(location, robot_actual)

        expected_result = {
            'A2': {
                'children': {
                    '96-flat': {
                        'delta': (1.0, 2.0, 3.0)
                    }}}}

        self.assertDictEqual(self.p200.calibration_data, expected_result)

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
