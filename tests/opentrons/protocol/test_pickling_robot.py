import pickle
import unittest

from opentrons import robot


class PicklingRobotTestCase(unittest.TestCase):
    def setUp(self):
        robot.reset_for_tests()

    def test_pickling_unconfigured_robot(self):
        robot.teardown_unpickleable_attributes()
        robot_as_bytes = pickle.dumps(robot)
        reconstructed_robot = pickle.loads(robot_as_bytes)
        robot.setup_unpickleable_attributes()
