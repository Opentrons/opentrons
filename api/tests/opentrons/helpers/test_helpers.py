import unittest
from opentrons import Robot
from opentrons.helpers import helpers
from opentrons.instruments import pipette
from opentrons.util.vector import Vector
from opentrons.containers import load as containers_load
# TODO: Move `helpers` methods into either pipette or other non-generic place


class HelpersTest(unittest.TestCase):

    def setUp(self):
        # TODO(Ahmed): Why does this test setup a plate, robot, container
        # when it doesnt use them in any test cases?
        self.robot = Robot()
        self.p200 = pipette.Pipette(self.robot, mount='left')
        self.plate = containers_load(self.robot, '96-flat', '3')

    def test_break_down_travel(self):
        # with 3-dimensional points
        p1 = Vector(0, 0, 0)
        p2 = Vector(10, -12, 14)
        res = helpers.break_down_travel(
            p1, p2, increment=5, mode='absolute')
        self.assertEqual(res[-1], p2)
        self.assertEqual(len(res), 5)

        p1 = Vector(10, -12, 14)
        res = helpers.break_down_travel(Vector(0, 0, 0), p1, mode='relative')
        expected = Vector(
            0.46537410754407676,
            -0.5584489290528921,
            0.6515237505617075)
        self.assertEqual(res[-1], expected)
        self.assertEqual(len(res), 5)
