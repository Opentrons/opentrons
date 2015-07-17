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