import unittest

from labsuite.labware.reservoirs import Reservoir
from labsuite.labware.liquids import LiquidInventory
from labsuite.labware.deck import Deck

class ReservoirTest(unittest.TestCase):

    expected_margin = Reservoir.spacing
    offset_x = 10
    offset_y = 11
    offset_z = 12

    def setUp(self):
        self.reservoir = Reservoir()
        self.reservoir.calibrate(
            x=self.offset_x,
            y=self.offset_y,
            z=self.offset_z
        )

    def row1_calibration_test(self):
        """
        Row 1 coordinates after calibration.
        """
        row1 = self.reservoir.row(1).coordinates()
        self.assertEqual(row1, (
            self.offset_x,
            self.offset_y,
            self.offset_z
        ))

    def row2_calibration_test(self):
        """
        Row 2 coordinates after calibration.
        """
        row2 = self.reservoir.row(2).coordinates()
        self.assertEqual(row2, (
            self.offset_x,
            self.offset_y + self.expected_margin,
            self.offset_z
        ))

    def row_sanity_test(self):
        """
        Row sanity check.
        """
        row = self.reservoir.rows + 1
        with self.assertRaises(KeyError):
            self.reservoir.get_child('A{}'.format(row))

    def col_sanity_test(self):
        """
        Column sanity check.
        """
        with self.assertRaises(KeyError):
            self.reservoir.get_child('B1')

    def deck_calibration_test(self):
        """
        Deck calibration.
        """
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

        deck = Deck(a1=Reservoir())
        deck.configure(config)

        margin = self.expected_margin

        reservoir = deck.slot('a1')

        col1 = reservoir.row(1).coordinates()
        col2 = reservoir.row(2).coordinates()

        self.assertEqual(col1, (10, 11, 12))
        self.assertEqual(col2, (10, 11 + margin, 12))


class ReservoirWellTest(unittest.TestCase):

    def setUp(self):
        self.reservoir = Reservoir()
        self.row = self.reservoir.row(1)

    def liquid_allocation_test(self):
        set_vol = 50
        self.row.allocate(water=set_vol)
        vol = self.row.get_volume()
        self.assertEqual(vol, set_vol)

    def liquid_capacity_test(self):
        with self.assertRaises(ValueError):
            self.row.allocate(water=10000, ml=True)

    def liquid_total_capacity_test(self):
        row = self.row
        row.allocate(water=20, ml=True)
        row.add_liquid(water=1, ml=True)
        with self.assertRaises(ValueError):
            row.add_liquid(water=1, ml=True)

    def named_liquid_test(self):
        self.row.add_named_liquid(100, 'water')
        self.assertEqual(self.row.get_volume('water'), 100)

    def liquid_total_mixture_test(self):
        self.row.allocate(water=20000)
        self.row.add_liquid(buffer=1000)
        with self.assertRaises(ValueError):
            self.row.add_liquid(saline=1)

class LiquidDebtTest(unittest.TestCase):

    def setUp(self):
        LiquidInventory._allow_liquid_debt = True
        self.reservoir = Reservoir()
        self.row = self.reservoir.row(1)

    def tearDown(self):
        LiquidInventory._allow_liquid_debt = False

    def liquid_total_capacity_test(self):
        """
        Supports negative liquid capacity.
        """
        row1 = self.reservoir.row(1)
        row2 = self.reservoir.row(2)
        row1.transfer(1000, row2, name="water")
        self.assertEqual(row1.get_volume(), -1000)
        self.assertEqual(row1.get_volume("water"), -1000)

    def liquid_named_debt_test(self):
        """
        Only allows for named liquid debt.
        """
        with self.assertRaises(Exception):
            # This shouldn't work because we have no idea what they're
            # transfering, so it's not very useful to us.
            row1.transfer(1000, row2)
