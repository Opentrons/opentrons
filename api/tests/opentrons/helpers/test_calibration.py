import json
import os
import unittest

from opentrons import Robot
from opentrons.containers import load as containers_load
from opentrons.helpers.helpers import import_calibration_file
from opentrons.instruments import pipette


class CalibrationTest(unittest.TestCase):

    def setUp(self):
        self.robot = Robot()
        self.robot.connect()

        self.trash = containers_load(self.robot, 'point', 'A1', 'trash')
        self.tiprack = containers_load(
            self.robot, 'tiprack-200ul', 'B2', 'p200-rack'
        )
        self.trough = containers_load(
            self.robot, 'trough-12row', 'B2', 'trough'
        )

        self.plate = containers_load(self.robot, '96-flat', 'A2', 'magbead')

        self.p200 = pipette.Pipette(
            self.robot,
            name="p200",
            trash_container=self.trash,
            tip_racks=[self.tiprack],
            min_volume=10,  # These are variable
            axis="b",
            channels=1
        )

        self.p1000 = pipette.Pipette(
            self.robot,
            name="p1000",
            trash_container=self.trash,
            tip_racks=[self.tiprack],
            min_volume=100,  # These are variable
            axis="a",
            channels=1
        )

    def test_load_json(self):
        json_file_path = os.path.join(
            os.path.dirname(__file__),
            'pipette_calibrations.json'
        )

        pipette_calibration = json.load(open(json_file_path))
        import_calibration_file(json_file_path, self.robot)

        my_calibrator = self.robot._instruments['B'].calibrator
        res = my_calibrator.convert(
            self.robot._deck['A1']['trash'],
            self.robot._deck['A1']['trash'].center())

        expected_coordinates = []
        for axis in 'xyz':
            expected_coordinates.append(
                pipette_calibration['b']['theContainers']['trash'][axis]
            )
        expected_coordinates = tuple(expected_coordinates)

        self.assertEqual(
            res,
            self.robot.flip_coordinates(expected_coordinates)
        )
