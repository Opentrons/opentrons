import os
import json
import shutil
import unittest

from opentrons import Robot
from opentrons.containers import load as containers_load
from opentrons.instruments import instrument, pipette
from opentrons.util.vector import Vector
from opentrons.util import environment


class CrudCalibrationsTestCase(unittest.TestCase):

    def setUp(self):
        self.robot = Robot()
        self.robot.connect()
        self.plate = containers_load(self.robot, '96-flat', 'A1', 'plate')
        self.p200 = pipette.Pipette(self.robot, name="p200", axis="b")

        self.p200.delete_calibration_data()

        well = self.plate[0]
        pos = well.from_center(x=0, y=0, z=0, reference=self.plate)
        self.location = (self.plate, pos)

        well_deck_coordinates = well.center(well.get_deck())
        dest = well_deck_coordinates + Vector(1, 2, 3)

        self.robot.move_head(x=dest['x'], y=dest['y'], z=dest['z'])
        self.p200.calibrate_position(self.location)

    def test_save_load_calibration_data(self):

        self.p200 = pipette.Pipette(self.robot, name="p200-diff", axis="b")
        self.assertDictEqual(self.p200.calibration_data, {})

        self.p200 = pipette.Pipette(self.robot, name="p200", axis="a")
        self.p200.delete_calibration_data()
        self.assertDictEqual(self.p200.calibration_data, {})

        self.p200 = pipette.Pipette(self.robot, name="p200", axis="b")

        expected_delta = {
            'delta': (1.0, 2.0, 3.0),
            'type': '96-flat'
        }

        self.assertTrue('A1' in self.p200.calibration_data)
        actual = self.p200.calibration_data['A1']['children']
        self.assertTrue('plate' in actual)
        actual = self.p200.calibration_data['A1']['children']['plate']
        self.assertEquals(expected_delta, actual)

    def test_delete_calibrations_data(self):

        self.p200 = pipette.Pipette(self.robot, name="p200", axis="b")

        expected_delta = {
            'delta': (1.0, 2.0, 3.0),
            'type': '96-flat'
        }

        self.assertTrue('A1' in self.p200.calibration_data)
        actual = self.p200.calibration_data['A1']['children']
        self.assertTrue('plate' in actual)
        actual = self.p200.calibration_data['A1']['children']['plate']
        self.assertEquals(expected_delta, actual)

        self.p200.delete_calibration_data()
        self.assertDictEqual(self.p200.calibration_data, {})

        self.p200 = pipette.Pipette(self.robot, name="p200", axis="b")
        self.assertDictEqual(self.p200.calibration_data, {})
        self.assertDictEqual(self.p200.positions, {
            'top': 0.0101,
            'bottom': 10.0101,
            'blow_out': 12.0101,
            'drop_tip': 14.0101
        })

    def test_delete_old_calibration_file(self):

        def test_file(file_name):
            calib_dir = environment.get_path('CALIBRATIONS_DIR')
            shutil.copyfile(
                os.path.join(os.path.dirname(__file__), file_name),
                os.path.join(calib_dir, 'calibrations.json')
            )

            instrument.Instrument()._read_calibrations()

            file = os.path.join(calib_dir, 'calibrations.json')
            with open(file) as f:
                calib_object = json.load(f)
                self.assertEquals(calib_object['version'], 1)

        test_file('data/calibrations.json')
        test_file('data/invalid_json.json')
