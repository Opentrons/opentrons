# pylama:ignore=E501
# TODO: Modify all calls to get a Well to use the `wells` method

import unittest
from unittest import mock
from opentrons.legacy_api.robot import Robot
from opentrons.legacy_api.containers import load as containers_load
from opentrons.legacy_api.instruments import Pipette
from opentrons.legacy_api.containers.placeable import unpack_location
from opentrons.trackers import pose_tracker
from tests.opentrons.conftest import fuzzy_assert
from tests.opentrons import generate_plate


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
            ul_per_mm=18.5,
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
        Pipette(self.robot, ul_per_mm=18.5, mount='left')
        self.assertRaises(RuntimeError, Pipette, self.robot, mount='left')

    def test_aspirate_zero_volume(self):
        assert self.robot.commands() == []
        self.p200.tip_attached = True
        self.p200.aspirate(0)
        assert self.robot.commands() == ['Aspirating 0 uL from ? at 1.0 speed']  # noqa

    def test_get_plunger_position(self):

        self.assertEqual(self.p200._get_plunger_position('top'), 0)
        self.assertEqual(self.p200._get_plunger_position('bottom'), 10)
        self.assertEqual(self.p200._get_plunger_position('blow_out'), 12)
        self.assertEqual(self.p200._get_plunger_position('drop_tip'), 13)

        self.p200.plunger_positions['drop_tip'] = None
        self.assertRaises(
            RuntimeError, self.p200._get_plunger_position, 'drop_tip')

        self.assertRaises(
            RuntimeError, self.p200._get_plunger_position, 'roll_out')

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
            ul_per_mm=18.5,
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

        self.assertEqual(self.p200.placeables, expected)

    def test_unpack_location(self):
        # TODO: remove when new labware system is promoted to production (it
        # TODO: should not include the `unpack_location` magic
        location = (self.plate[0], (1, 0, -1))
        res = unpack_location(location)
        self.assertEqual(res, (self.plate[0], (1, 0, -1)))

        res = unpack_location(self.plate[0])
        self.assertEqual(
            res,
            (self.plate[0], self.plate[0].from_center(x=0, y=0, z=1)))

    def test_aspirate_invalid_max_volume(self):
        self.p200.tip_attached = True
        with self.assertRaises(RuntimeWarning):
            self.p200.aspirate(500)

    def test_volume_percentage(self):
        self.assertRaises(RuntimeError, self.p200._volume_percentage, -1)
        self.assertRaises(RuntimeError, self.p200._volume_percentage, 300)
        self.assertEqual(self.p200._volume_percentage(100), 0.5)
        self.assertEqual(len(self.robot.get_warnings()), 0)
        self.p200._volume_percentage(self.p200.min_volume / 2)
        self.assertEqual(len(self.robot.get_warnings()), 1)

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

    def test_set_speed(self):
        self.p200.set_speed(aspirate=100)
        self.assertEqual(self.p200.speeds['aspirate'], 100)

        self.p200.set_speed(dispense=100)
        self.assertEqual(self.p200.speeds['dispense'], 100)

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
            ['Blow', 'well A1']
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

    def test_transfer_mix(self):
        self.p200.reset()
        self.p200.transfer(
            200,
            self.plate[0],
            self.plate[1],
            mix_before=(1, 10),
            mix_after=(1, 10)
        )

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
        fuzzy_assert(self.robot.commands(), expected=expected)
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
        self.p200.touch_tip(v_offset=-3)
        self.p200.touch_tip(self.plate[1], radius=0.5)

        expected = [
            mock.call(self.plate[0],
                      instrument=self.p200,
                      strategy='arc'),

            mock.call(
                (self.plate[0], (6.40, 3.20, 9.50)),
                instrument=self.p200,
                strategy='direct'),
            mock.call(
                (self.plate[0], (0.00, 3.20, 9.50)),
                instrument=self.p200,
                strategy='direct'),
            mock.call(
                (self.plate[0], (3.20, 6.40, 9.50)),
                instrument=self.p200,
                strategy='direct'),
            mock.call(
                (self.plate[0], (3.20, 0.00, 9.50)),
                instrument=self.p200,
                strategy='direct'),
            mock.call(
                (self.plate[0], (6.40, 3.20, 7.50)),
                instrument=self.p200,
                strategy='direct'),
            mock.call(
                (self.plate[0], (0.00, 3.20, 7.50)),
                instrument=self.p200,
                strategy='direct'),
            mock.call(
                (self.plate[0], (3.20, 6.40, 7.50)),
                instrument=self.p200,
                strategy='direct'),
            mock.call(
                (self.plate[0], (3.20, 0.00, 7.50)),
                instrument=self.p200,
                strategy='direct'),
            mock.call(self.plate[1],
                      instrument=self.p200,
                      strategy='arc'),
            mock.call(
                (self.plate[1], (4.80, 3.20, 9.50)),
                instrument=self.p200,
                strategy='direct'),
            mock.call(
                (self.plate[1], (1.60, 3.20, 9.50)),
                instrument=self.p200,
                strategy='direct'),
            mock.call(
                (self.plate[1], (3.20, 4.80, 9.50)),
                instrument=self.p200,
                strategy='direct'),
            mock.call(
                (self.plate[1], (3.20, 1.60, 9.50)),
                instrument=self.p200,
                strategy='direct')
        ]

        self.assertEqual(expected, self.p200.robot.move_to.mock_calls)

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
        self.assertEqual(self.p200.current_volume, 200)

        self.p200.dispense()
        self.p200.aspirate(50, self.plate[1])
        self.p200.air_gap(10)
        self.assertEqual(self.p200.current_volume, 60)

        self.p200.dispense()
        self.p200.aspirate(50, self.plate[2])
        self.p200.air_gap(10, 10)
        self.assertEqual(self.p200.current_volume, 60)

        self.p200.dispense()
        self.p200.aspirate(50, self.plate[2])
        self.p200.air_gap(0)
        self.assertEqual(self.p200.current_volume, 50)

    def test_pipette_home(self):
        self.p200.home()
        self.assertEqual(len(self.robot.commands()), 1)

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
                                   location=None,
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
            self.build_pick_up_tip(self.p200, self.tiprack1[0]) + \
            self.build_pick_up_tip(self.p200, self.tiprack1[1])

    def test_simulate_plunger_while_enqueing(self):

        self.p200.pick_up_tip()
        self.assertEqual(self.p200.current_volume, 0)

        self.p200.aspirate(200)
        self.assertEqual(self.p200.current_volume, 200)

        self.p200.dispense(20)
        self.assertEqual(self.p200.current_volume, 180)

        self.p200.dispense(20)
        self.assertEqual(self.p200.current_volume, 160)

        self.p200.dispense(60)
        self.assertEqual(self.p200.current_volume, 100)

        self.p200.dispense(100)
        self.assertEqual(self.p200.current_volume, 0)

        self.p200.drop_tip()

    def test_tip_tracking_chain(self):
        # TODO (ben 20171130): revise this test to make more sense in the
        # context of required tip pick_up/drop sequencing, etc.

        total_tips_per_plate = 4

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
            name='pipette-for-transfer-tests',
            ul_per_mm=18.5
        )
        self.p200.max_volume = 200

        self.p200.move_to = mock.Mock()

        for _ in range(0, total_tips_per_plate * 2):
            self.p200.pick_up_tip()
            self.p200.tip_attached = False  # prior expectation, for test only

        expected = []
        for i in range(0, total_tips_per_plate):
            expected.extend(self.build_pick_up_tip(self.p200, self.tiprack1[i]))
        for i in range(0, total_tips_per_plate):
            expected.extend(self.build_pick_up_tip(self.p200, self.tiprack2[i]))

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

    def test_tip_tracking_chain_multi_channel(self):
        # TODO (ben 20171130): revise this test to make more sense in the
        # context of required tip pick_up/drop sequencing, etc.

        p200_multi = Pipette(
            self.robot,
            trash_container=self.trash,
            tip_racks=[self.tiprack1, self.tiprack2],
            min_volume=10,  # These are variable
            mount='right',
            channels=8,
            ul_per_mm=18.5
        )

        p200_multi.calibrate_plunger(
            top=0, bottom=10, blow_out=12, drop_tip=13)
        p200_multi.move_to = mock.Mock()

        for _ in range(0, 12 * 2):
            p200_multi.pick_up_tip()
            p200_multi.tip_attached = False  # prior expectation, for test only

        expected = []
        for i in range(0, 12):
            expected.extend(
                self.build_pick_up_tip(p200_multi, self.tiprack1.cols[i]))
        for i in range(0, 12):
            expected.extend(
                self.build_pick_up_tip(p200_multi, self.tiprack2.cols[i]))

        self.assertEqual(
            p200_multi.move_to.mock_calls,
            expected
        )

    def test_tip_tracking_start_at_tip(self):
        self.p200.start_at_tip(self.tiprack1['B2'])
        self.p200.pick_up_tip()
        self.assertEqual(self.tiprack1['B2'], self.p200.current_tip())

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

    def test_direct_movement_within_well(self):
        self.robot.move_to = mock.Mock()
        self.p200.move_to(self.plate[0])
        self.p200.move_to(self.plate[0].top())
        self.p200.move_to(self.plate[0].bottom())
        self.p200.move_to(self.plate[1])
        self.p200.move_to(self.plate[2])
        self.p200.move_to(self.plate[2].bottom())

        expected = [
            mock.call(
                self.plate[0], instrument=self.p200, strategy='arc'),
            mock.call(
                self.plate[0].top(), instrument=self.p200, strategy='direct'),
            mock.call(
                self.plate[0].bottom(), instrument=self.p200, strategy='direct'),
            mock.call(
                self.plate[1], instrument=self.p200, strategy='arc'),
            mock.call(
                self.plate[2], instrument=self.p200, strategy='arc'),
            mock.call(
                self.plate[2].bottom(), instrument=self.p200, strategy='direct')
        ]
        self.assertEqual(self.robot.move_to.mock_calls, expected)

    def build_pick_up_tip(self, pipette, well):
        return [
            mock.call(well.top()),
            mock.call(
                well.top(-pipette._pick_up_distance), strategy='direct'),
            mock.call(well.top(), strategy='direct'),
            mock.call(
                well.top(-pipette._pick_up_distance - 1), strategy='direct'),
            mock.call(well.top(), strategy='direct'),
            mock.call(
                well.top(-pipette._pick_up_distance - 2), strategy='direct'),
            mock.call(well.top(), strategy='direct')
        ]
