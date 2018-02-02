# pylama:ignore=E501

import unittest
from unittest import mock
from opentrons.robot.robot import Robot
from opentrons.containers import load as containers_load
from opentrons.instruments import Pipette
# from opentrons.util.vector import Vector
from opentrons.containers.placeable import unpack_location, Container, Well
from opentrons.trackers import pose_tracker
from tests.opentrons.conftest import fuzzy_assert
from numpy import isclose


def test_drop_tip_move_to(robot):
    plate = containers_load(robot, '96-flat', '1')
    tiprack = containers_load(robot, 'tiprack-200ul', '3')
    p200 = Pipette(robot, mount='left', tip_racks=[tiprack])
    p200.tip_attached = True
    x, y, z = (161.0, 116.7, 3.0)

    robot.poses = p200._move(robot.poses, x=x, y=y, z=z)
    robot.calibrate_container_with_instrument(plate, p200, False)

    # p200.move_to(plate[0])
    p200.drop_tip(plate[0])

    # current_pos = pose_tracker.absolute(robot.poses, p200)

    # assert current_pos == \
    #     Vector({
    #         'x': x,
    #         'y': y,
    #         'z': z + p200._drop_tip_offset + DEFAULT_TIP_LENGTH
    #     })


def test_aspirate_move_to(robot):
    tip_rack = containers_load(robot, 'tiprack-200ul', '3')
    p200 = Pipette(robot,
                   mount='left',
                   tip_racks=[tip_rack])

    x, y, z = (161.0, 116.7, 0.0)
    plate = containers_load(robot, '96-flat', '1')
    well = plate[0]
    pos = well.from_center(x=0, y=0, z=-1, reference=plate)
    location = (plate, pos)

    robot.poses = p200._move(robot.poses, x=x, y=y, z=z)
    robot.calibrate_container_with_instrument(plate, p200, False)

    p200.pick_up_tip()
    p200.aspirate(100, location)
    current_pos = pose_tracker.absolute(
        robot.poses,
        p200.instrument_actuator)
    assert (current_pos == (7.402, 0.0, 0.0)).all()

    current_pos = pose_tracker.absolute(robot.poses, p200)
    assert isclose(current_pos, (175.34,  127.94,   10.5)).all()


def test_blow_out_move_to(robot):
    tiprack = containers_load(robot, 'tiprack-200ul', '3')
    p200 = Pipette(robot, mount='left', tip_racks=[tiprack])
    p200.pick_up_tip()

    plate = containers_load(robot, '96-flat', '1')
    x, y, z = (161.0, 116.7, 3.0)
    well = plate[0]
    pos = well.from_center(x=0, y=0, z=-1, reference=plate)
    location = (plate, pos)

    robot.poses = p200._move(robot.poses, x=x, y=y, z=z)
    robot.calibrate_container_with_instrument(plate, p200, False)
    p200.blow_out(location)
    # TODO (artyom, 20171102):  uncomment once calibration is fixed
    # current_pos = pose_tracker.absolute(robot.poses, p200)

    # TODO (artyom, 20171102):  uncomment once calibration is fixed
    # assert (current_pos == (172.24, 131.04, 3.0)).all()
    # current_pos = robot._driver.get_plunger_positions()['current']
    # assert current_pos == {'a': 0, 'b': 12.0}


def test_dispense_move_to(robot):
    tip_rack = containers_load(robot, 'tiprack-200ul', '3')
    p200 = Pipette(robot,
                   mount='left',
                   tip_racks=[tip_rack])

    x, y, z = (161.0, 116.7, 0.0)
    plate = containers_load(robot, '96-flat', '1')
    well = plate[0]
    pos = well.from_center(x=0, y=0, z=-1, reference=plate)
    location = (plate, pos)

    robot.poses = p200._move(robot.poses, x=x, y=y, z=z)
    robot.calibrate_container_with_instrument(plate, p200, False)

    p200.pick_up_tip()
    p200.aspirate(100, location)
    p200.dispense(100, location)
    current_pos = pose_tracker.absolute(
        robot.poses,
        p200.instrument_actuator)
    assert (current_pos == (2.0, 0.0, 0.0)).all()

    current_pos = pose_tracker.absolute(robot.poses, p200)
    assert isclose(current_pos, (175.34,  127.94,   10.5)).all()


class PipetteTest(unittest.TestCase):
    def setUp(self):
        self.robot = Robot()
        self.robot.home()
        self.trash = containers_load(self.robot, 'point', '1')
        self.tiprack1 = containers_load(self.robot, 'tiprack-10ul', '5')
        self.tiprack2 = containers_load(self.robot, 'tiprack-10ul', '8')

        self.plate = containers_load(self.robot, '96-flat', '4')

        self.p200 = Pipette(
            self.robot,
            trash_container=self.trash,
            tip_racks=[self.tiprack1, self.tiprack2],
            min_volume=10,  # These are variable
            mount='left',
            channels=1,
            name='other-pipette-for-transfer-tests'
        )
        self.p200.max_volume = 200

        self.p200.reset()

        self.p200.calibrate_plunger(top=0, bottom=10, blow_out=12, drop_tip=13)
        self.robot.home()

    def tearDown(self):
        del self.robot

    def test_bad_volume_percentage(self):
        self.assertRaises(RuntimeError, self.p200._volume_percentage, -1)

    def test_add_instrument(self):
        self.robot.reset()
        Pipette(self.robot, mount='left')
        self.assertRaises(RuntimeError, Pipette, self.robot, mount='left')

    def test_aspirate_zero_volume(self):
        assert self.robot.commands() == []
        self.p200.tip_attached = True
        self.p200.aspirate(0)
        assert self.robot.commands() == ['Aspirating 0 uL from ? at 1.0 speed']  # noqa

    def test_get_plunger_position(self):

        self.assertEquals(self.p200._get_plunger_position('top'), 0)
        self.assertEquals(self.p200._get_plunger_position('bottom'), 10)
        self.assertEquals(self.p200._get_plunger_position('blow_out'), 12)
        self.assertEquals(self.p200._get_plunger_position('drop_tip'), 13)

        self.p200.plunger_positions['drop_tip'] = None
        self.assertRaises(
            RuntimeError, self.p200._get_plunger_position, 'drop_tip')

        self.assertRaises(
            RuntimeError, self.p200._get_plunger_position, 'roll_out')

    def test_set_max_volume(self):
        import warnings
        warnings.filterwarnings('error')
        self.assertRaises(UserWarning, self.p200.set_max_volume, 200)
        self.assertRaises(
            UserWarning, Pipette, self.robot, mount='right', max_volume=200)
        warnings.filterwarnings('default')

    # TODO: (artyom, 20171101): bring back once plunger position is being tracked
    # def test_calibrate_by_position_name(self):

    #     self.p200.motor.move(9)
    #     self.p200.calibrate('bottom')
    #     self.assertEquals(self.p200.plunger_positions['bottom'], 9)

    def test_deprecated_axis_call(self):
        import warnings

        warnings.filterwarnings('error')
        # Check that user warning occurs when axis is called
        self.assertRaises(
            UserWarning, Pipette, self.robot, axis='a')

        # Check that the warning is still valid when max_volume is also used
        self.assertRaises(
            UserWarning, Pipette, self.robot, axis='a', max_volume=300)

        warnings.filterwarnings('default')

    def test_get_instruments_by_name(self):
        self.p1000 = Pipette(
            self.robot,
            trash_container=self.trash,
            tip_racks=[self.tiprack1],
            min_volume=10,  # These are variable
            mount='right',
            name='p1000',
            channels=1,
            aspirate_speed=300,
            dispense_speed=500
        )
        result = list(self.robot.get_instruments('p1000'))
        self.assertListEqual(result, [('right', self.p1000)])

    def test_placeables_reference(self):
        self.p200.tip_attached = True
        self.p200.aspirate(100, self.plate[0])
        self.p200.dispense(100, self.plate[0])
        self.p200.aspirate(100, self.plate[20])
        self.p200.aspirate(100, self.plate[1])

        expected = [
            self.plate[0],
            self.plate[20],
            self.plate[1]
        ]

        self.assertEquals(self.p200.placeables, expected)

    def test_unpack_location(self):

        location = (self.plate[0], (1, 0, -1))
        res = unpack_location(location)
        self.assertEqual(res, (self.plate[0], (1, 0, -1)))

        res = unpack_location(self.plate[0])
        self.assertEqual(
            res,
            (self.plate[0], self.plate[0].from_center(x=0, y=0, z=1)))

    # TODO(artyom, ben 20171030): add speed getter
    # def test_aspirate_rate(self):
    #     self.p200.set_speed(aspirate=300, dispense=500)
    #     self.robot.clear_commands()
    #     self.p200.instrument_actuator.driver.speed = mock.Mock()
    #     self.p200.aspirate(100, rate=2.0).dispense(rate=.5)
    #     expected = [
    #         mock.call(600.0),
    #         mock.call(250.0)
    #     ]
    #     self.assertEquals(self.p200.motor.speed.mock_calls, expected)

    # TODO(artyom, ben 20171030): fix in a follow-up PR where we are tracking
    # actuators
    # def test_empty_aspirate(self):
    #     self.p200.aspirate(100)
    #     current_pos = self.robot._driver.get_plunger_positions()['current']

    #     self.assertDictEqual(
    #         current_pos,
    #         {'a': 0, 'b': 5.0}
    #     )

    # TODO(artyom, ben 20171030): add speed getter
    # def test_non_empty_aspirate(self):
    #     self.p200.aspirate(100)
    #     self.p200.aspirate(20)

    #     current_pos = self.robot._driver.get_plunger_positions()['current']
    #     self.assertDictEqual(
    #         current_pos,
    #         {'a': 0, 'b': 4.0}
    #     )

    # TODO(artyom, ben 20171030): fix in a follow-up PR where we are tracking
    # actuators
    # def test_aspirate_no_args(self):
    #     self.p200.aspirate()

    #     current_pos = self.robot._driver.get_plunger_positions()['current']
    #     self.assertDictEqual(
    #         current_pos,
    #         {'a': 0, 'b': 0.0}
    #     )

    def test_aspirate_invalid_max_volume(self):
        self.p200.tip_attached = True
        with self.assertRaises(RuntimeWarning):
            self.p200.aspirate(500)

    def test_volume_percentage(self):
        self.assertRaises(RuntimeError, self.p200._volume_percentage, -1)
        self.assertRaises(RuntimeError, self.p200._volume_percentage, 300)
        self.assertEquals(self.p200._volume_percentage(100), 0.5)
        self.assertEquals(len(self.robot.get_warnings()), 0)
        self.p200._volume_percentage(self.p200.min_volume / 2)
        self.assertEquals(len(self.robot.get_warnings()), 1)

    # TODO (artyom, 20171102): bring back once we are tracking plungers
    # def test_dispense(self):
    #     self.p200.aspirate(100)
    #     self.p200.dispense(20)

    #     current_pos = self.robot._driver.get_plunger_positions()['current']
    #     self.assertDictEqual(
    #         current_pos,
    #         {'a': 0, 'b': 6.0}
    #     )

    #     self.robot.clear_commands()
    #     self.p200.reset()
    #     self.p200.aspirate().dispense(0)
    #     self.assertEquals(len(self.robot.commands()), 2)

    # TODO (artyom, 20171102): bring back once we are tracking plungers
    # def test_dispense_no_args(self):
    #     self.p200.aspirate(100)
    #     self.p200.dispense()

    #     current_pos = self.robot._driver.get_plunger_positions()['current']
    #     self.assertDictEqual(
    #         current_pos,
    #         {'a': 0, 'b': 10.0}
    #     )

    # TODO (artyom, 20171102): bring back once we are tracking plungers
    # def test_blow_out(self):
    #     self.p200.blow_out()

    #     current_pos = self.robot._driver.get_plunger_positions()['current']
    #     self.assertDictEqual(
    #         current_pos,
    #         {'a': 0, 'b': 12.0}
    #     )

    def test_add_tip(self):
        """
        This deals with z accrual behavior during tip add/remove, when +/- get
        flipped in pose tracking logic
        """
        prior_position = pose_tracker.absolute(self.robot.poses, self.p200)
        self.p200._add_tip(42)
        self.p200._remove_tip(42)
        new_position = pose_tracker.absolute(self.robot.poses, self.p200)

        assert (new_position == prior_position).all()

    # # TODO (artyom, 20171102):  uncomment once calibration is fixed
    # def test_pick_up_tip(self):
    #     last_well = self.tiprack1[-1]
    #     target_pos = pose_tracker.absolute(self.robot.poses, last_well)
    #     self.p200.pick_up_tip(last_well)
    #     current_pos = pose_tracker.absolute(self.robot.poses, self.p200)
    #     assert (current_pos == target_pos).all()

    #     last_well = self.tiprack1[-1]
    #     target_pos = last_well.from_center(
    #         x=0, y=0, z=-1,
    #         reference=self.robot._deck)
    #     self.p200.pick_up_tip(last_well, presses=0)
    #     current_pos = pose_tracker.absolute(self.robot.poses, self.p200)
    #     self.assertEqual(current_pos, target_pos)

    #     last_well = self.tiprack1[-1]
    #     target_pos = last_well.from_center(
    #         x=0, y=0, z=-1,
    #         reference=self.robot._deck)
    #     self.p200.pick_up_tip(last_well, presses='a')
    #     current_pos = pose_tracker.absolute(self.robot.poses, self.p200)
    #     self.assertEqual(current_pos, target_pos)

    #     self.p200.reset()
    #     self.p200.tip_racks = []
    #     self.robot.clear_commands()
    #     self.assertEquals(len(self.robot.get_warnings()), 0)
    #     self.p200.pick_up_tip()
    #     self.assertEquals(len(self.robot.get_warnings()), 1)

    # TODO (artyom 20171102): bring back once plunger tracking is back
    # def test_drop_tip(self):
    #     self.p200.drop_tip()

    #     current_pos = self.robot._driver.get_plunger_positions()['current']
    #     self.assertDictEqual(
    #         current_pos,
    #         {'a': 0, 'b': 10.0}
    #     )

    #     self.robot.clear_commands()
    #     self.p200.reset()
    #     self.p200.drop_tip(home_after=False)

    #     current_pos = self.robot._driver.get_plunger_positions()['current']
    #     self.assertDictEqual(
    #         current_pos,
    #         {'a': 0, 'b': 10.0}
    #     )

    def test_delay(self):
        self.p200.delay(1)

        self.assertEqual(
            self.robot.commands()[-1],
            "Delaying for 0m 1s")

        self.robot.clear_commands()
        self.p200.delay(seconds=12, minutes=10)

        self.assertEqual(
            self.robot.commands()[-1],
            "Delaying for 10m 12s")

    def test_set_speed(self):
        self.p200.set_speed(aspirate=100)
        self.assertEqual(self.p200.speeds['aspirate'], 100)

        self.p200.set_speed(dispense=100)
        self.assertEqual(self.p200.speeds['dispense'], 100)

    def test_set_flow_rate(self):
        ul_per_mm = 20
        self.p200 = Pipette(self.robot, mount='right', ul_per_mm=ul_per_mm)

        self.p200.set_flow_rate(aspirate=100)
        expected_mm_per_sec = 100 / ul_per_mm
        self.assertEqual(self.p200.speeds['aspirate'], expected_mm_per_sec)

        self.p200.set_flow_rate(dispense=200)
        expected_mm_per_sec = 200 / ul_per_mm
        self.assertEqual(self.p200.speeds['dispense'], expected_mm_per_sec)

    def test_distribute(self):
        self.p200.reset()
        # Setting true instead of calling pick_up_tip because the test is
        # currently based on an exact command list. Should make this better.
        self.p200.distribute(
            30,
            self.plate[0],
            self.plate[1:9],
            new_tip='always'
        )
        # print('\n\n***\n')
        # pprint(self.robot.commands())
        expected = [
            ['Distributing', '30', 'well A1', 'wells B1...A2'],
            ['Transferring'],
            ['Picking up tip'],
            ['Aspirating', '190', 'well A1'],
            ['Dispensing', '30', 'well B1'],
            ['Dispensing', '30', 'well C1'],
            ['Dispensing', '30', 'well D1'],
            ['Dispensing', '30', 'well E1'],
            ['Dispensing', '30', 'well F1'],
            ['Dispensing', '30', 'well G1'],
            ['Blow', 'well A1'],
            ['Drop'],
            ['Pick'],
            ['Aspirating', '70', 'well A1'],
            ['Dispensing', '30', 'well H1'],
            ['Dispensing', '30', 'well A2'],
            ['Blow', 'well A1'],
            ['Drop']
        ]
        fuzzy_assert(self.robot.commands(), expected=expected)
        self.robot.clear_commands()

        self.p200.reset()
        self.p200.tip_attached = True
        self.p200.distribute(
            30,
            self.plate[0],
            self.plate[1:9],
            new_tip='never'
        )

        expected = [
            ['Distributing', '30', 'well A1', 'wells B1...A2'],
            ['Transferring'],
            ['Aspirating', '190', 'well A1'],
            ['Dispensing', '30', 'well B1'],
            ['Dispensing', '30', 'well C1'],
            ['Dispensing', '30', 'well D1'],
            ['Dispensing', '30', 'well E1'],
            ['Dispensing', '30', 'well F1'],
            ['Dispensing', '30', 'well G1'],
            ['Blow', 'well A1'],
            ['Aspirating', '70', 'well A1'],
            ['Dispensing', '30', 'well H1'],
            ['Dispensing', '30', 'well A2'],
            ['Blow', 'well A1'],
        ]
        fuzzy_assert(self.robot.commands(), expected=expected)
        self.robot.clear_commands()

        self.p200.reset()
        self.p200.distribute(
            30,
            self.plate[0],
            self.plate
        )

        total_dispenses = 0
        for c in self.robot.commands():
            if 'dispensing' in c.lower():
                total_dispenses += 1
        self.assertEqual(total_dispenses, 96)
        self.robot.clear_commands()

        self.p200.reset()
        self.p200.transfer(
            30,
            self.plate[0],
            self.plate[1:9],
            trash=False
        )

        expected = [
            ['Transferring', '30', 'well A1'],
            ['Pick'],
            ['Aspirating', '30', 'well A1'],
            ['Dispensing', '30', 'well B1'],
            ['Aspirating', '30', 'well A1'],
            ['Dispensing', '30', 'well C1'],
            ['Aspirating', '30', 'well A1'],
            ['Dispensing', '30', 'well D1'],
            ['Aspirating', '30', 'well A1'],
            ['Dispensing', '30', 'well E1'],
            ['Aspirating', '30', 'well A1'],
            ['Dispensing', '30', 'well F1'],
            ['Aspirating', '30', 'well A1'],
            ['Dispensing', '30', 'well G1'],
            ['Aspirating', '30', 'well A1'],
            ['Dispensing', '30', 'well H1'],
            ['Aspirating', '30', 'well A1'],
            ['Dispensing', '30', 'well A2'],
            ['Return'],
            ['Drop']
        ]
        fuzzy_assert(self.robot.commands(), expected=expected)
        self.robot.clear_commands()

    def test_consolidate(self):

        self.p200.reset()
        self.p200.consolidate(
            30,
            self.plate[0:8],
            self.plate['A2'],
            new_tip='always'
        )

        expected = [
            ['Consolidating', '30'],
            ['Transferring', '30'],
            ['Pick'],
            ['Aspirating', '30', 'Well A1'],
            ['Aspirating', '30', 'Well B1'],
            ['Aspirating', '30', 'Well C1'],
            ['Aspirating', '30', 'Well D1'],
            ['Aspirating', '30', 'Well E1'],
            ['Aspirating', '30', 'Well F1'],
            ['Dispensing', '180', 'Well A2'],
            ['Drop'],
            ['Pick'],
            ['Aspirating', '30', 'Well G1'],
            ['Aspirating', '30', 'Well H1'],
            ['Dispensing', '60', 'Well A2'],
            ['Drop']
        ]
        fuzzy_assert(self.robot.commands(),
                     expected=expected)
        self.robot.clear_commands()

        self.p200.reset()
        self.p200.tip_attached = True
        self.p200.consolidate(
            30,
            self.plate[0:8],
            self.plate['A2'],
            new_tip='never'
        )
        # from pprint import pprint
        # print('\n\n***\n')
        # pprint(self.robot.commands())
        expected = [
            ['Consolidating', '30'],
            ['Transferring', '30'],
            ['Aspirating', '30', 'Well A1'],
            ['Aspirating', '30', 'Well B1'],
            ['Aspirating', '30', 'Well C1'],
            ['Aspirating', '30', 'Well D1'],
            ['Aspirating', '30', 'Well E1'],
            ['Aspirating', '30', 'Well F1'],
            ['Dispensing', '180', 'Well A2'],
            ['Aspirating', '30', 'Well G1'],
            ['Aspirating', '30', 'Well H1'],
            ['Dispensing', '60', 'Well A2'],
        ]
        fuzzy_assert(self.robot.commands(), expected=expected)
        self.robot.clear_commands()

        self.p200.reset()
        self.p200.consolidate(
            30,
            self.plate,
            self.plate[0]
        )
        # from pprint import pprint
        # print('\n\n***\n')
        # pprint(self.robot.commands())
        total_aspirates = 0
        for c in self.robot.commands():
            if 'aspirating' in c.lower():
                total_aspirates += 1
        self.assertEqual(total_aspirates, 96)
        self.robot.clear_commands()

        self.p200.reset()
        self.p200.transfer(
            30,
            self.plate[0:8],
            self.plate['A2']
        )

        expected = [
            ['Transferring', '30'],
            ['Pick'],
            ['Aspirating', '30', 'Well A1'],
            ['Dispensing', '30', 'Well A2'],
            ['Aspirating', '30', 'Well B1'],
            ['Dispensing', '30', 'Well A2'],
            ['Aspirating', '30', 'Well C1'],
            ['Dispensing', '30', 'Well A2'],
            ['Aspirating', '30', 'Well D1'],
            ['Dispensing', '30', 'Well A2'],
            ['Aspirating', '30', 'Well E1'],
            ['Dispensing', '30', 'Well A2'],
            ['Aspirating', '30', 'Well F1'],
            ['Dispensing', '30', 'Well A2'],
            ['Aspirating', '30', 'Well G1'],
            ['Dispensing', '30', 'Well A2'],
            ['Aspirating', '30', 'Well H1'],
            ['Dispensing', '30', 'Well A2'],
            ['Drop']
        ]
        fuzzy_assert(self.robot.commands(), expected=expected)
        self.robot.clear_commands()

    def test_transfer(self):

        self.p200.reset()
        self.p200.transfer(
            30,
            self.plate[0:8],
            self.plate[1:9],
            new_tip='always',
            air_gap=10,
            disposal_vol=20,  # ignored by transfer
            touch_tip=True,
            blow_out=True,
            trash=True
        )
        # from pprint import pprint
        # print('\n\n***\n')
        # pprint(self.robot.commands())
        expected = [
            ['Transferring', '30'],
            ['pick'],
            ['aspirating', '30', 'Well A1'],
            ['air'],
            ['aspirating', '10'],
            ['touch'],
            ['dispensing', '10', 'Well B1'],
            ['dispensing', '30', 'Well B1'],
            ['blow'],
            ['touch'],
            ['drop'],
            ['pick'],
            ['aspirating', '30', 'Well B1'],
            ['air'],
            ['aspirating', '10'],
            ['touch'],
            ['dispensing', '10', 'Well C1'],
            ['dispensing', '30', 'Well C1'],
            ['blow'],
            ['touch'],
            ['drop'],
            ['pick'],
            ['aspirating', '30', 'Well C1'],
            ['air'],
            ['aspirating', '10'],
            ['touch'],
            ['dispensing', '10', 'Well D1'],
            ['dispensing', '30', 'Well D1'],
            ['blow'],
            ['touch'],
            ['drop'],
            ['pick'],
            ['aspirating', '30', 'Well D1'],
            ['air'],
            ['aspirating', '10'],
            ['touch'],
            ['dispensing', '10', 'Well E1'],
            ['dispensing', '30', 'Well E1'],
            ['blow'],
            ['touch'],
            ['drop'],
            ['pick'],
            ['aspirating', '30', 'Well E1'],
            ['air'],
            ['aspirating', '10'],
            ['touch'],
            ['dispensing', '10', 'Well F1'],
            ['dispensing', '30', 'Well F1'],
            ['blow'],
            ['touch'],
            ['drop'],
            ['pick'],
            ['aspirating', '30', 'Well F1'],
            ['air'],
            ['aspirating', '10'],
            ['touch'],
            ['dispensing', '10', 'Well G1'],
            ['dispensing', '30', 'Well G1'],
            ['blow'],
            ['touch'],
            ['drop'],
            ['pick'],
            ['aspirating', '30', 'Well G1'],
            ['air'],
            ['aspirating', '10'],
            ['touch'],
            ['dispensing', '10', 'Well H1'],
            ['dispensing', '30', 'Well H1'],
            ['blow'],
            ['touch'],
            ['drop'],
            ['pick'],
            ['aspirating', '30', 'Well H1'],
            ['air'],
            ['aspirating', '10'],
            ['touch'],
            ['dispensing', '10', 'Well A2'],
            ['dispensing', '30', 'Well A2'],
            ['blow'],
            ['touch'],
            ['drop']
        ]
        fuzzy_assert(self.robot.commands(),
                     expected=expected)
        self.robot.clear_commands()

    def test_bad_transfer(self):
        self.p200.reset()

        self.assertRaises(
            ValueError,
            self.p200.transfer,
            30,
            self.plate[0:2],
            self.plate[0:3]
        )

        self.assertRaises(
            ValueError,
            self.p200.transfer,
            30,
            self.plate[0:3],
            self.plate[0:2]
        )

        self.assertRaises(
            RuntimeError,
            self.p200.transfer,
            [30, 30, 30],
            self.plate[0:2],
            self.plate[0:2]
        )

        self.assertRaises(
            ValueError,
            self.p200.transfer,
            30,
            self.plate[0],
            self.plate[1],
            new_tip='sometimes'
        )

        self.assertRaises(
            ValueError,
            self.p200.transfer,
            [20, 20, 20, 20],
            self.plate[0:3],
            self.plate[1:4],
            new_tip='sometimes'
        )

    def test_divisible_locations(self):
        self.p200.reset()
        self.p200.transfer(
            100,
            self.plate[0:4],
            self.plate[0:2]
        )
        # from pprint import pprint
        # print('\n\n***\n')
        # pprint(self.robot.commands())
        expected = [
            ['transferring', '100'],
            ['pick'],
            ['aspirating', '100', 'Well A1'],
            ['dispensing', '100', 'Well A1'],
            ['aspirating', '100', 'Well B1'],
            ['dispensing', '100', 'Well A1'],
            ['aspirating', '100', 'Well C1'],
            ['dispensing', '100', 'Well B1'],
            ['aspirating', '100', 'Well D1'],
            ['dispensing', '100', 'Well B1'],
            ['drop']
        ]
        fuzzy_assert(self.robot.commands(),
                     expected=expected)
        self.robot.clear_commands()

        self.p200.reset()
        self.p200.consolidate(
            100,
            self.plate[0:4],
            self.plate[0:2]
        )
        expected = [
            ['consolidating', '100'],
            ['transferring', '100'],
            ['pick'],
            ['aspirating', '100', 'Well A1'],
            ['aspirating', '100', 'Well B1'],
            ['dispensing', '200', 'Well A1'],
            ['aspirating', '100', 'Well C1'],
            ['aspirating', '100', 'Well D1'],
            ['dispensing', '200', 'Well B1'],
            ['drop']
        ]
        fuzzy_assert(self.robot.commands(),
                     expected=expected
                     )
        self.robot.clear_commands()

        self.p200.reset()
        self.p200.distribute(
            100,
            self.plate[0:2],
            self.plate[0:4],
            disposal_vol=0
        )

        expected = [
            ['distributing', '100'],
            ['transferring', '100'],
            ['pick'],
            ['aspirating', '200', 'Well A1'],
            ['dispensing', '100', 'Well A1'],
            ['dispensing', '100', 'Well B1'],
            ['aspirating', '200', 'Well B1'],
            ['dispensing', '100', 'Well C1'],
            ['dispensing', '100', 'Well D1'],
            ['drop']
        ]
        fuzzy_assert(self.robot.commands(),
                     expected=expected
                     )
        self.robot.clear_commands()

    def test_transfer_volume_control(self):

        self.p200.reset()
        self.p200.transfer(
            300,
            self.plate[0],
            self.plate[1],
            touch_tip=False,
            blow_out=False
        )
        expected = [
            'Transferring 300 from well A1 in "4" to well B1 in "4"',
            'Picking up tip well A1 in "5"',
            'Aspirating 150.0 uL from well A1 in "4" at 1 speed',
            'Dispensing 150.0 uL into well B1 in "4"',
            'Aspirating 150.0 uL from well A1 in "4" at 1 speed',
            'Dispensing 150.0 uL into well B1 in "4"',
            'Dropping tip well A1 in "1"']

        assert expected == list(filter(
            lambda s: 'Moving to' not in s,
            self.robot.commands()
        ))

        self.robot.clear_commands()

        self.p200.reset()
        self.p200.transfer(
            598,
            self.plate[0],
            self.plate[1],
            touch_tip=False,
            blow_out=False
        )

        expected = [
            'Transferring 598 from <Well A1> to <Well B1>',
            'Picking up tip None',
            'Aspirating 200.0 uL from <Well A1> at 1 speed',
            'Dispensing 200.0 uL into <Well B1>',
            'Aspirating 199.0 uL from <Well A1> at 1 speed',
            'Dispensing 199.0 uL into <Well B1>',
            'Aspirating 199.0 uL from <Well A1> at 1 speed',
            'Dispensing 199.0 uL into <Well B1>',
            'Dropping tip None']

        # assert expected == list(filter(
        #     lambda s: 'Moving to' not in s,
        #     self.robot.commands()
        # ))

        self.robot.clear_commands()

        self.p200.reset()
        self.assertRaises(
            RuntimeWarning,
            self.p200.transfer,
            300,
            self.plate[0],
            self.plate[1],
            carryover=False
        )
        self.robot.clear_commands()

        self.p200.reset()
        self.p200.distribute(
            (10, 80),
            self.plate[0],
            self.plate.rows[1],
            touch_tip=False,
            blow_out=True
        )

        expected = [
            'Distributing (10, 80) from <Well A1> to <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>>',  # noqa
            'Transferring (10, 80) from <Well A1> to <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>>',  # noqa
            'Picking up tip None',
            'Aspirating 160.0 uL from <Well A1> at 1 speed',
            'Dispensing 10.0 uL into <Well A2>',
            'Dispensing 20.0 uL into <Well B2>',
            'Dispensing 30.0 uL into <Well C2>',
            'Dispensing 40.0 uL into <Well D2>',
            'Dispensing 50.0 uL into <Well E2>',
            'Blowing out at <Well A1>',
            'Aspirating 140.0 uL from <Well A1> at 1 speed',
            'Dispensing 60.0 uL into <Well F2>', 'Dispensing 70.0 uL into <Well G2>',
            'Blowing out at <Well A1>',
            'Aspirating 80.0 uL from <Well A1> at 1 speed',
            'Dispensing 80.0 uL into <Well H2>',
            'Blowing out at None', 'Dropping tip None']

        # assert expected == list(filter(
        #     lambda s: 'Moving to' not in s,
        #     self.robot.commands()
        # ))

        self.robot.clear_commands()

        self.p200.reset()
        self.p200.distribute(
            (10, 80),
            self.plate[0],
            self.plate.rows[1],
            touch_tip=True,
            blow_out=False,
            air_gap=20,
            gradient=lambda x: 1.0 - x
        )

        expected = \
            ['Distributing (10, 80) from <Well A1> to <WellSeries: <Well A2><Well B2><Well '
             'C2><Well D2><Well E2><Well F2><Well G2><Well H2>>',
             'Transferring (10, 80) from <Well A1> to <WellSeries: <Well A2><Well B2><Well '
             'C2><Well D2><Well E2><Well F2><Well G2><Well H2>>',
             'Picking up tip None',
             'Aspirating 160.0 uL from <Well A1> at 1 speed',
             'Air gap',
             'Aspirating 20 uL from None at 1.0 speed',
             'Touching tip',
             'Dispensing 20 uL into (<Deck><Slot A2><Container 96-flat><Well A2>, (x=3.20, '
             'y=3.20, z=15.50))',
             'Dispensing 80.0 uL into <Well A2>',
             'Air gap',
             'Aspirating 20 uL from None at 1.0 speed',
             'Touching tip',
             'Dispensing 20 uL into (<Deck><Slot A2><Container 96-flat><Well B2>, (x=3.20, '
             'y=3.20, z=15.50))',
             'Dispensing 70.0 uL into <Well B2>',
             'Blowing out at <Well A1>',
             'Touching tip',
             'Aspirating 160.0 uL from <Well A1> at 1 speed',
             'Air gap',
             'Aspirating 20 uL from None at 1.0 speed',
             'Touching tip',
             'Dispensing 20 uL into (<Deck><Slot A2><Container 96-flat><Well C2>, (x=3.20, '
             'y=3.20, z=15.50))',
             'Dispensing 60.0 uL into <Well C2>',
             'Air gap',
             'Aspirating 20 uL from None at 1.0 speed',
             'Touching tip',
             'Dispensing 20 uL into (<Deck><Slot A2><Container 96-flat><Well D2>, (x=3.20, '
             'y=3.20, z=15.50))',
             'Dispensing 50.0 uL into <Well D2>',
             'Air gap',
             'Aspirating 20 uL from None at 1.0 speed',
             'Touching tip',
             'Dispensing 20 uL into (<Deck><Slot A2><Container 96-flat><Well E2>, (x=3.20, '
             'y=3.20, z=15.50))',
             'Dispensing 40.0 uL into <Well E2>',
             'Blowing out at <Well A1>',
             'Touching tip',
             'Aspirating 70.0 uL from <Well A1> at 1 speed',
             'Air gap',
             'Aspirating 20 uL from None at 1.0 speed',
             'Touching tip',
             'Dispensing 20 uL into (<Deck><Slot A2><Container 96-flat><Well F2>, (x=3.20, '
             'y=3.20, z=15.50))',
             'Dispensing 30.0 uL into <Well F2>',
             'Air gap',
             'Aspirating 20 uL from None at 1.0 speed',
             'Touching tip',
             'Dispensing 20 uL into (<Deck><Slot A2><Container 96-flat><Well G2>, (x=3.20, '
             'y=3.20, z=15.50))',
             'Dispensing 20.000000000000004 uL into <Well G2>',
             'Air gap',
             'Aspirating 20 uL from None at 1.0 speed',
             'Touching tip',
             'Dispensing 20 uL into (<Deck><Slot A2><Container 96-flat><Well H2>, (x=3.20, '
             'y=3.20, z=15.50))',
             'Dispensing 10.0 uL into <Well H2>',
             'Blowing out at <Well A1>',
             'Touching tip',
             'Dropping tip None']

        # assert expected == list(filter(
        #     lambda s: 'Moving to' not in s,
        #     self.robot.commands()
        # ))

    def test_transfer_mix(self):
        self.p200.reset()
        self.p200.transfer(
            200,
            self.plate[0],
            self.plate[1],
            mix_before=(1, 10),
            mix_after=(1, 10)
        )
        # from pprint import pprint
        # print('\n\n***\n')
        # pprint(self.robot.commands())
        expected = [
            ['Transferring', '200'],
            ['pick'],
            ['mix', '10'],
            ['aspirating', 'Well A1'],
            ['dispensing'],
            ['aspirating', '200', 'Well A1'],
            ['dispensing', '200', 'Well B1'],
            ['mix', '10'],
            ['aspirating', 'Well B1'],
            ['dispensing'],
            ['drop']
        ]
        fuzzy_assert(self.robot.commands(),
                     expected=expected)
        self.robot.clear_commands()

    def test_transfer_air_gap(self):
        self.p200.reset()
        self.p200.transfer(
            120,
            self.plate[0],
            self.plate[1],
            air_gap=20
        )
        expected = [
            ['Transferring', '120'],
            ['pick'],
            ['aspirating', '120', 'Well A1'],
            ['air gap'],
            ['aspirating', '20'],
            ['dispensing', '20', 'Well B1'],
            ['dispensing', '120', 'Well B1'],
            ['drop']
        ]
        fuzzy_assert(self.robot.commands(),
                     expected=expected)
        self.robot.clear_commands()

    def test_consolidate_air_gap(self):
        self.p200.reset()
        self.p200.consolidate(
            60,
            self.plate[0:2],
            self.plate[2],
            air_gap=20
        )
        expected = [
            ['consolidating', '60'],
            ['transferring', '60'],
            ['pick'],
            ['aspirating', '60', 'Well A1'],
            ['aspirating', '60', 'Well B1'],
            ['dispensing', '120', 'Well C1'],
            ['drop']
        ]
        fuzzy_assert(self.robot.commands(),
                     expected=expected)
        self.robot.clear_commands()

    def test_distribute_air_gap(self):
        self.p200.reset()
        self.p200.distribute(
            60,
            self.plate[2],
            self.plate[0:2],
            air_gap=20
        )
        expected = [
            ['distributing', '60'],
            ['transferring', '60'],
            ['pick'],
            ['aspirating', '130', 'Well C1'],
            ['air gap'],
            ['aspirating', '20'],
            ['dispensing', '20'],
            ['dispensing', '60', 'Well A1'],
            ['air gap'],
            ['aspirating', '20'],
            ['dispensing', '20'],
            ['dispensing', '60', 'Well B1'],
            ['blow', 'Well A1'],
            ['drop']
        ]
        fuzzy_assert(self.robot.commands(),
                     expected=expected
                     )
        self.robot.clear_commands()

    def test_distribute_air_gap_and_disposal_vol(self):
        self.p200.reset()
        self.p200.distribute(
            60,
            self.plate[2],
            self.plate[0:2],
            air_gap=20,
            disposal_vol=20
        )
        expected = [
            ['distributing', '60'],
            ['transferring', '60'],
            ['pick'],
            ['aspirating', '140', 'Well C1'],
            ['air gap'],
            ['aspirating', '20'],
            ['dispensing', '20', 'Well A1'],
            ['dispensing', '60', 'Well A1'],
            ['air gap'],
            ['aspirating', '20'],
            ['dispensing', '20', 'Well B1'],
            ['dispensing', '60', 'Well B1'],
            ['blow', 'Well A1'],
            ['drop']
        ]
        fuzzy_assert(self.robot.commands(),
                     expected=expected
                     )
        self.robot.clear_commands()

    def test_consolidate_mix(self):
        self.p200.reset()
        self.p200.consolidate(
            200,
            self.plate[0:2],
            self.plate[2],
            mix_before=(1, 10),
            mix_after=(1, 10)
        )
        expected = [
            ['consolidating', '200'],
            ['transferring', '200'],
            ['pick'],
            ['aspirating', '200', 'Well A1'],
            ['dispensing', '200', 'Well C1'],
            ['mix', '10'],
            ['aspirating', 'Well C1'],
            ['dispensing'],
            ['aspirating', '200', 'Well B1'],
            ['dispensing', '200', 'Well C1'],
            ['mix', '10'],
            ['aspirating', 'Well C1'],
            ['dispensing'],
            ['drop']
        ]
        fuzzy_assert(self.robot.commands(),
                     expected=expected
                     )
        self.robot.clear_commands()

    def test_distribute_mix(self):
        self.p200.reset()
        self.p200.distribute(
            200,
            self.plate[0],
            self.plate[1:3],
            mix_before=(1, 10),
            mix_after=(1, 10)
        )
        expected = [
            ['distributing', '200'],
            ['transferring', '200'],
            ['pick'],
            ['mix', '10'],
            ['aspirating', 'Well A1'],
            ['dispensing'],
            ['aspirating', '200', 'Well A1'],
            ['dispensing', '200', 'Well B1'],
            ['mix', '10'],
            ['aspirating', 'Well A1'],
            ['dispensing'],
            ['aspirating', '200', 'Well A1'],
            ['dispensing', '200', 'Well C1'],
            ['drop']
        ]
        fuzzy_assert(self.robot.commands(),
                     expected=expected
                     )
        self.robot.clear_commands()

    def test_transfer_multichannel(self):
        self.p200.reset()
        self.p200.channels = 8
        self.p200.transfer(
            200,
            self.plate.cols[0],
            self.plate.cols[1],
            touch_tip=False,
            blow_out=False,
            trash=False
        )
        expected = [
            ['Transferring', '200'],
            ['pick'],
            ['aspirating', '200', 'wells A1...H1'],
            ['dispensing', '200', 'wells A2...H2'],
            ['return'],
            ['drop']
        ]
        fuzzy_assert(self.robot.commands(),
                     expected=expected
                     )
        self.robot.clear_commands()

    def test_transfer_single_channel(self):
        self.p200.reset()
        self.p200.channels = 1
        self.p200.transfer(
            200,
            self.plate.cols('1', '2'),
            self.plate.cols('3'),
            touch_tip=False,
            blow_out=False,
            trash=False
        )

        expected = [
            ['Transferring', '200'],
            ['pick'],
            ['aspirating', '200', 'Well A1'],
            ['dispensing', '200', 'Well A3'],
            ['aspirating', '200', 'Well B1'],
            ['dispensing', '200', 'Well A3'],
            ['aspirating', '200', 'Well C1'],
            ['dispensing', '200', 'Well B3'],
            ['aspirating', '200', 'Well D1'],
            ['dispensing', '200', 'Well B3'],
            ['aspirating', '200', 'Well E1'],
            ['dispensing', '200', 'Well C3'],
            ['aspirating', '200', 'Well F1'],
            ['dispensing', '200', 'Well C3'],
            ['aspirating', '200', 'Well G1'],
            ['dispensing', '200', 'Well D3'],
            ['aspirating', '200', 'Well H1'],
            ['dispensing', '200', 'Well D3'],
            ['aspirating', '200', 'Well A2'],
            ['dispensing', '200', 'Well E3'],
            ['aspirating', '200', 'Well B2'],
            ['dispensing', '200', 'Well E3'],
            ['aspirating', '200', 'Well C2'],
            ['dispensing', '200', 'Well F3'],
            ['aspirating', '200', 'Well D2'],
            ['dispensing', '200', 'Well F3'],
            ['aspirating', '200', 'Well E2'],
            ['dispensing', '200', 'Well G3'],
            ['aspirating', '200', 'Well F2'],
            ['dispensing', '200', 'Well G3'],
            ['aspirating', '200', 'Well G2'],
            ['dispensing', '200', 'Well H3'],
            ['aspirating', '200', 'Well H2'],
            ['dispensing', '200', 'Well H3'],
            ['return'],
            ['drop']
        ]

        fuzzy_assert(
            self.robot.commands(),
            expected=expected
        )
        self.robot.clear_commands()

    def test_touch_tip(self):
        self.p200.pick_up_tip()
        self.p200.robot.move_to = mock.Mock()
        self.p200.touch_tip(self.plate[0])
        self.p200.touch_tip(-3)
        self.p200.touch_tip(self.plate[1], radius=0.5)

        expected = [
            mock.call(self.plate[0],
                      instrument=self.p200,
                      low_current_z=False,
                      strategy='arc'),
            mock.call(
                (self.plate[0], (6.40, 3.20, 10.50)),
                instrument=self.p200,
                low_current_z=False,
                strategy='direct'),
            mock.call(
                (self.plate[0], (0.00, 3.20, 10.50)),
                instrument=self.p200,
                low_current_z=False,
                strategy='direct'),
            mock.call(
                (self.plate[0], (3.20, 6.40, 10.50)),
                instrument=self.p200,
                low_current_z=False,
                strategy='direct'),
            mock.call(
                (self.plate[0], (3.20, 0.00, 10.50)),
                instrument=self.p200,
                low_current_z=False,
                strategy='direct'),
            mock.call(
                (self.plate[0], (6.40, 3.20, 7.50)),
                instrument=self.p200,
                low_current_z=False,
                strategy='direct'),
            mock.call(
                (self.plate[0], (0.00, 3.20, 7.50)),
                instrument=self.p200,
                low_current_z=False,
                strategy='direct'),
            mock.call(
                (self.plate[0], (3.20, 6.40, 7.50)),
                instrument=self.p200,
                low_current_z=False,
                strategy='direct'),
            mock.call(
                (self.plate[0], (3.20, 0.00, 7.50)),
                instrument=self.p200,
                low_current_z=False,
                strategy='direct'),
            mock.call(self.plate[1],
                      instrument=self.p200,
                      low_current_z=False,
                      strategy='arc'),
            mock.call(
                (self.plate[1], (4.80, 3.20, 10.50)),
                instrument=self.p200,
                low_current_z=False,
                strategy='direct'),
            mock.call(
                (self.plate[1], (1.60, 3.20, 10.50)),
                instrument=self.p200,
                low_current_z=False,
                strategy='direct'),
            mock.call(
                (self.plate[1], (3.20, 4.80, 10.50)),
                instrument=self.p200,
                low_current_z=False,
                strategy='direct'),
            mock.call(
                (self.plate[1], (3.20, 1.60, 10.50)),
                instrument=self.p200,
                low_current_z=False,
                strategy='direct')
        ]

        self.assertEquals(expected, self.p200.robot.move_to.mock_calls)

    def test_mix(self):
        # It is necessary to aspirate before it is mocked out
        # so that you have liquid
        self.p200.pick_up_tip()
        self.p200.aspirate = mock.Mock()
        self.p200.dispense = mock.Mock()
        self.p200.mix(3, 100, self.plate[1])

        dispense_expected = [
            mock.call.dispense(100, rate=1.0),
            mock.call.dispense(100, rate=1.0),
            mock.call.dispense(100, rate=1.0)
        ]
        self.assertEqual(self.p200.dispense.mock_calls, dispense_expected)

        aspirate_expected = [
            mock.call.aspirate(volume=100, location=self.plate[1], rate=1.0),
            mock.call.aspirate(100, rate=1.0),
            mock.call.aspirate(100, rate=1.0)
        ]
        self.assertEqual(self.p200.aspirate.mock_calls, aspirate_expected)

    def test_air_gap(self):
        self.p200.pick_up_tip()
        self.p200.aspirate(50, self.plate[0])
        self.p200.air_gap()
        self.assertEquals(self.p200.current_volume, 200)

        self.p200.dispense()
        self.p200.aspirate(50, self.plate[1])
        self.p200.air_gap(10)
        self.assertEquals(self.p200.current_volume, 60)

        self.p200.dispense()
        self.p200.aspirate(50, self.plate[2])
        self.p200.air_gap(10, 10)
        self.assertEquals(self.p200.current_volume, 60)

        self.p200.dispense()
        self.p200.aspirate(50, self.plate[2])
        self.p200.air_gap(0)
        self.assertEquals(self.p200.current_volume, 50)

    def test_pipette_home(self):
        self.p200.home()
        self.assertEquals(len(self.robot.commands()), 1)

    def test_mix_with_named_args(self):
        self.p200.current_volume = 100
        self.p200.pick_up_tip()
        self.p200.aspirate = mock.Mock()
        self.p200.dispense = mock.Mock()
        self.p200.mix(volume=50, repetitions=2)

        self.assertEqual(
            self.p200.dispense.mock_calls,
            [
                mock.call.dispense(50, rate=1.0),
                mock.call.dispense(50, rate=1.0)
            ]
        )
        self.assertEqual(
            self.p200.aspirate.mock_calls,
            [
                mock.call.aspirate(volume=50,
                                   location=self.p200.tip_racks[0][0],
                                   rate=1.0),
                mock.call.aspirate(50, rate=1.0)
            ]
        )

    def test_tip_tracking_simple(self):
        self.p200.move_to = mock.Mock()
        self.p200.pick_up_tip()
        self.p200.tip_attached = False  # prior expectation, for test only
        self.p200.pick_up_tip()

        assert self.p200.move_to.mock_calls == \
            self.build_pick_up_tip(self.tiprack1[0]) + \
            self.build_pick_up_tip(self.tiprack1[1])

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
        # TODO (ben 20171130): revise this test to make more sense in the
        # context of required tip pick_up/drop sequencing, etc.

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
        self.robot._deck['1'].add(self.tiprack1, 'tiprack1')
        self.robot._deck['2'].add(self.tiprack2, 'tiprack2')

        self.p200 = Pipette(
            self.robot,
            mount='right',
            tip_racks=[self.tiprack1, self.tiprack2],
            trash_container=self.tiprack1,
            name='pipette-for-transfer-tests'
        )
        self.p200.max_volume = 200

        self.p200.move_to = mock.Mock()

        for _ in range(0, total_tips_per_plate * 2):
            self.p200.pick_up_tip()
            self.p200.tip_attached = False  # prior expectation, for test only

        expected = []
        for i in range(0, total_tips_per_plate):
            expected.extend(self.build_pick_up_tip(self.tiprack1[i]))
        for i in range(0, total_tips_per_plate):
            expected.extend(self.build_pick_up_tip(self.tiprack2[i]))

        # from pprint import pprint
        # print('Mock calls')
        # pprint(self.p200.move_to.mock_calls)
        # print('Expected')
        # pprint(expected)
        self.assertEqual(
            self.p200.move_to.mock_calls,
            expected
        )

        # test then when we go over the total number of tips,
        # Pipette raises a RuntimeWarning
        self.robot.clear_commands()
        self.p200.reset()
        for _ in range(0, total_tips_per_plate * 2):
            self.p200.pick_up_tip()
            self.p200.tip_attached = False  # prior expectation, for test only

        self.assertRaises(RuntimeWarning, self.p200.pick_up_tip)

    def test_assert_on_double_pick_up_tip(self):
        self.p200.pick_up_tip()
        self.assertRaises(AssertionError, self.p200.pick_up_tip)

    def test_assert_on_drop_without_tip(self):
        self.assertRaises(AssertionError, self.p200.drop_tip)

    def test_tip_tracking_chain_multi_channel(self):
        # TODO (ben 20171130): revise this test to make more sense in the
        # context of required tip pick_up/drop sequencing, etc.

        p200_multi = Pipette(
            self.robot,
            trash_container=self.trash,
            tip_racks=[self.tiprack1, self.tiprack2],
            min_volume=10,  # These are variable
            mount='right',
            channels=8
        )

        p200_multi.calibrate_plunger(
            top=0, bottom=10, blow_out=12, drop_tip=13)
        p200_multi.move_to = mock.Mock()

        for _ in range(0, 12 * 2):
            p200_multi.pick_up_tip()
            p200_multi.tip_attached = False  # prior expectation, for test only

        expected = []
        for i in range(0, 12):
            expected.extend(self.build_pick_up_tip(self.tiprack1.cols[i]))
        for i in range(0, 12):
            expected.extend(self.build_pick_up_tip(self.tiprack2.cols[i]))

        # print('Mock calls')
        # pprint(p200_multi.move_to.mock_calls)
        # print('Expected')
        # pprint(expected)
        self.assertEqual(
            p200_multi.move_to.mock_calls,
            expected
        )

    def test_tip_tracking_start_at_tip(self):
        self.p200.start_at_tip(self.tiprack1['B2'])
        self.p200.pick_up_tip()
        self.assertEquals(self.tiprack1['B2'], self.p200.current_tip())

    def test_tip_tracking_return(self):
        # Note: because this test mocks out `drop_tip`, as a side-effect
        # `tip_attached` must be manually set as it would be under the
        # `return_tip` callstack, making this tesk somewhat fragile

        self.p200.drop_tip = mock.Mock()

        self.p200.pick_up_tip()
        self.p200.return_tip()
        self.p200.tip_attached = False

        self.p200.pick_up_tip()
        self.p200.return_tip()

        expected = [
            mock.call(self.tiprack1[0], home_after=True),
            mock.call(self.tiprack1[1], home_after=True)
        ]

        self.assertEqual(self.p200.drop_tip.mock_calls, expected)

    def build_pick_up_tip(self, well):
        plunge = -10
        return [
            mock.call(well.top(), strategy='arc'),
            mock.call(well.top(plunge), low_current_z=True, strategy='direct'),
            mock.call(well.top(), strategy='direct'),
            mock.call(well.top(plunge), low_current_z=True, strategy='direct'),
            mock.call(well.top(), strategy='direct'),
            mock.call(well.top(plunge), low_current_z=True, strategy='direct'),
            mock.call(well.top(), strategy='direct')
        ]
