import unittest
from labsuite.labware.grid import normalize_position


class GridTest(unittest.TestCase):

    def test_normalize_position(self):
        """
        Normalize coordinate strings ('A1')
        """
        expected = normalize_position('A1')
        self.assertEqual(expected, (0, 0))

        expected = normalize_position('B1')
        self.assertEqual(expected, (1, 0))

        expected = normalize_position('C2')
        self.assertEqual(expected, (2, 1))

    def test_lowercase(self):
        """
        Normalize lowercase coordinate strings ('a1')
        """
        expected = normalize_position('c2')
        self.assertEqual(expected, (2, 1))

    def test_multidigit_row(self):
        """
        Multiple digits in the coordinate row ('b222')
        """
        expected = normalize_position('b222')
        self.assertEqual(expected, (1, 221))

    def test_nonletter_colum(self):
        """
        Exception on invalid coordinate string (']1').
        """
        # Make sure the entire valid range works.
        normalize_position('A1')
        normalize_position('Z1')
        # Test out of range (@ and ] are the edges of A-Z in ASCII).
        with self.assertRaises(ValueError):
            normalize_position(']1')
        with self.assertRaises(ValueError):
            normalize_position('@1')

    def test_invalid_coordinate_string(self):
        """
        Exception on invalid coordinate string ('11').
        """
        with self.assertRaises(ValueError):
            normalize_position('11')

    def test_tuple(self):
        """
        Passthrough normalization of 2-member tuple.
        """
        expected = normalize_position((2,1))
        self.assertEqual(expected, (2, 1))

    def test_short_tuple(self):
        """ 
        Raise exception on one-member tuple.
        """
        with self.assertRaises(TypeError):
            normalize_position((1))

    def test_long_tuple(self):
        """
        Raise exception on three-member tuple.
        """
        with self.assertRaises(TypeError):
            normalize_position((1,2,3))

    def test_mistyped_tuple(self):
        """
        Raise exception on mistyped tuple (char, int).
        """
        with self.assertRaises(TypeError):
            normalize_position(('a', 1))