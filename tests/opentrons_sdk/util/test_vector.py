import unittest

from opentrons_sdk.util.vector import Vector


class VectorTestCase(unittest.TestCase):
    def test_init(self):
        v1 = Vector(1, 2, 3)
        v2 = Vector((1, 2, 3))
        v3 = Vector({'x': 1, 'y': 2, 'z': 3})
        v4 = Vector({'x': 1})

        self.assertEqual(v1, (1, 2, 3))
        self.assertEqual(v2, (1, 2, 3))
        self.assertEqual(v3, (1, 2, 3))
        self.assertEqual(v4, (1, 0, 0))

    def test_add(self):
        v1 = Vector(1, 2, 3)
        v2 = Vector(4, 5, 6)
        res = v1 + v2

        self.assertEqual(res, Vector(5, 7, 9))

    def test_substract(self):
        v1 = Vector(1, 2, 3)
        v2 = Vector(4, 5, 6)
        res = v2 - v1

        self.assertEqual(res, Vector(3, 3, 3))
