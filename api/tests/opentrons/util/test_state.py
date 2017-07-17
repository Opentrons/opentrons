import unittest

from opentrons import Robot
from opentrons.containers import load as containers_load
from opentrons.instruments import pipette
from opentrons.util import state


class StateTestCase(unittest.TestCase):
    def setUp(self):
        self.robot = Robot()
        self.robot.home()

        self.trash = containers_load(self.robot, 'point', 'A1')
        self.tiprack1 = containers_load(self.robot, 'tiprack-10ul', 'B2')
        self.tiprack2 = containers_load(self.robot, 'tiprack-10ul', 'B3')

        self.plate = containers_load(self.robot, '96-flat', 'A2')

        self.p200 = pipette.Pipette(
            self.robot,
            trash_container=self.trash,
            tip_racks=[self.tiprack1, self.tiprack2],
            max_volume=200,
            min_volume=10,  # These are variable
            axis="a",
            channels=1
        )
        self.p200.aspirate(100, self.plate[0]).dispense()

    def test_initial_state(self):
        s = state.get_state(self.robot)
        expected = [{'axis': 'a',
                     'blow_out': 12.0101,
                     'bottom': 10.0101,
                     'calibrated': False,
                     'channels': 1,
                     'drop_tip': 14.0101,
                     'label': 'Pipette',
                     'max_volume': 200,
                     'placeables': [{'calibrated': False,
                                     'label': '96-flat',
                                     'slot': 'A2',
                                     'type': '96-flat'}],
                     'top': 0.0101}]
        self.assertEqual(s, expected)
