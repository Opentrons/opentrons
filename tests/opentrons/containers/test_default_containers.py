import unittest

from opentrons import Robot, containers, instruments


class DefaultContainersTestCase(unittest.TestCase):
    def setUp(self):
        Robot.reset_for_tests()
        self.trash_box = containers.load('trash-box', 'A1')
        self.wheaton_vial_rack = containers.load('wheaton_vial_rack', 'A2')
        self.tube_rack_80well = containers.load('tube-rack-80well', 'A3')

    def test_new_containers(self):
        p200 = instruments.Pipette(axis='a', max_volume=1000)
        p200.aspirate(100, self.wheaton_vial_rack[0])
        p200.aspirate(100, self.tube_rack_80well[0])
        p200.dispense(self.trash_box)
