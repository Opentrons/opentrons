import unittest
import os
from labsuite.compilers.plate_map import PlateMap


class PlateMapTest(unittest.TestCase):

    def setUp(self):
        cdir = os.path.dirname(os.path.realpath(__file__))
        self.csv_file = os.path.join(
            cdir,
            '../../fixtures/example_platemap.csv'
        )
        self.plate_map = PlateMap(self.csv_file, rotated=True)

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
        Get well contents for plates.
        """
        plate = self.plate_map.get_plate('A1')
        self.assertEqual(plate.get_well('A12'), '89')
        self.assertEqual(plate.get_well('B12'), '90')
        self.assertEqual(plate.get_well('H12'), '96')
        self.assertEqual(plate.get_well('H1'), '8')

    def test_named_plates(self):
        """
        Keep track of plate names for later reference.
        """
        starts = {
            '96numbers': 'A1',
            '96letters': 'K1',
        }
        plates = PlateMap(self.csv_file, rotated=True, **starts)
        self.assertEqual(plates.get_plate('96numbers').get_well('E8'), '61')
        self.assertEqual(plates.get_plate('96letters').get_well('A12'), 'A')

    def test_add_plate(self):
        """
        Add plate references with options.
        """
        plates = PlateMap(self.csv_file, rotated=True)
        plates.add_plate('small', 'G24', rows=3, cols=2)
        plates.add_plate('big', 'M26', rows=18, cols=12)
        self.assertEqual(plates.get_plate('small').get_well('A1'), 'c')
        self.assertEqual(plates.get_plate('big').get_well('A18'), 'A18')

    def test_plate_map_tiny(self):
        """
        Produce plate map from plate start position (small plates).
        """
        plate = self.plate_map.get_plate('G24', rows=3, cols=2)
        expected = {
            'A1': 'c', 'A2': 'b', 'A3': 'a',
            'B1': 'd', 'B2': 'e', 'B3': 'f'
        }
        self.assertEqual(plate.map, expected)

    def test_plate_value_map(self):
        """
        Return plate map indexed by values.
        """
        plate = self.plate_map.get_plate('G24', rows=3, cols=2)
        expected = {
            'c': 'A1', 'b': 'A2', 'a': 'A3',
            'd': 'B1', 'e': 'B2', 'f': 'B3'
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

    def test_portrait_plate_layout(self):
        """
        Work with plate in portrait layout (override default).
        """
        plate = self.plate_map.get_plate('E32', rotated=False)
        self.assertEqual(plate.get_well('A1'), 'a')
        self.assertEqual(plate.get_well('C1'), 'c')
        self.assertEqual(plate.get_well('A2'), 'f')

    def test_portrait_default_plate_layout(self):
        plates = PlateMap(self.csv_file)
        plate = plates.get_plate('E32')
        self.assertEqual(plate.get_well('A1'), 'a')
        self.assertEqual(plate.get_well('C1'), 'c')
        self.assertEqual(plate.get_well('A2'), 'f')

    def test_find_well(self):
        """ Get well positions of a value in a plate. """
        plates = PlateMap(self.csv_file)
        plate = plates.get_plate('E32')
        self.assertEqual(plate.find_well('a'), 'A1')
        self.assertEqual(plate.find_well('b'), 'B1')

    def test_find_well_rotated(self):
        """ Get well positions of a value in a rotated plate. """
        a = self.plate_map.get_plate('A1').find_well('60')
        self.assertEqual('D8', a)
