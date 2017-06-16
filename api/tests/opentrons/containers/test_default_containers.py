import unittest

from opentrons import Robot
from opentrons.containers import load as containers_load
from opentrons.instruments import pipette


class DefaultContainersTestCase(unittest.TestCase):
    def setUp(self):
        self.robot = Robot()
        self.trash_box = containers_load(self.robot, 'trash-box', 'A1')
        self.wheaton_vial_rack = containers_load(
            self.robot, 'wheaton_vial_rack', 'A2'
        )
        self.tube_rack_80well = containers_load(
            self.robot, 'tube-rack-80well', 'A3'
        )
        self.T75_flask = containers_load(self.robot, 'T75-flask', 'B1')
        self.T25_flask = containers_load(self.robot, 'T25-flask', 'B2')

    def test_new_containers(self):
        p200 = pipette.Pipette(
            self.robot, axis='a', max_volume=1000, name='stupid-pipette')
        p200.aspirate(100, self.wheaton_vial_rack[0])
        p200.aspirate(100, self.tube_rack_80well[0])
        p200.aspirate(100, self.T75_flask[0])
        p200.aspirate(100, self.T25_flask[0])
        p200.dispense(self.trash_box)
