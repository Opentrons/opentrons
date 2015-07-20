import unittest
from labware.grid import normalize_position


class GridTest(unittest.TestCase):

    def test_normalize_position(self):
        expected = normalize_position('A1')
        self.assertEqual(expected, (0, 0))

        expected = normalize_position('B1')
        self.assertEqual(expected, (1, 0))

        expected = normalize_position('C2')
        self.assertEqual(expected, (2, 1))

    def test_lowercase(self):
        expected = normalize_position('c2')
        self.assertEqual(expected, (2, 1))

    def test_tuple(self):
        expected = normalize_position((2,1))
        self.assertEqual(expected, (2, 1))

    def test_short_tuple(self):
        with self.assertRaises(TypeError):
            normalize_position((1))

    def test_long_tuple(self):
        with self.assertRaises(TypeError):
            normalize_position((1,2,3))

    def test_mistyped_tuple(self):
        with self.assertRaises(TypeError):
            normalize_position(('a', 1))