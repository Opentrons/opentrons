# pylama:ignore=E501

import unittest
from unittest import mock
from opentrons import robot
from opentrons.instruments import Pipette
from opentrons.containers import load as containers_load
from opentrons import instruments
from opentrons.containers.placeable import unpack_location, Container, Well
from opentrons.trackers import pose_tracker
from numpy import isclose


def test_pipette_models():
    robot.reset()
    p = instruments.P300_Single(mount='left')
    assert p.channels == 1
    assert p.max_volume > 300
    p = instruments.P300_Multi(mount='right')
    assert p.channels == 8
    assert p.max_volume > 300

    robot.reset()
    p = instruments.P10_Single(mount='left')
    assert p.channels == 1
    assert p.max_volume > 10
    p = instruments.P10_Multi(mount='right')
    assert p.channels == 8
    assert p.max_volume > 10


def test_pipette_max_deck_height():
    robot.reset()
    tallest_point = robot._driver.homed_position['Z']
    p = instruments.P300_Single(mount='left')
    assert p._max_deck_height() == tallest_point

    for tip_length in [10, 25, 55, 100]:
        p._add_tip(length=tip_length)
        assert p._max_deck_height() == tallest_point - tip_length
        p._remove_tip(length=tip_length)


def test_retract():
    robot.reset()
    plate = containers_load(robot, '96-flat', '1')
    p300 = instruments.P300_Single(mount='left')
    from opentrons.drivers.smoothie_drivers.driver_3_0 import HOMED_POSITION

    p300.move_to(plate[0].top())

    assert p300.previous_placeable == plate[0]
    current_pos = pose_tracker.absolute(
        robot.poses,
        p300)
    assert current_pos[2] == plate[0].top()[1][2]

    p300.retract()

    assert p300.previous_placeable is None
    current_pos = pose_tracker.absolute(
        robot.poses,
        p300.instrument_mover)
    assert current_pos[2] == HOMED_POSITION['A']


def test_aspirate_move_to():
    robot.reset()
    tip_rack = containers_load(robot, 'tiprack-200ul', '3')
    p300 = instruments.P300_Single(mount='left', tip_racks=[tip_rack])

    x, y, z = (161.0, 116.7, 0.0)
    plate = containers_load(robot, '96-flat', '1')
    well = plate[0]
    pos = well.from_center(x=0, y=0, z=-1, reference=plate)
    location = (plate, pos)

    robot.poses = p300._move(robot.poses, x=x, y=y, z=z)
    robot.calibrate_container_with_instrument(plate, p300, False)

    p300.pick_up_tip()
    p300.aspirate(100, location)
    current_pos = pose_tracker.absolute(
        robot.poses,
        p300.instrument_actuator)
    assert (current_pos == (7.402, 0.0, 0.0)).all()

    current_pos = pose_tracker.absolute(robot.poses, p300)
    assert isclose(current_pos, (175.34,  127.94,   10.5)).all()


def test_dispense_move_to():
    robot.reset()
    tip_rack = containers_load(robot, 'tiprack-200ul', '3')
    p300 = instruments.P300_Single(mount='left', tip_racks=[tip_rack])

    x, y, z = (161.0, 116.7, 0.0)
    plate = containers_load(robot, '96-flat', '1')
    well = plate[0]
    pos = well.from_center(x=0, y=0, z=-1, reference=plate)
    location = (plate, pos)

    robot.poses = p300._move(robot.poses, x=x, y=y, z=z)
    robot.calibrate_container_with_instrument(plate, p300, False)

    p300.pick_up_tip()
    p300.aspirate(100, location)
    p300.dispense(100, location)
    current_pos = pose_tracker.absolute(
        robot.poses,
        p300.instrument_actuator)
    assert (current_pos == (2.0, 0.0, 0.0)).all()

    current_pos = pose_tracker.absolute(robot.poses, p300)
    assert isclose(current_pos, (175.34,  127.94,   10.5)).all()


class PipetteTest(unittest.TestCase):
    def setUp(self):
        robot.reset()
        robot.home()
        self.trash = containers_load(robot, 'point', '11')
        self.tiprack1 = containers_load(robot, 'tiprack-10ul', '5')
        self.tiprack2 = containers_load(robot, 'tiprack-10ul', '8')

        self.plate = containers_load(robot, '96-flat', '4')

        self.p300 = instruments.P300_Single(
            trash_container=self.trash,
            tip_racks=[self.tiprack1, self.tiprack2],
            mount='left')

        self.p300.reset()

        self.p300.calibrate_plunger(top=0, bottom=10, blow_out=12, drop_tip=13)
        robot.home()

    def tearDown(self):
        robot.reset()

    def test_bad_volume_percentage(self):
        self.assertRaises(RuntimeError, self.p300._volume_percentage, -1)

    def test_add_instrument(self):
        robot.reset()
        instruments.P300_Single(mount='left')
        self.assertRaises(RuntimeError, Pipette, robot, mount='left')

    def test_aspirate_zero_volume(self):
        assert robot.commands() == []
        self.p300.tip_attached = True
        self.p300.aspirate(0)
        assert robot.commands() == ['Aspirating 0 uL from ? at 1.0 speed']

    def test_get_plunger_position(self):

        self.assertEquals(self.p300._get_plunger_position('top'), 0)
        self.assertEquals(self.p300._get_plunger_position('bottom'), 10)
        self.assertEquals(self.p300._get_plunger_position('blow_out'), 12)
        self.assertEquals(self.p300._get_plunger_position('drop_tip'), 13)

        self.p300.plunger_positions['drop_tip'] = None
        self.assertRaises(
            RuntimeError, self.p300._get_plunger_position, 'drop_tip')

        self.assertRaises(
            RuntimeError, self.p300._get_plunger_position, 'roll_out')

    def test_deprecated_axis_call(self):
        import warnings

        warnings.filterwarnings('error')
        # Check that user warning occurs when axis is called
        self.assertRaises(
            UserWarning, Pipette, robot, axis='a')

        # Check that the warning is still valid when max_volume is also used
        self.assertRaises(
            UserWarning, Pipette, robot, axis='a', max_volume=300)

        warnings.filterwarnings('default')

    def test_placeables_reference(self):
        self.p300.tip_attached = True
        self.p300.aspirate(100, self.plate[0])
        self.p300.dispense(100, self.plate[0])
        self.p300.aspirate(100, self.plate[20])
        self.p300.aspirate(100, self.plate[1])

        expected = [
            self.plate[0],
            self.plate[20],
            self.plate[1]
        ]

        self.assertEquals(self.p300.placeables, expected)

    def test_unpack_location(self):

        location = (self.plate[0], (1, 0, -1))
        res = unpack_location(location)
        self.assertEqual(res, (self.plate[0], (1, 0, -1)))

        res = unpack_location(self.plate[0])
        self.assertEqual(
            res,
            (self.plate[0], self.plate[0].from_center(x=0, y=0, z=1)))

    def test_aspirate_invalid_max_volume(self):
        self.p300.tip_attached = True
        with self.assertRaises(RuntimeWarning):
            self.p300.aspirate(500)

    def test_volume_percentage(self):
        self.assertRaises(RuntimeError, self.p300._volume_percentage, -1)
        self.assertRaises(RuntimeError, self.p300._volume_percentage, 400)
        self.assertEquals(len(robot.get_warnings()), 0)

    def test_add_tip(self):
        """
        This deals with z accrual behavior during tip add/remove, when +/- get
        flipped in pose tracking logic
        """
        prior_position = pose_tracker.absolute(robot.poses, self.p300)
        self.p300._add_tip(42)
        self.p300._remove_tip(42)
        new_position = pose_tracker.absolute(robot.poses, self.p300)

        assert (new_position == prior_position).all()

    def test_delay(self):
        self.p300.delay(1)

        self.assertEqual(
            robot.commands()[-1],
            "Delaying for 0m 1s")

        robot.clear_commands()
        self.p300.delay(seconds=12, minutes=10)

        self.assertEqual(
            robot.commands()[-1],
            "Delaying for 10m 12s")

    def test_set_speed(self):
        self.p300.set_speed(aspirate=100)
        self.assertEqual(self.p300.speeds['aspirate'], 100)

        self.p300.set_speed(dispense=100)
        self.assertEqual(self.p300.speeds['dispense'], 100)

    def test_set_flow_rate(self):
        p300 = instruments.P300_Single(mount='right')

        p300.set_flow_rate(aspirate=100)
        expected_mm_per_sec = round(100 / p300.ul_per_mm, 3)
        self.assertEqual(p300.speeds['aspirate'], expected_mm_per_sec)

        p300.set_flow_rate(dispense=200)
        expected_mm_per_sec = round(200 / p300.ul_per_mm, 3)
        self.assertEqual(p300.speeds['dispense'], expected_mm_per_sec)

    def test_bad_transfer(self):
        self.p300.reset()

        self.assertRaises(
            ValueError,
            self.p300.transfer,
            30,
            self.plate[0:2],
            self.plate[0:3]
        )

        self.assertRaises(
            ValueError,
            self.p300.transfer,
            30,
            self.plate[0:3],
            self.plate[0:2]
        )

        self.assertRaises(
            RuntimeError,
            self.p300.transfer,
            [30, 30, 30],
            self.plate[0:2],
            self.plate[0:2]
        )

        self.assertRaises(
            ValueError,
            self.p300.transfer,
            30,
            self.plate[0],
            self.plate[1],
            new_tip='sometimes'
        )

        self.assertRaises(
            ValueError,
            self.p300.transfer,
            [20, 20, 20, 20],
            self.plate[0:3],
            self.plate[1:4],
            new_tip='sometimes'
        )

    def test_touch_tip(self):
        self.p300.pick_up_tip()
        self.p300.robot.move_to = mock.Mock()
        self.p300.touch_tip(self.plate[0])
        self.p300.touch_tip(-3)
        self.p300.touch_tip(self.plate[1], radius=0.5)

        expected = [
            mock.call(self.plate[0],
                      instrument=self.p300,
                      strategy='arc'),

            mock.call(
                (self.plate[0], (6.40, 3.20, 10.50)),
                instrument=self.p300,
                strategy='direct'),
            mock.call(
                (self.plate[0], (0.00, 3.20, 10.50)),
                instrument=self.p300,
                strategy='direct'),
            mock.call(
                (self.plate[0], (3.20, 6.40, 10.50)),
                instrument=self.p300,
                strategy='direct'),
            mock.call(
                (self.plate[0], (3.20, 0.00, 10.50)),
                instrument=self.p300,
                strategy='direct'),
            mock.call(
                (self.plate[0], (6.40, 3.20, 7.50)),
                instrument=self.p300,
                strategy='direct'),
            mock.call(
                (self.plate[0], (0.00, 3.20, 7.50)),
                instrument=self.p300,
                strategy='direct'),
            mock.call(
                (self.plate[0], (3.20, 6.40, 7.50)),
                instrument=self.p300,
                strategy='direct'),
            mock.call(
                (self.plate[0], (3.20, 0.00, 7.50)),
                instrument=self.p300,
                strategy='direct'),
            mock.call(self.plate[1],
                      instrument=self.p300,
                      strategy='arc'),
            mock.call(
                (self.plate[1], (4.80, 3.20, 10.50)),
                instrument=self.p300,
                strategy='direct'),
            mock.call(
                (self.plate[1], (1.60, 3.20, 10.50)),
                instrument=self.p300,
                strategy='direct'),
            mock.call(
                (self.plate[1], (3.20, 4.80, 10.50)),
                instrument=self.p300,
                strategy='direct'),
            mock.call(
                (self.plate[1], (3.20, 1.60, 10.50)),
                instrument=self.p300,
                strategy='direct')
        ]

        self.assertEquals(expected, self.p300.robot.move_to.mock_calls)

    def test_mix(self):
        # It is necessary to aspirate before it is mocked out
        # so that you have liquid
        self.p300.pick_up_tip()
        self.p300.aspirate = mock.Mock()
        self.p300.dispense = mock.Mock()
        self.p300.mix(3, 100, self.plate[1])

        dispense_expected = [
            mock.call.dispense(100, rate=1.0),
            mock.call.dispense(100, rate=1.0),
            mock.call.dispense(100, rate=1.0)
        ]
        self.assertEqual(self.p300.dispense.mock_calls, dispense_expected)

        aspirate_expected = [
            mock.call.aspirate(volume=100, location=self.plate[1], rate=1.0),
            mock.call.aspirate(100, rate=1.0),
            mock.call.aspirate(100, rate=1.0)
        ]
        self.assertEqual(self.p300.aspirate.mock_calls, aspirate_expected)

    def test_air_gap(self):
        self.p300.pick_up_tip()
        self.p300.aspirate(50, self.plate[0])
        self.p300.air_gap()
        self.assertEquals(self.p300.current_volume, self.p300.max_volume)

        self.p300.dispense()
        self.p300.aspirate(50, self.plate[1])
        self.p300.air_gap(10)
        self.assertEquals(self.p300.current_volume, 60)

        self.p300.dispense()
        self.p300.aspirate(50, self.plate[2])
        self.p300.air_gap(10, 10)
        self.assertEquals(self.p300.current_volume, 60)

        self.p300.dispense()
        self.p300.aspirate(50, self.plate[2])
        self.p300.air_gap(0)
        self.assertEquals(self.p300.current_volume, 50)

    def test_pipette_home(self):
        self.p300.home()
        self.assertEquals(len(robot.commands()), 1)

    def test_mix_with_named_args(self):
        self.p300.current_volume = 100
        self.p300.pick_up_tip()
        self.p300.aspirate = mock.Mock()
        self.p300.dispense = mock.Mock()
        self.p300.mix(volume=50, repetitions=2)

        self.assertEqual(
            self.p300.dispense.mock_calls,
            [
                mock.call.dispense(50, rate=1.0),
                mock.call.dispense(50, rate=1.0)
            ]
        )
        self.assertEqual(
            self.p300.aspirate.mock_calls,
            [
                mock.call.aspirate(volume=50,
                                   location=None,
                                   rate=1.0),
                mock.call.aspirate(50, rate=1.0)
            ]
        )

    def test_tip_tracking_simple(self):
        self.p300.move_to = mock.Mock()
        self.p300.pick_up_tip()
        self.p300.tip_attached = False  # prior expectation, for test only
        self.p300.pick_up_tip()

        assert self.p300.move_to.mock_calls == \
            self.build_pick_up_tip(self.tiprack1[0]) + \
            self.build_pick_up_tip(self.tiprack1[1])

    def test_simulate_plunger_while_enqueing(self):

        self.p300.pick_up_tip()
        self.assertEquals(self.p300.current_volume, 0)

        self.p300.aspirate(200)
        self.assertEquals(self.p300.current_volume, 200)

        self.p300.dispense(20)
        self.assertEquals(self.p300.current_volume, 180)

        self.p300.dispense(20)
        self.assertEquals(self.p300.current_volume, 160)

        self.p300.dispense(60)
        self.assertEquals(self.p300.current_volume, 100)

        self.p300.dispense(100)
        self.assertEquals(self.p300.current_volume, 0)

        self.p300.drop_tip()

    def test_tip_tracking_chain(self):
        # TODO (ben 20171130): revise this test to make more sense in the
        # context of required tip pick_up/drop sequencing, etc.

        total_tips_per_plate = 4

        def generate_plate(wells, cols, spacing, offset, radius,
                           height=0):
            c = Container()
            c.ordering = []
            n_rows = int(wells / cols)
            for i in range(n_rows):
                c.ordering.append([])
            for i in range(0, wells):
                well = Well(properties={'radius': radius, 'height': height})
                row, col = divmod(i, cols)
                name = chr(col + ord('A')) + str(1 + row)
                c.ordering[row].append(name)
                coordinates = (col * spacing[0] + offset[0],
                               row * spacing[1] + offset[1],
                               0)
                c.add(well, name, coordinates)
            return c

        self.tiprack1 = generate_plate(
            total_tips_per_plate, 2, (5, 5), (0, 0), 5)
        self.tiprack2 = generate_plate(
            total_tips_per_plate, 2, (5, 5), (0, 0), 5)
        robot._deck['1'].add(self.tiprack1, 'tiprack1')
        robot._deck['2'].add(self.tiprack2, 'tiprack2')

        self.p300 = instruments.P300_Single(
            mount='right',
            tip_racks=[self.tiprack1, self.tiprack2],
            trash_container=self.tiprack1)
        self.p300.max_volume = 200

        self.p300.move_to = mock.Mock()

        for _ in range(0, total_tips_per_plate * 2):
            self.p300.pick_up_tip()
            self.p300.tip_attached = False  # prior expectation, for test only

        expected = []
        for i in range(0, total_tips_per_plate):
            expected.extend(self.build_pick_up_tip(self.tiprack1[i]))
        for i in range(0, total_tips_per_plate):
            expected.extend(self.build_pick_up_tip(self.tiprack2[i]))

        self.assertEqual(
            self.p300.move_to.mock_calls,
            expected
        )

        # test then when we go over the total number of tips,
        # Pipette raises a RuntimeWarning
        robot.clear_commands()
        self.p300.reset()
        for _ in range(0, total_tips_per_plate * 2):
            self.p300.pick_up_tip()
            self.p300.tip_attached = False  # prior expectation, for test only

        self.assertRaises(RuntimeWarning, self.p300.pick_up_tip)

    def test_assert_on_double_pick_up_tip(self):
        self.p300.pick_up_tip()
        self.assertRaises(AssertionError, self.p300.pick_up_tip)

    def test_assert_on_drop_without_tip(self):
        self.assertRaises(AssertionError, self.p300.drop_tip)

    def test_tip_tracking_chain_multi_channel(self):
        # TODO (ben 20171130): revise this test to make more sense in the
        # context of required tip pick_up/drop sequencing, etc.

        p300_multi = instruments.P300_Multi(
            trash_container=self.trash,
            tip_racks=[self.tiprack1, self.tiprack2],
            mount='right')

        p300_multi.calibrate_plunger(
            top=0, bottom=10, blow_out=12, drop_tip=13)
        p300_multi.move_to = mock.Mock()

        for _ in range(0, 12 * 2):
            p300_multi.pick_up_tip()
            p300_multi.tip_attached = False  # prior expectation, for test only

        expected = []
        for i in range(0, 12):
            expected.extend(self.build_pick_up_tip(self.tiprack1.cols[i]))
        for i in range(0, 12):
            expected.extend(self.build_pick_up_tip(self.tiprack2.cols[i]))

        self.assertEqual(
            p300_multi.move_to.mock_calls,
            expected
        )

    def test_tip_tracking_start_at_tip(self):
        self.p300.start_at_tip(self.tiprack1['B2'])
        self.p300.pick_up_tip()
        self.assertEquals(self.tiprack1['B2'], self.p300.current_tip())

    def test_tip_tracking_return(self):
        # Note: because this test mocks out `drop_tip`, as a side-effect
        # `tip_attached` must be manually set as it would be under the
        # `return_tip` callstack, making this tesk somewhat fragile

        self.p300.drop_tip = mock.Mock()

        self.p300.pick_up_tip()
        self.p300.return_tip()
        self.p300.tip_attached = False

        self.p300.pick_up_tip()
        self.p300.return_tip()

        expected = [
            mock.call(self.tiprack1[0], home_after=True),
            mock.call(self.tiprack1[1], home_after=True)
        ]

        self.assertEqual(self.p300.drop_tip.mock_calls, expected)

    def test_direct_movement_within_well(self):
        robot.move_to = mock.Mock()
        self.p300.move_to(self.plate[0])
        self.p300.move_to(self.plate[0].top())
        self.p300.move_to(self.plate[0].bottom())
        self.p300.move_to(self.plate[1])
        self.p300.move_to(self.plate[2])
        self.p300.move_to(self.plate[2].bottom())

        expected = [
            mock.call(
                self.plate[0], instrument=self.p300, strategy='arc'),
            mock.call(
                self.plate[0].top(), instrument=self.p300, strategy='direct'),
            mock.call(
                self.plate[0].bottom(), instrument=self.p300, strategy='direct'),
            mock.call(
                self.plate[1], instrument=self.p300, strategy='arc'),
            mock.call(
                self.plate[2], instrument=self.p300, strategy='arc'),
            mock.call(
                self.plate[2].bottom(), instrument=self.p300, strategy='direct')
        ]
        from pprint import pprint
        pprint(robot.move_to.mock_calls)
        self.assertEqual(robot.move_to.mock_calls, expected)

    def build_pick_up_tip(self, well):
        plunge = -10
        return [
            mock.call(well.top()),
            mock.call(well.top(plunge), strategy='direct'),
            mock.call(well.top(), strategy='direct'),
            mock.call(well.top(plunge - 1), strategy='direct'),
            mock.call(well.top(), strategy='direct'),
            mock.call(well.top(plunge - 2), strategy='direct'),
            mock.call(well.top(), strategy='direct')
        ]
