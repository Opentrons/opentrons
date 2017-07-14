import io
import unittest

from opentrons.robot import Robot
from opentrons.server import helpers


class MiscHelpersTestCase(unittest.TestCase):
    def setUp(self):
        self.robot = Robot()
        self.robot.connect()
