import unittest
import labware


class ReservoirTest(unittest.TestCase):

    expected_margin = labware.Reservoir.spacing

    def setUp(self):
        self.reservoir = labware.Reservoir()
        self.reservoir.calibrate(x=10, y=11, z=12)

    def col1_calibration_test(self):
        col1 = self.reservoir.col(1).coordinates()
        self.assertEqual(col1, (10, 11, 12))

    def col2_calibration_test(self):
        col2 = self.reservoir.col(2).coordinates()
        self.assertEqual(col2, (10, 11 + self.expected_margin, 12))

    def col_sanity_test(self):
        with self.assertRaises(KeyError):
            col = self.reservoir.cols + 1
            self.col(col)

    def row_sanity_test(self):
        row = chr(ord('a') + self.reservoir.rows + 1)
        with self.assertRaises(KeyError):
            self.reservoir.get_child('{}1'.format(row))

    def col_sanity_test(self):
        with self.assertRaises(KeyError):
            col = self.reservoir.cols + 1
            self.reservoir.get_child('A{}'.format(col))

    def deck_calibration_test(self):

        config = {
            'calibration': {
                'a1': {
                    'type': 'reservoir',
                    'x': 10,
                    'y': 11,
                    'z': 12
                }
            }
        }

        deck = labware.Deck(a1=labware.Reservoir())
        deck.configure(config)

        margin = self.expected_margin

        reservoir = deck.slot('a1')

        col1 = reservoir.col(1).coordinates()
        col2 = reservoir.col(2).coordinates()

        self.assertEqual(col1, (10, 11, 12))
        self.assertEqual(col2, (10, 11 + margin, 12))


class ReservoirWellTest(unittest.TestCase):

    def setUp(self):
        self.reservoir = labware.Reservoir()
        self.col = self.reservoir.col(1)

    def liquid_allocation_test(self):
        set_vol = 50
        self.col.allocate(water=set_vol)
        vol = self.col.get_volume()
        self.assertEqual(vol, set_vol)

    def liquid_capacity_test(self):
        with self.assertRaises(ValueError):
            self.col.allocate(water=10000, ml=True)

    def liquid_total_capacity_test(self):
        col = self.col
        col.allocate(water=20, ml=True)
        col.add_liquid(water=1, ml=True)
        with self.assertRaises(ValueError):
            col.add_liquid(water=1, ml=True)

    def liquid_total_mixture_test(self):
        self.col.allocate(water=20000)
        self.col.add_liquid(buffer=1000)
        with self.assertRaises(ValueError):
            self.col.add_liquid(saline=1)
