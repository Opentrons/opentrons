import unittest
import os
from labsuite.compilers.plate_map import PlateMap


class PlateMapTest(unittest.TestCase):

    def setUp(self):
        cdir = os.path.dirname(os.path.realpath(__file__))
        csv_file = os.path.join(cdir, '../../fixtures/example_platemap.csv')
        self.plate_map = PlateMap(csv_file)

    def test_plate_labels(self):
        """
        Access plate labels.
        """
        labels = {
            'A1': 'Numbers',
            'K1': 'Letters',
            'G24': 'Tiny Plate',
            'M26': 'Big Plate'
        }
        for start_cell in labels:
            plate = self.plate_map.get_plate(start_cell)
            self.assertEqual(plate.label, labels[start_cell])

    def test_plate_map(self):
        """
        Produce plate map from plate start position.
        """
        plate = self.plate_map.get_plate('G24', rows=3, cols=2)
        expected = {
            'A1': 'c', 'A2': 'b', 'A3': 'a',
            'B1': 'f', 'B2': 'e', 'B3': 'd'
        }
        self.assertEqual(plate.map, expected)

    def test_plate_value_map(self):
        """
        Return plate map indexed by values.
        """
        plate = self.plate_map.get_plate('G24', rows=3, cols=2)
        expected = {
            'c': 'A1', 'b': 'A2', 'a': 'A3',
            'f': 'B1', 'e': 'B2', 'd': 'B3'
        }
        self.assertEqual(plate.value_map, expected)

    def test_plate_well_access_big_plate(self):
        """
        Access wells in an unusually large plate.
        """
        plate = self.plate_map.get_plate('M26', rows=18, cols=12)
        wells = ['A1', 'A18', 'F10', 'H1', 'L1', 'L11', 'L18']
        for well in wells:
            self.assertEqual(plate.get_well(well), well)
