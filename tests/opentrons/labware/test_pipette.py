import unittest
from unittest import mock
from opentrons import containers

from opentrons import instruments
from opentrons.robot import Robot
from opentrons.util.vector import Vector

from opentrons.containers.placeable import unpack_location, Container, Well


class PipetteTest(unittest.TestCase):

    def setUp(self):
        self.robot = Robot.reset_for_tests()
        myport = self.robot.VIRTUAL_SMOOTHIE_PORT
        self.robot.connect(port=myport)
        self.robot.home()

        self.trash = containers.load('point', 'A1')
        self.tiprack1 = containers.load('tiprack-10ul', 'B2')
        self.tiprack2 = containers.load('tiprack-10ul', 'B3')

        self.plate = containers.load('96-flat', 'A2')

        self.p200 = instruments.Pipette(
            trash_container=self.trash,
            tip_racks=[self.tiprack1, self.tiprack2],
            min_volume=10,  # These are variable
            axis="b",
            channels=1
        )

        self.p200.calibrate_plunger(top=0, bottom=10, blow_out=12, drop_tip=13)
        self.p200.set_max_volume(200)
        self.robot.home(enqueue=False)
        _, _, starting_z = self.robot._driver.get_head_position()['current']

    def test_calibrate_by_position_name(self):

        self.p200.plunger.move(9)
        self.p200.calibrate('bottom')
        self.assertEquals(self.p200.positions['bottom'], 9)

    def test_get_instruments_by_name(self):
        self.p1000 = instruments.Pipette(
            trash_container=self.trash,
            tip_racks=[self.tiprack1],
            min_volume=10,  # These are variable
            axis="a",
            name="p1000",
            channels=1,
            aspirate_speed=300,
            dispense_speed=500
        )
        result = list(self.robot.get_instruments('p1000'))
        self.assertListEqual(result, [('A', self.p1000)])

    def test_placeables_reference(self):

        self.p200.aspirate(100, self.plate[0])
        self.p200.dispense(100, self.plate[0])
        self.p200.aspirate(100, self.plate[20])
        self.p200.aspirate(100, self.plate[1])

        expected = [
            self.plate[0],
            self.plate[20],
            self.plate[1]
        ]

        self.robot.run()

        self.assertEquals(self.p200.placeables, expected)

    def test_unpack_location(self):

        location = (self.plate[0], (1, 0, -1))
        res = unpack_location(location)
        self.assertEqual(res, (self.plate[0], (1, 0, -1)))

        res = unpack_location(self.plate[0])
        self.assertEqual(
            res,
            (self.plate[0], self.plate[0].from_center(x=0, y=0, z=1)))

    def test_calibrate_placeable(self):
        self.p200.delete_calibration_data()
        well = self.plate[0]
        pos = well.from_center(x=0, y=0, z=0, reference=self.plate)
        location = (self.plate, pos)

        well_deck_coordinates = well.center(well.get_deck())
        dest = well_deck_coordinates + Vector(1, 2, 3)

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

    def test_aspirate_rate(self):
        self.p200.set_speed(aspirate=300, dispense=500)
        self.robot.clear()
        self.p200.plunger.speed = mock.Mock()
        self.p200.aspirate(100, rate=2.0).dispense(rate=.5)
        self.robot.run()
        expected = [
            mock.call(600.0),
            mock.call(250.0),
            mock.call(600.0),
            mock.call(250.0)
        ]
        self.assertEquals(self.p200.plunger.speed.mock_calls, expected)

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
        self.assertEqual(
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

        self.robot.home(enqueue=False)

        self.p200.aspirate(100, location)
        self.p200.dispense(100, location)
        self.robot.run()

        driver = self.robot._driver

        current_plunger_pos = driver.get_plunger_positions()['current']
        current_head_pos = driver.get_head_position()['current']

        self.assertEqual(
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

        self.assertEqual(
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

        self.assertEqual(
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

    def test_aspirate_invalid_max_volume(self):
        with self.assertRaises(RuntimeWarning):
            self.p200.aspirate(500)
            self.robot.run()

    def test_dispense(self):
        self.p200.aspirate(100)
        self.p200.dispense(20)
        #
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

    def test_blow_out(self):
        self.p200.blow_out()
        self.robot.run()

        current_pos = self.robot._driver.get_plunger_positions()['current']
        self.assertDictEqual(
            current_pos,
            {'a': 0, 'b': 12.0}
        )

    def test_pick_up_tip(self):
        last_well = self.tiprack1[-1]
        target_pos = last_well.from_center(
            x=0, y=0, z=-1,
            reference=self.robot._deck)
        self.p200.pick_up_tip(last_well)
        self.robot.run()
        current_pos = self.robot._driver.get_head_position()['current']
        self.assertEqual(current_pos, target_pos)

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

        self.assertEqual(
            self.robot._commands[-1].description,
            "Delaying 1 seconds")

    def test_set_speed(self):
        self.p200.set_speed(aspirate=100)
        self.assertEqual(self.p200.speeds['aspirate'], 100)

        self.p200.set_speed(dispense=100)
        self.assertEqual(self.p200.speeds['dispense'], 100)

    def test_transfer_no_volume(self):
        self.p200.aspirate = mock.Mock()
        self.p200.dispense = mock.Mock()
        self.p200.transfer(self.plate[0], self.plate[1])
        self.robot.run()

        self.assertEqual(
            self.p200.aspirate.mock_calls,
            [mock.call.aspirate(None, self.plate[0])])
        self.assertEqual(
            self.p200.dispense.mock_calls,
            [mock.call.dispense(None, self.plate[1])])

    def test_transfer_with_volume(self):
        self.p200.aspirate = mock.Mock()
        self.p200.dispense = mock.Mock()
        self.p200.transfer(100, self.plate[0], self.plate[1])
        self.robot.run()

        self.assertEqual(
            self.p200.aspirate.mock_calls,
            [mock.call.aspirate(100, self.plate[0])])
        self.assertEqual(
            self.p200.dispense.mock_calls,
            [mock.call.dispense(100, self.plate[1])])

    def test_consolidate(self):
        volume = 99
        sources = [self.plate[1], self.plate[2], self.plate[3]]
        destination = self.plate[0]
        fractional_volume = volume / len(sources)

        self.p200.aspirate = mock.Mock()
        self.p200.dispense = mock.Mock()
        self.p200.consolidate(volume, sources, destination)
        self.robot.run()

        self.assertEqual(
            self.p200.aspirate.mock_calls,
            [
                mock.call.aspirate(fractional_volume, self.plate[1]),
                mock.call.aspirate(fractional_volume, self.plate[2]),
                mock.call.aspirate(fractional_volume, self.plate[3])
            ]
        )
        self.assertEqual(
            self.p200.dispense.mock_calls,
            [mock.call.dispense(volume, destination)]
        )

    def test_distribute(self):
        volume = 99
        destinations = [self.plate[1], self.plate[2], self.plate[3]]
        fractional_volume = volume / len(destinations)

        self.p200.aspirate = mock.Mock()
        self.p200.dispense = mock.Mock()
        self.p200.distribute(volume, self.plate[0], destinations)
        self.robot.run()

        self.assertEqual(
            self.p200.dispense.mock_calls,
            [
                mock.call.dispense(fractional_volume, self.plate[1]),
                mock.call.dispense(fractional_volume, self.plate[2]),
                mock.call.dispense(fractional_volume, self.plate[3])]
        )
        self.assertEqual(
            self.p200.aspirate.mock_calls,
            [
                mock.call.aspirate(volume, self.plate[0])
            ]
        )

    def test_mix(self):
        # It is necessary to aspirate before it is mocked out
        # so that you have liquid
        self.p200.aspirate = mock.Mock()
        self.p200.dispense = mock.Mock()
        self.p200.mix(100, 3, self.plate[1])
        self.robot.run()

        self.assertEqual(
            self.p200.dispense.mock_calls,
            [
                mock.call.dispense(100),
                mock.call.dispense(100),
                mock.call.dispense(100)
            ]
        )
        self.assertEqual(
            self.p200.aspirate.mock_calls,
            [
                mock.call.aspirate(volume=100, location=self.plate[1]),
                mock.call.aspirate(100),
                mock.call.aspirate(100)
            ]
        )

    def test_mix_with_named_args(self):
        self.p200.current_volume = 100
        self.p200.aspirate = mock.Mock()
        self.p200.dispense = mock.Mock()
        self.p200.mix(volume=50, repetitions=2)
        self.robot.run()

        self.assertEqual(
            self.p200.dispense.mock_calls,
            [
                mock.call.dispense(50),
                mock.call.dispense(50)
            ]
        )
        self.assertEqual(
            self.p200.aspirate.mock_calls,
            [
                mock.call.aspirate(volume=50, location=None),
                mock.call.aspirate(50)
            ]
        )

    def test_tip_tracking_simple(self):
        self.p200.move_to = mock.Mock()
        self.p200.pick_up_tip()
        self.p200.pick_up_tip()

        self.assertEqual(
            self.p200.move_to.mock_calls,
            [
                self.build_move_to_bottom(self.tiprack1[0]),
                self.build_move_to_bottom(self.tiprack1[1])
            ]
        )

    def test_simulate_plunger_while_enqueing(self):

        self.p200.pick_up_tip()
        self.assertEquals(self.p200.current_volume, 0)

        self.p200.aspirate(200)
        self.assertEquals(self.p200.current_volume, 200)

        self.p200.dispense(20)
        self.assertEquals(self.p200.current_volume, 180)

        self.p200.dispense(20)
        self.assertEquals(self.p200.current_volume, 160)

        self.p200.dispense(60)
        self.assertEquals(self.p200.current_volume, 100)

        self.p200.dispense(100)
        self.assertEquals(self.p200.current_volume, 0)

        self.p200.drop_tip()

    def test_tip_tracking_chain(self):

        total_tips_per_plate = 4

        def generate_plate(wells, cols, spacing, offset, radius):
            c = Container()

            for i in range(0, wells):
                well = Well(properties={'radius': radius})
                row, col = divmod(i, cols)
                name = chr(row + ord('A')) + str(1 + col)
                coordinates = (col * spacing[0] + offset[0],
                               row * spacing[1] + offset[1],
                               0)
                c.add(well, name, coordinates)
            return c

        self.tiprack1 = generate_plate(
            total_tips_per_plate, 2, (5, 5), (0, 0), 5)
        self.tiprack2 = generate_plate(
            total_tips_per_plate, 2, (5, 5), (0, 0), 5)
        self.robot._deck['A1'].add(self.tiprack1, 'tiprack1')
        self.robot._deck['B1'].add(self.tiprack2, 'tiprack2')

        self.p200 = instruments.Pipette(
            axis='b',
            tip_racks=[self.tiprack1, self.tiprack2],
            trash_container=self.tiprack1
        )

        self.p200.move_to = mock.Mock()

        for _ in range(0, total_tips_per_plate * 4):
            self.p200.pick_up_tip()

        expected = []
        for i in range(0, total_tips_per_plate):
            expected.append(self.build_move_to_bottom(self.tiprack1[i]))
        for i in range(0, total_tips_per_plate):
            expected.append(self.build_move_to_bottom(self.tiprack2[i]))
        for i in range(0, total_tips_per_plate):
            expected.append(self.build_move_to_bottom(self.tiprack1[i]))
        for i in range(0, total_tips_per_plate):
            expected.append(self.build_move_to_bottom(self.tiprack2[i]))

        self.assertEqual(
            self.p200.move_to.mock_calls,
            expected
        )

    def test_tip_tracking_chain_multi_channel(self):
        p200_multi = instruments.Pipette(
            trash_container=self.trash,
            tip_racks=[self.tiprack1, self.tiprack2],
            min_volume=10,  # These are variable
            axis="b",
            channels=8
        )

        p200_multi.calibrate_plunger(
            top=0, bottom=10, blow_out=12, drop_tip=13)
        p200_multi.set_max_volume(200)
        p200_multi.move_to = mock.Mock()

        for _ in range(0, 12 * 4):
            p200_multi.pick_up_tip()

        expected = []
        for i in range(0, 12):
            expected.append(self.build_move_to_bottom(self.tiprack1.rows[i]))
        for i in range(0, 12):
            expected.append(self.build_move_to_bottom(self.tiprack2.rows[i]))
        for i in range(0, 12):
            expected.append(self.build_move_to_bottom(self.tiprack1.rows[i]))
        for i in range(0, 12):
            expected.append(self.build_move_to_bottom(self.tiprack2.rows[i]))

        self.assertEqual(
            p200_multi.move_to.mock_calls,
            expected
        )

    def test_tip_tracking_return(self):
        self.p200.drop_tip = mock.Mock()

        self.p200.pick_up_tip()
        self.p200.return_tip()

        self.p200.pick_up_tip()
        self.p200.return_tip()

        self.assertEqual(
            self.p200.drop_tip.mock_calls,
            [
                mock.call(self.tiprack1[0], enqueue=False),
                mock.call(self.tiprack1[1], enqueue=False)
            ]
        )

    def build_move_to_bottom(self, well):
        return mock.call(
            well.bottom(), strategy='arc', enqueue=False)

    def test_drop_tip_to_trash(self):
        self.p200.move_to = mock.Mock()

        self.p200.pick_up_tip()
        self.p200.drop_tip()

        self.assertEqual(
            self.p200.move_to.mock_calls,
            [
                self.build_move_to_bottom(self.tiprack1[0]),
                self.build_move_to_bottom(self.trash)
            ]
        )
