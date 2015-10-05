import unittest
import labware


class MicroplateTest(unittest.TestCase):

    expected_margin = 9  # ANSI standard.

    def setUp(self):
        self.plate = labware.Microplate()
        self.plate.calibrate(x=10, y=11, z=12)

    def a1_calibration_test(self):
        a1 = self.plate.well('A1').coordinates
        self.assertEqual(a1, (10, 11, 12))

    def a2_coordinate_test(self):
        a2 = self.plate.well('A2').coordinates
        self.assertEqual(a2, (10, 11 + self.expected_margin, 12))

    def b1_coordinate_test(self):
        b1 = self.plate.well('B1').coordinates
        self.assertEqual(b1, (10 + self.expected_margin, 11, 12))

    def b2_coordinate_test(self):
        b2 = self.plate.well('B2').coordinates
        margin = self.expected_margin
        self.assertEqual(b2, (10 + margin, 11 + margin, 12))

    def coordinate_lowercase_test(self):
        b2 = self.plate.well('b2').coordinates
        margin = self.expected_margin
        self.assertEqual(b2, (10 + margin, 11 + margin, 12))

    def row_sanity_test(self):
        row = chr(ord('a') + self.plate.rows + 1)
        with self.assertRaises(KeyError):
            self.plate.well('{}1'.format(row))

    def unicode_coord_test(self):
        self.plate.well(u'A1')

    def col_sanity_test(self):
        col = self.plate.cols + 1
        with self.assertRaises(KeyError):
            self.plate.well('A{}'.format(col))

    def col_type_sanity_test(self):
        with self.assertRaises(ValueError):
            self.plate.well('ABC')

    def deck_calibration_test(self):

        m_offset = 10

        config = {
            'calibration': {
                'a1': {
                    'type': 'microplate_96',
                    'x': 10,
                    'y': 11,
                    'z': 12
                }
            }
        }

        deck = labware.Deck(a1=labware.Microplate())
        deck.configure(config)

        margin = self.expected_margin

        plate = deck.slot('a1')

        a1 = plate.well('a1').coordinates
        b2 = plate.well('b2').coordinates

        self.assertEqual(a1, (10, 11, 12))
        self.assertEqual(b2, (10 + margin, 11 + margin, 12))


class MicroplateWellTest(unittest.TestCase):

    def setUp(self):
        self.plate = labware.Microplate()
        self.well  = self.plate.well('A1')

    def liquid_allocation_test(self):
        set_vol = 50
        # Add an initial value of 100ul water to this well.
        self.well.allocate(water=set_vol)
        vol = self.well.get_volume()
        self.assertEqual(vol, set_vol)

    def liquid_capacity_test(self):
        set_vol = 10000
        # Way too much water for a microplate!
        with self.assertRaises(ValueError):
            self.well.allocate(water=set_vol)

    def liquid_total_capacity_test(self):
        well = self.plate.well('A1')
        well.allocate(water=90)
        well.add_liquid(water=10)
        with self.assertRaises(ValueError):
            well.add_liquid(water=1)

    def liquid_total_capacity_test(self):
        self.well.allocate(water=90)
        self.well.add_liquid(water=10)
        with self.assertRaises(ValueError):
            self.well.add_liquid(water=1)

    def liquid_total_mixture_test(self):
        self.well.allocate(water=90)
        self.well.add_liquid(buffer=10)
        with self.assertRaises(ValueError):
            self.well.add_liquid(saline=1)

    def mixture_transfer_test(self):

        wellA = self.well
        wellB = self.plate.well('A2')

        wellA.allocate(water=90, buffer=9, saline=1)
        wellA.transfer(20, wellB)

        # Check Well A to ensure things have been removed.
        wat = wellA.get_proportion('water')
        buf = wellA.get_proportion('buffer')
        sal = wellA.get_proportion('saline')

        # We use almostEqual because it's floating-point.
        self.assertAlmostEqual(wat, .9)
        self.assertAlmostEqual(buf, .09)
        self.assertAlmostEqual(sal, .01)

        self.assertEqual(wellA.get_volume(), 80)

        # Check WellB to ensure things have been added.
        wat = wellB.get_proportion('water')
        buf = wellB.get_proportion('buffer')
        sal = wellB.get_proportion('saline')

        # We use almostEqual because it's floating-point.
        self.assertAlmostEqual(wat, .9)
        self.assertAlmostEqual(buf, .09)
        self.assertAlmostEqual(sal, .01)

        self.assertEqual(wellB.get_volume(), 20)

    def proportion_key_error_test(self):
        with self.assertRaises(KeyError):
            self.well.get_proportion('water')

    def liquid_key_error_test(self):
        self.well.allocate(saline=10)
        with self.assertRaises(KeyError):
            self.well.get_volume('water')

    def liquid_value_error_test(self):
        self.well.allocate(water=10, saline=10)
        with self.assertRaises(ValueError):
            self.well.get_volume('water')

    def ml_conversion_test(self):
        self.well.allocate(water=.1, ml=True)
        self.assertEqual(self.well.get_volume(), 100)
