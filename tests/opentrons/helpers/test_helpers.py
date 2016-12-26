import unittest
from opentrons.util.vector import Vector
from opentrons.helpers import helpers
from opentrons import instruments, containers, Robot


class HelpersTest(unittest.TestCase):

    def setUp(self):
        self.robot = Robot.reset_for_tests()
        self.p200 = instruments.Pipette(axis='b', max_volume=200)
        self.plate = containers.load('96-flat', 'C1')

    def test_break_down_travel(self):
        # with 3-dimensional points
        p1 = Vector(0, 0, 0)
        p2 = Vector(10, -12, 14)
        res = helpers.break_down_travel(
            p1, p2, increment=5, mode='absolute')
        self.assertEquals(res[-1], p2)
        self.assertEquals(len(res), 5)

        p1 = Vector(10, -12, 14)
        res = helpers.break_down_travel(Vector(0, 0, 0), p1, mode='relative')
        expected = Vector(
            0.46537410754407676,
            -0.5584489290528921,
            0.6515237505617075)
        self.assertEquals(res[-1], expected)
        self.assertEquals(len(res), 5)

    def test_create_well_pairs(self):

        s = self.plate[0]
        t = self.plate[1]
        result = helpers._create_well_pairs(s, t)
        expected = ([s], [t])
        self.assertEquals(expected, result)

        s = self.plate[0:3]
        t = self.plate[1]
        result = helpers._create_well_pairs(s, t)
        expected = (s, [t] * len(s))
        self.assertEquals(expected, result)

        s = self.plate[0]
        t = self.plate[0:3]
        result = helpers._create_well_pairs(s, t)
        expected = ([s] * len(t), t)
        self.assertEquals(expected, result)

        s = self.plate[0:3]
        t = self.plate[0:3]
        result = helpers._create_well_pairs(s, t)
        expected = (s, t)
        self.assertEquals(expected, result)

        s = self.plate.rows[0:3]
        t = self.plate[0]
        result = helpers._create_well_pairs(s, t)
        expected = (s, [t] * 3)
        self.assertEquals(expected, result)

        s = self.plate.rows[0:3]
        t = self.plate[0:3]
        result = helpers._create_well_pairs(s, t)
        expected = (s, t)
        self.assertEquals(expected, result)

        s = self.plate[0:3]
        t = self.plate.rows[0:3]
        result = helpers._create_well_pairs(s, t)
        expected = (s, t)
        self.assertEquals(expected, result)

        s = self.plate[0:3]
        t = self.plate.rows[0:2]
        self.assertRaises(RuntimeError, helpers._create_well_pairs, s, t)

    def test_create_volume_pairs(self):
        result = helpers._create_volume_pairs(20, 1)
        expected = [20]
        self.assertEquals(expected, result)

        result = helpers._create_volume_pairs([20], 1)
        expected = [20]
        self.assertEquals(expected, result)

        self.assertRaises(
            RuntimeError, helpers._create_volume_pairs, [20, 2], 1)

        result = helpers._create_volume_pairs([0, 10], 11)
        expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        self.assertEquals(expected, result)

        result = helpers._create_volume_pairs(
            [0, 10], 11, interpolate=lambda x: 1 - x)
        expected = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
        for i in range(len(result)):
            self.assertAlmostEquals(result[i], expected[i])

    def test_match_volumes_to_sources(self):
        s = [self.plate[0], self.plate[0], self.plate[0]]
        v = [1, 1, 2]
        result = helpers._match_volumes_to_sources(v, s)
        expected = [1, 1, 2]
        self.assertEquals(result, expected)

        s = [self.plate[0], self.plate[0], self.plate[1]]
        v = [1, 1, 2]
        result = helpers._match_volumes_to_sources(v, s)
        expected = [1, 1]
        self.assertEquals(result, expected)

        s = [self.plate[0], self.plate[1], self.plate[0]]
        v = [1, 1, 2]
        result = helpers._match_volumes_to_sources(v, s)
        expected = [1]
        self.assertEquals(result, expected)

    def test_find_aspirate_volume(self):

        result = helpers._find_aspirate_volume([0], 200)
        self.assertEquals(result, 0)

        result = helpers._find_aspirate_volume(
            [0, 1, 2, 3, 4, 5], 200)
        self.assertEquals(result, 15)

        result = helpers._find_aspirate_volume(
            [0, 1, 2, 3, 4, 5, 186], 200)
        self.assertEquals(result, 15)

        result = helpers._find_aspirate_volume(
            [0, 1, 2, 3, 4, 5, 185], 200)
        self.assertEquals(result, 200)
