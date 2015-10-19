import unittest
import labware


class TiprackTest(unittest.TestCase):

    expected_margin = 9  # ANSI standard.

    def setUp(self):
        self.rack = labware.Tiprack()
        self.rack.calibrate(x=10, y=11, z=12)

    def a1_calibration_test(self):
        """
        Calibration included in A1 slot coordinates.
        """
        a1 = self.rack.slot('A1').coordinates
        self.assertEqual(a1, (10, 11, 12))

    def a2_coordinate_test(self):
        """
        Calibration included in A2 slot coordinates.
        """
        a2 = self.rack.slot('A2').coordinates
        self.assertEqual(a2, (10, 11 + self.expected_margin, 12))

    def b1_coordinate_test(self):
        """
        Coordinates for B1 position.
        """
        b1 = self.rack.slot('B1').coordinates
        self.assertEqual(b1, (10 + self.expected_margin, 11, 12))

    def b2_coordinate_test(self):
        """
        Coordinates for B2 position.
        """
        b2 = self.rack.slot('B2').coordinates
        margin = self.expected_margin
        self.assertEqual(b2, (10 + margin, 11 + margin, 12))

    def coordinate_lowercase_test(self):
        """
        Accept lowercase coordinates.
        """
        b2 = self.rack.slot('b2').coordinates
        margin = self.expected_margin
        self.assertEqual(b2, (10 + margin, 11 + margin, 12))

    def row_sanity_test(self):
        """
        Maintain sanity of rowumn values.
        """
        row = chr(ord('a') + self.rack.rows + 1)
        with self.assertRaises(KeyError):
            self.rack.slot('{}1'.format(row))

        row = chr(ord('a') + self.rack.rows - 1)
        self.rack.slot('{}1'.format(row))

    def col_sanity_test(self):
        """
        Maintain sanity of col values.
        """
        col = self.rack.cols + 1

        with self.assertRaises(KeyError):
            self.rack.slot('A{}'.format(col))

        col = self.rack.cols
        self.rack.slot('A{}'.format(col))

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

        deck = labware.Deck(a1=labware.Tiprack())
        deck.configure(config)

        margin = self.expected_margin

        rack = deck.slot('a1')

        a1 = rack.slot('a1').coordinates
        b2 = rack.slot('b2').coordinates

        self.assertEqual(a1, (10, 11, 12))
        self.assertEqual(b2, (10 + margin, 11 + margin, 12))