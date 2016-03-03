import unittest

from labsuite.labware import tipracks
from labsuite.labware.deck import Deck

class TiprackTest(unittest.TestCase):

    expected_margin = 9  # ANSI standard.

    def setUp(self):
        self.rack = tipracks.Tiprack()
        self.rack.calibrate(x=10, y=11, z=12)

    def a1_calibration_test(self):
        """
        Calibration included in A1 slot coordinates.
        """
        a1 = self.rack.tip('A1').coordinates()
        self.assertEqual(a1, (10, 11, 12))

    def a2_coordinate_test(self):
        """
        Calibration included in A2 slot coordinates.
        """
        a2 = self.rack.tip('A2').coordinates()
        self.assertEqual(a2, (10, 11 + self.expected_margin, 12))

    def b1_coordinate_test(self):
        """
        Coordinates for B1 position.
        """
        b1 = self.rack.tip('B1').coordinates()
        self.assertEqual(b1, (10 + self.expected_margin, 11, 12))

    def b2_coordinate_test(self):
        """
        Coordinates for B2 position.
        """
        b2 = self.rack.tip('B2').coordinates()
        margin = self.expected_margin
        self.assertEqual(b2, (10 + margin, 11 + margin, 12))

    def coordinate_lowercase_test(self):
        """
        Accept lowercase coordinates.
        """
        b2 = self.rack.tip('b2').coordinates()
        margin = self.expected_margin
        self.assertEqual(b2, (10 + margin, 11 + margin, 12))

    def col_sanity_test(self):
        """
        Maintain sanity of column values.
        """
        col = chr(ord('a') + self.rack.cols)
        with self.assertRaises(KeyError):
            self.rack.tip('{}1'.format(col))

        col = chr(ord('a') + self.rack.cols - 1)
        self.rack.tip('{}1'.format(col))

    def row_sanity_test(self):
        """
        Maintain sanity of row values.
        """
        row = self.rack.rows + 1

        with self.assertRaises(KeyError):
            self.rack.tip('A{}'.format(row))

        row = self.rack.rows
        self.rack.tip('A{}'.format(row))

    def deck_calibration_test(self):
        """
        Verify calibration offsets.
        """

        config = {
            'calibration': {
                'a1': {
                    'type': 'tiprack_P2',
                    'x': 10,
                    'y': 11,
                    'z': 12
                }
            }
        }

        deck = Deck(a1=tipracks.Tiprack())
        deck.configure(config)

        margin = self.expected_margin

        rack = deck.slot('a1')

        a1 = rack.tip('a1').coordinates()
        b2 = rack.tip('b2').coordinates()

        self.assertEqual(a1, (10, 11, 12))
        self.assertEqual(b2, (10 + margin, 11 + margin, 12))

    def test_tiprack_tag(self):
        """
        Tips on specific racks can be tagged for reuse.
        """
        rack = self.rack
        
        a1 = rack.get_next_tip().coordinates()
        a2 = rack.get_next_tip().coordinates()
        a3 = rack.get_next_tip().coordinates()

        a4 = rack.get_next_tip(tag='water').coordinates()
        a5 = rack.get_next_tip(tag='saline').coordinates()

        also_a4 = rack.get_next_tip(tag='water').coordinates()
        also_a5 = rack.get_next_tip('saline').coordinates()

        self.assertEqual(a1, rack.tip('a1').coordinates())
        self.assertEqual(a2, rack.tip('a2').coordinates())
        self.assertEqual(a3, rack.tip('a3').coordinates())
        self.assertEqual(a4, rack.tip('a4').coordinates())
        self.assertEqual(a5, rack.tip('a5').coordinates())
        self.assertEqual(also_a4, rack.tip('a4').coordinates())
        self.assertEqual(also_a5, rack.tip('a5').coordinates())

    def set_tips_used_test(self):
        """ Dump and reload tips used. """
        self.rack.set_tips_used(10)
        self.assertEqual(self.rack.tips_used, 10)

    def used_tip_offset(self):
        """ Account for used tip offset. """
        self.rack.set_tips_used(10)
        self.assertEqual(
            self.rack.tip('A12').coordinates(),
            self.rack.get_next_tip().coordinates()
        )
