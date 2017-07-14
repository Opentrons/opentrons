import unittest

from opentrons.robot import Robot


class MiscHelpersTestCase(unittest.TestCase):
    def setUp(self):
        self.robot = Robot()
        self.robot.connect()
