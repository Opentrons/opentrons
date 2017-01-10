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
