import unittest
from unittest import mock
from opentrons_sdk import containers

from opentrons_sdk.labware import instruments
from opentrons_sdk.robot import Robot
from opentrons_sdk.util.vector import Vector

from opentrons_sdk.util import log

from opentrons_sdk.containers.placeable import unpack_location


class PipetteTest(unittest.TestCase):

    def setUp(self):
        self.robot = Robot.reset()
        self.robot.connect()
        self.robot.home()

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

    def test_get_instruments_by_name(self):
        self.p1000 = instruments.Pipette(
            trash_container=self.trash,
            tip_racks=[self.tiprack],
            min_volume=10,  # These are variable
            axis="a",
            name="p1000",
            channels=1
        )
        result = list(self.robot.get_instruments('p1000'))
        self.assertListEqual(result, [('A', self.p1000)])

    def test_placeables_reference(self):

        self.p200.aspirate(100, self.plate[0])

        expected = [
            self.plate[0],
            self.plate[0]
        ]

        self.assertEquals(self.p200.placeables, expected)

    def test_unpack_location(self):

        location = (self.plate[0], (1, 0, -1))
        res = unpack_location(location)
        self.assertEquals(res, (self.plate[0], (1, 0, -1)))

        res = unpack_location(self.plate[0])
        self.assertEquals(
            res,
            (self.plate[0], self.plate[0].from_center(x=0, y=0, z=1)))

    def test_calibrate_placeable(self):
        well = self.plate[0]
        pos = well.from_center(x=0, y=0, z=0, reference=self.plate)
        location = (self.plate, pos)

        well_deck_coordinates = well.center(well.get_deck())
        dest = well_deck_coordinates + Vector(1, 2, 3)
        log.debug('Unit test', 'Destination: {}'.format(well_deck_coordinates))

        self.robot._driver.move_head(x=dest['x'], y=dest['y'], z=dest['z'])

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
        x, y, z = (161.0, 116.7, 3.0)
        well = self.plate[0]
        pos = well.from_center(x=0, y=0, z=-1, reference=self.plate)
        location = (self.plate, pos)

        self.robot._driver.move_head(x=x, y=y, z=z)

        self.p200.calibrate_position(location)

        self.p200.aspirate(100, location)
        self.robot.run()

        current_pos = self.robot._driver.get_head_position()['current']
        print(current_pos)
        self.assertEquals(
            current_pos,
            Vector({'x': 161.0, 'y': 116.7, 'z': 3.0})
        )

        current_pos = self.robot._driver.get_plunger_positions()['current']

        self.assertDictEqual(
            current_pos,
            {'a': 0, 'b': 5.0}
        )

    def test_dispense_move_to(self):
        x, y, z = (161.0, 116.7, 3.0)
        well = self.plate[0]
        pos = well.from_center(x=0, y=0, z=-1, reference=self.plate)
        location = (self.plate, pos)

        self.robot._driver.move_head(x=x, y=y, z=z)

        self.p200.calibrate_position(location)

        self.p200.aspirate(100, location)
        self.p200.dispense(100, location)
        self.robot.run()

        driver = self.robot._driver

        current_plunger_pos = driver.get_plunger_positions()['current']
        current_head_pos = driver.get_head_position()['current']

        self.assertEquals(
            current_head_pos,
            Vector({'x': 161.0, 'y': 116.7, 'z': 3.0})
        )
        self.assertDictEqual(
            current_plunger_pos,
            {'a': 0, 'b': 10.0}
        )

    def test_blow_out_move_to(self):
        x, y, z = (161.0, 116.7, 3.0)
        well = self.plate[0]
        pos = well.from_center(x=0, y=0, z=-1, reference=self.plate)
        location = (self.plate, pos)

        self.robot._driver.move_head(x=x, y=y, z=z)

        self.p200.calibrate_position(location)

        self.p200.blow_out(location)
        self.robot.run()

        current_pos = self.robot._driver.get_head_position()['current']

        self.assertEquals(
            current_pos,
            Vector({'x': 161.0, 'y': 116.7, 'z': 3.0})
        )

        current_pos = self.robot._driver.get_plunger_positions()['current']

        self.assertDictEqual(
            current_pos,
            {'a': 0, 'b': 12.0}
        )

    def test_drop_tip_move_to(self):
        x, y, z = (161.0, 116.7, 3.0)
        well = self.plate[0]
        pos = well.from_center(x=0, y=0, z=-1, reference=self.plate)
        location = (self.plate, pos)

        self.robot._driver.move_head(x=x, y=y, z=z)

        self.p200.calibrate_position(location)

        self.p200.drop_tip(location)
        self.robot.run()

        current_pos = self.robot._driver.get_head_position()['current']

        self.assertEquals(
            current_pos,
            Vector({'x': 144.3, 'y': 97.0, 'z': 3.0})
        )

    def test_empty_aspirate(self):

        self.p200.aspirate(100)

        self.robot.run()

        current_pos = self.robot._driver.get_plunger_positions()['current']

        self.assertDictEqual(
            current_pos,
            {'a': 0, 'b': 5.0}
        )

    def test_non_empty_aspirate(self):

        self.p200.aspirate(100)
        self.p200.aspirate(20)
        self.robot.run()

        current_pos = self.robot._driver.get_plunger_positions()['current']
        self.assertDictEqual(
            current_pos,
            {'a': 0, 'b': 4.0}
        )

    def test_aspirate_no_args(self):
        self.p200.aspirate()
        self.robot.run()

        current_pos = self.robot._driver.get_plunger_positions()['current']
        self.assertDictEqual(
            current_pos,
            {'a': 0, 'b': 0.0}
        )

    def test_invalid_aspirate(self):
        self.assertRaises(RuntimeWarning, self.p200.aspirate, 500)
        self.assertRaises(IndexError, self.p200.aspirate, 1)

    def test_dispense(self):
        self.p200.aspirate(100)
        self.p200.dispense(20)

        self.robot.run()

        current_pos = self.robot._driver.get_plunger_positions()['current']
        self.assertDictEqual(
            current_pos,
            {'a': 0, 'b': 6.0}
        )

    def test_dispense_no_args(self):
        self.p200.aspirate(100)
        self.p200.dispense()

        self.robot.run()

        current_pos = self.robot._driver.get_plunger_positions()['current']
        self.assertDictEqual(
            current_pos,
            {'a': 0, 'b': 10.0}
        )

    def test_invalid_dispense(self):
        self.assertRaises(RuntimeWarning, self.p200.dispense, 1)
        self.assertRaises(IndexError, self.p200.dispense, -1)

    def test_blow_out(self):

        self.p200.blow_out()

        self.robot.run()

        current_pos = self.robot._driver.get_plunger_positions()['current']
        self.assertDictEqual(
            current_pos,
            {'a': 0, 'b': 12.0}
        )

    def test_drop_tip(self):

        self.p200.drop_tip()

        self.robot.run()

        current_pos = self.robot._driver.get_plunger_positions()['current']
        self.assertDictEqual(
            current_pos,
            {'a': 0, 'b': 0.0}
        )

    def test_delay(self):
        self.p200.delay(1)

        self.assertEquals(self.robot._commands[-1].description, "Delaying 1 seconds")

    def test_set_speed(self):
        self.assertEquals(self.p200.speed, 300)

        self.p200.set_speed(100)

        self.assertEquals(self.p200.speed, 100)

    def test_transfer_no_volume(self):
        self.p200.aspirate = mock.Mock()
        self.p200.dispense = mock.Mock()
        self.p200.transfer(self.plate[0], self.plate[1])
        self.robot.run()

        self.assertEqual(self.p200.aspirate.mock_calls, [mock.call.aspirate(self.p200.max_volume, self.plate[0])])
        self.assertEqual(self.p200.dispense.mock_calls, [mock.call.dispense(self.p200.max_volume, self.plate[1])])

    def test_transfer_with_volume(self):
        self.p200.aspirate = mock.Mock()
        self.p200.dispense = mock.Mock()
        self.p200.transfer(self.plate[0], self.plate[1], 100)
        self.robot.run()

        self.assertEqual(self.p200.aspirate.mock_calls, [mock.call.aspirate(100, self.plate[0])])
        self.assertEqual(self.p200.dispense.mock_calls, [mock.call.dispense(100, self.plate[1])])

    def test_consolidate(self):
        volume = 99
        sources = [self.plate[1], self.plate[2], self.plate[3]]
        destination = self.plate[0]
        fractional_volume = volume / len(sources)

        self.p200.aspirate = mock.Mock()
        self.p200.dispense = mock.Mock()
        self.p200.consolidate(destination, sources, volume)
        self.robot.run()

        self.assertEqual(self.p200.aspirate.mock_calls,
                        [mock.call.aspirate(fractional_volume, self.plate[1]),
                        mock.call.aspirate(fractional_volume, self.plate[2]),
                        mock.call.aspirate(fractional_volume, self.plate[3])]
                        )
        self.assertEqual(self.p200.dispense.mock_calls, [mock.call.dispense(volume, destination)])

    def test_distribute(self):
        volume = 99
        destinations = [self.plate[1], self.plate[2], self.plate[3]]
        fractional_volume = volume / len(destinations)

        self.p200.aspirate = mock.Mock()
        self.p200.dispense = mock.Mock()
        self.p200.distribute(self.plate[0], destinations, volume)
        self.robot.run()

        self.assertEqual(self.p200.dispense.mock_calls,
                        [mock.call.dispense(fractional_volume, self.plate[1]),
                        mock.call.dispense(fractional_volume, self.plate[2]),
                        mock.call.dispense(fractional_volume, self.plate[3])]
                        )
        self.assertEqual(self.p200.aspirate.mock_calls, [mock.call.aspirate(volume, self.plate[0])])

    def test_mix(self):
        well = self.plate[0]
        # It is necessary to aspirate before it is mocked out so that you have liquid
        self.p200.current_volume = 100
        self.p200.aspirate = mock.Mock()
        self.p200.dispense = mock.Mock()
        self.p200.mix()
        self.robot.run()

        print("****", len(self.p200.dispense.mock_calls))
        print("****", self.p200.dispense.mock_calls)
        self.assertEqual(self.p200.dispense.mock_calls,
                        [mock.call.dispense(100),
                        mock.call.dispense(100),
                        mock.call.dispense(100)]
                        )
        self.assertEqual(self.p200.aspirate.mock_calls,
                        [mock.call.aspirate(100),
                        mock.call.aspirate(100),
                        mock.call.aspirate(100)]
                        )
