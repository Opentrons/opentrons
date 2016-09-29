import unittest
from opentrons_sdk import containers

from opentrons_sdk.labware import instruments
from opentrons_sdk.robot import Robot

from opentrons_sdk.containers.placeable import unpack_location


class PipetteTest(unittest.TestCase):

    def setUp(self):
        Robot.reset()
        self.robot = Robot.get_instance()
        # self.robot.connect(port='/dev/tty.usbmodem1421')
        # self.robot.home()

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
        x, y, z = (161.0, 416.7, 3.0)
        well = self.plate[0]
        pos = well.from_center(x=0, y=0, z=-1, reference=self.plate)
        location = (self.plate, pos)

        self.robot._driver.move(x=x, y=y, z=z)

        self.p200.calibrate_position(location)

        expected_calibration_data = {
            'A2': {
                'children': {
                    '96-flat': {
                        'delta': (1.0, 2.0, 3.0)
                    }}}}

        self.assertDictEqual(
            self.p200.calibration_data,
            expected_calibration_data)

    def test_aspirate_move_to(self):
        x, y, z = (161.0, 416.7, 3.0)
        well = self.plate[0]
        pos = well.from_center(x=0, y=0, z=-1, reference=self.plate)
        location = (self.plate, pos)

        self.robot._driver.move(x=x, y=y, z=z)

        self.p200.calibrate_position(location)

        self.p200.aspirate(100, location)
        self.robot.run()

        current_pos = self.robot._driver.get_position()['current']

        self.assertDictEqual(
            current_pos,
            {'x': 161.0, 'y': 416.7, 'z': 3.0, 'a': 0, 'b': 5.0}
        )

    def test_dispense_move_to(self):
        x, y, z = (161.0, 416.7, 3.0)
        well = self.plate[0]
        pos = well.from_center(x=0, y=0, z=-1, reference=self.plate)
        location = (self.plate, pos)

        self.robot._driver.move(x=x, y=y, z=z)

        self.p200.calibrate_position(location)

        self.p200.aspirate(100, location)
        self.p200.dispense(100, location)
        self.robot.run()

        current_pos = self.robot._driver.get_position()['current']

        self.assertDictEqual(
            current_pos,
            {'x': 161.0, 'y': 416.7, 'z': 3.0, 'a': 0, 'b': 10.0}
        )

    def test_blow_out_move_to(self):
        x, y, z = (161.0, 416.7, 3.0)
        well = self.plate[0]
        pos = well.from_center(x=0, y=0, z=-1, reference=self.plate)
        location = (self.plate, pos)

        self.robot._driver.move(x=x, y=y, z=z)

        self.p200.calibrate_position(location)

        self.p200.blow_out(location)
        self.robot.run()

        current_pos = self.robot._driver.get_position()['current']

        self.assertDictEqual(
            current_pos,
            {'x': 161.0, 'y': 416.7, 'z': 3.0, 'a': 0, 'b': 12.0}
        )

    def test_drop_tip_move_to(self):
        x, y, z = (161.0, 416.7, 3.0)
        well = self.plate[0]
        pos = well.from_center(x=0, y=0, z=-1, reference=self.plate)
        location = (self.plate, pos)

        self.robot._driver.move(x=x, y=y, z=z)

        self.p200.calibrate_position(location)

        self.p200.drop_tip(location)
        self.robot.run()

        current_pos = self.robot._driver.get_position()['current']

        self.assertDictEqual(
            current_pos,
            {'x': 161.0, 'y': 416.7, 'z': 3.0, 'a': 0, 'b': 0.0}
        )

    def test_empty_aspirate(self):

        self.p200.aspirate(100)

        self.robot.run()

        current_pos = self.robot._driver.get_position()['current']

        self.assertDictEqual(
            current_pos,
            {'x': 0, 'y': 0, 'z': 0, 'a': 0, 'b': 5.0}
        )

    def test_non_empty_aspirate(self):

        self.p200.aspirate(100)
        self.p200.aspirate(20)
        self.robot.run()

        current_pos = self.robot._driver.get_position()['current']
        self.assertDictEqual(
            current_pos,
            {'x': 0, 'y': 0, 'z': 0, 'a': 0, 'b': 4.0}
        )

    def test_aspirate_no_args(self):
        self.p200.aspirate()
        self.robot.run()

        current_pos = self.robot._driver.get_position()['current']
        self.assertDictEqual(
            current_pos,
            {'x': 0, 'y': 0, 'z': 0, 'a': 0, 'b': 0.0}
        )

    def test_invalid_aspirate(self):
        self.assertRaises(RuntimeWarning, self.p200.aspirate, 500)
        self.assertRaises(IndexError, self.p200.aspirate, -1)

    def test_dispense(self):
        self.p200.aspirate(100)
        self.p200.dispense(20)

        self.robot.run()

        current_pos = self.robot._driver.get_position()['current']
        self.assertDictEqual(
            current_pos,
            {'x': 0, 'y': 0, 'z': 0, 'a': 0, 'b': 6.0}
        )

    def test_dispense_no_args(self):
        self.p200.aspirate(100)
        self.p200.dispense()

        self.robot.run()

        current_pos = self.robot._driver.get_position()['current']
        self.assertDictEqual(
            current_pos,
            {'x': 0, 'y': 0, 'z': 0, 'a': 0, 'b': 10.0}
        )

    def test_invalid_dispense(self):
        self.assertRaises(RuntimeWarning, self.p200.dispense, 1)
        self.assertRaises(IndexError, self.p200.dispense, -1)

    def test_blow_out(self):

        self.p200.blow_out()

        self.robot.run()

        current_pos = self.robot._driver.get_position()['current']
        self.assertDictEqual(
            current_pos,
            {'x': 0, 'y': 0, 'z': 0, 'a': 0, 'b': 12.0}
        )

    def test_drop_tip(self):

        self.p200.drop_tip()

        self.robot.run()

        current_pos = self.robot._driver.get_position()['current']
        self.assertDictEqual(
            current_pos,
            {'x': 0, 'y': 0, 'z': 0, 'a': 0, 'b': 0.0}
        )
