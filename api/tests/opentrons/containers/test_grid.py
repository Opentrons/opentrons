import unittest

from opentrons.containers import load
from opentrons.instruments import pipette
from opentrons import Robot


class GridTestCase(unittest.TestCase):
    def setUp(self):
        self.robot = Robot()
        self.plate = load(self.robot, '96-flat', 'A2')

    def tearDown(self):
        del self.robot

    def test_rows_cols(self):
        plate = self.plate
        wells = [
            plate.rows[1]['2'],
            plate.rows['B']['2'],
            plate.rows['B'][1],
            plate.rows[1][1],
            plate.cols['2']['B'],
            plate.cols[1]['B'],
            plate.cols[1][1],
            plate['B2'],
            plate[9]
        ]

        for well, next_well in zip(wells[:-1], wells[1:]):
            self.assertEqual(well, next_well)

    # TODO(artyom 20171031): uncomment once container storage and stabilized
    # def test_placeable(self):
    #     plate = self.plate
    #     self.assertEqual(plate.rows[0].center(plate), (11.24, 14.34, 5.25))
    #     self.assertEqual(plate.rows[1].center(plate), (11.24, 23.34, 5.25))
    #     self.assertEqual(plate.rows[0].center(plate),
    #                      plate.cols[0].center(plate))

    def test_serial_dilution(self):
        plate = load(
            self.robot,
            '96-flat',
            'B1',
            'plate'
        )

        tiprack = load(
            self.robot,
            'tiprack-200ul',  # container type from library
            'A1',             # slot on deck
            'tiprack'         # calibration reference for 1.2 compatibility
        )

        trough = load(
            self.robot,
            'trough-12row',
            'B2',
            'trough'
        )

        trash = load(
            self.robot,
            'point',
            'C1',
            'trash'
        )

        p200 = pipette.Pipette(
            self.robot,
            trash_container=trash,
            tip_racks=[tiprack],
            min_volume=10,  # These are variable
            mount='left',
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
