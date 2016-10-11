import unittest

from opentrons_sdk.util.vector import Vector, path_to_steps


class VectorTestCase(unittest.TestCase):
    def test_init(self):
        v1 = Vector(1, 2, 3)
        v2 = Vector((1, 2, 3))
        v3 = Vector({'x': 1, 'y': 2, 'z': 3})
        v4 = Vector({'x': 1})

        self.assertEqual(v1, (1, 2, 3))
        self.assertEqual(v2, (1, 2, 3))
        self.assertEqual(v3, (1, 2, 3))
        self.assertEqual(v4, Vector(1, 0, 0))

    def test_add(self):
        v1 = Vector(1, 2, 3)
        v2 = Vector(4, 5, 6)
        res = v1 + v2

        self.assertEqual(res, Vector(5, 7, 9))

    def test_substract(self):
        v1 = Vector(1, 2, 3)
        v2 = Vector(4, 5, 6)
        res = v2 - v1

        self.assertEqual(res, Vector(3.0, 3.0, 3.0))

    def test_index(self):
        v1 = Vector(1, 2, 3)

        self.assertEqual(v1['x'], 1)
        self.assertEqual(v1[0], 1)
        self.assertEqual(tuple(v1[:-1]), (1, 2))

    def test_iterator(self):
        v1 = Vector(1, 2, 3)

        res = tuple([x for x in v1])
        self.assertEqual(res, (1, 2, 3))

    def test_div(self):
        v1 = Vector(2.0, 4.0, 6.0)
        res = v1 / 2.0

        self.assertEqual(res, Vector(1.0, 2.0, 3.0))
        res = v1 / Vector(2.0, 4.0, 6.0)
        self.assertEqual(res, Vector(1.0, 1.0, 1.0))

    def test_mul(self):
        v1 = Vector(2.0, 4.0, 6.0)
        res = v1 * 2.0
        self.assertEqual(res, Vector(4.0, 8.0, 12.0))

        res = v1 * Vector(-1.0, -1.0, -1.0)
        self.assertEqual(res, Vector(-2.0, -4.0, -6.0))

    def test_path_to_steps(self):
        p1 = Vector(0, 0, 0)
        p2 = Vector(10, -12, 14)
        res = path_to_steps(
            p1, p2, increment=5, mode='absolute')
        self.assertEquals(res[-1], p2)
        self.assertEquals(len(res), 4)

        p1 = Vector(10, 12, 14)
        p2 = Vector(10, 12, 14)
        res = path_to_steps(p1, p2, mode='relative')
        self.assertEquals(res[-1], Vector(2.5, 3.0, 3.5))
        self.assertEquals(len(res), 4)

        p1 = Vector(10, 12, 14)
        p2 = Vector(-10, -12, -14)
        res = path_to_steps(p1, p2, mode='relative')
        self.assertEquals(res[-1], Vector(-2.5, -3.0, -3.5))
        self.assertEquals(len(res), 4)

        p1 = 0
        p2 = 21
        res = path_to_steps(
            p1, p2, increment=3, mode='absolute')
        self.assertEquals(res[-1], p2)
        self.assertEquals(len(res), 7)

        p1 = 0
        p2 = 21
        res = path_to_steps(
            p1, p2, increment=3, mode='relative')
        self.assertEquals(res[-1], 3)
        self.assertEquals(len(res), 7)
