import unittest
from opentrons_sdk.util.vector import Vector
from opentrons_sdk.helpers.helpers import path_to_steps


class HelpersTest(unittest.TestCase):

    def test_path_to_steps(self):
        # with 3-dimensional points
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

        # with 1-dimensional points
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
