import unittest

from opentrons_sdk.labware.reservoirs import Reservoir
from opentrons_sdk.labware.liquids import LiquidInventory
from opentrons_sdk.labware.deck import Deck


class ReservoirTest(unittest.TestCase):

    expected_margin = Reservoir.spacing

    def setUp(self):
        self.reservoir = Reservoir()

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

    _allow_liquid_debt = None  # Store library value to restore.
    _allow_unspec = None  # Store library value to restore.

    def setUp(self):
        self._allow_liquid_debt = LiquidInventory._allow_liquid_debt
        self._allow_unspec = LiquidInventory._allow_unspecified_liquids
        LiquidInventory._allow_liquid_debt = True
        self.reservoir = Reservoir()
        self.row = self.reservoir.row(1)

    def tearDown(self):
        LiquidInventory._allow_liquid_debt = self._allow_liquid_debt
        LiquidInventory._allow_unspecified_liquids = self._allow_unspec

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
        LiquidInventory._allow_liquid_debt = True
        LiquidInventory._allow_unspecified_liquids = False
        row1 = self.reservoir.row(1)
        row2 = self.reservoir.row(2)
        with self.assertRaises(Exception):
            # This shouldn't work because we have no idea what they're
            # transfering, so it's not very useful to us.
            row1.transfer(1000, row2)
