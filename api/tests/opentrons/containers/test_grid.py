import unittest

from opentrons import containers
from opentrons import instruments
from opentrons import Robot


class GridTestCase(unittest.TestCase):
    def setUp(self):
        Robot.reset_for_tests()
        self.plate = containers.load('96-flat', 'A2')

    def test_rows_cols(self):
        plate = self.plate
        wells = [
            plate.rows[1]['B'],
            plate.rows['2']['B'],
            plate.rows['2'][1],
            plate.rows[1][1],
            plate.cols['B']['2'],
            plate.cols[1]['2'],
            plate.cols[1][1],
            plate['B2'],
            plate[9]
        ]

        for well, next_well in zip(wells[:-1], wells[1:]):
            self.assertEqual(well, next_well)

    def test_remove_child(self):
        robot = Robot.get_instance()
        robot.reset()

        slot = 'B1'

        plate = containers.load('96-flat', slot, 'plate')
        self.assertEquals(len(robot.containers()), 1)
        plate.get_parent().remove_child(plate.get_name())
        self.assertEquals(len(robot.containers()), 0)

        plate = containers.load('96-flat', slot, 'plate')
        self.assertEquals(len(robot.containers()), 1)
        robot.deck[slot].remove_child(plate.get_name())
        self.assertEquals(len(robot.containers()), 0)

    def test_placeable(self):
        plate = self.plate
        self.assertEqual(plate.rows[0].center(plate), (11.24, 14.34, 5.25))
        self.assertEqual(plate.rows[1].center(plate), (11.24, 23.34, 5.25))
        self.assertEqual(plate.rows[0].center(plate),
                         plate.cols[0].center(plate))

    def test_serial_dilution(self):
        plate = containers.load(
            '96-flat',
            'B1',
            'plate'
        )

        tiprack = containers.load(
            'tiprack-200ul',  # container type from library
            'A1',             # slot on deck
            'tiprack'         # calibration reference for 1.2 compatibility
        )

        trough = containers.load(
            'trough-12row',
            'B1',
            'trough'
        )

        trash = containers.load(
            'point',
            'A2',
            'trash'
        )

        p200 = instruments.Pipette(
            trash_container=trash,
            tip_racks=[tiprack],
            max_volume=200,
            min_volume=10,  # These are variable
            axis="b",
            channels=1
        )
        p200.calibrate_plunger(top=0, bottom=10, blow_out=12, drop_tip=13)

        for t, col in enumerate(plate.cols):
            p200.pick_up_tip(tiprack[t])

            p200.aspirate(10, trough[t])
            p200.dispense(10, col[0])

            for well, next_well in zip(col[:-1], col[1:]):
                p200.aspirate(10, well)
                p200.dispense(10, next_well)
                p200.mix(repetitions=3, volume=10, location=next_well)

            p200.drop_tip(trash)

        # TODO: check for successful completion of the protocol
