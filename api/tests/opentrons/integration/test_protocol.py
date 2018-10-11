import unittest

from opentrons.legacy_api.robot import Robot
from opentrons.legacy_api.containers import load as containers_load
from opentrons.legacy_api.containers.placeable import Container, Deck
from opentrons.legacy_api.instruments import pipette
# TODO: Modify all calls to get a Well to use the `wells` method


class ProtocolTestCase(unittest.TestCase):
    def setUp(self):
        self.robot = Robot()

    def test_protocol_container_setup(self):
        plate = containers_load(self.robot, '96-flat', '1', 'myPlate')
        tiprack = containers_load(self.robot, 'tiprack-10ul', '5')

        containers_list = self.robot.get_containers()
        self.assertEqual(len(containers_list), 3)

        self.assertEqual(self.robot._deck['1']['myPlate'], plate)
        self.assertEqual(self.robot._deck['5']['tiprack-10ul'], tiprack)

        self.assertTrue(plate in containers_list)
        self.assertTrue(tiprack in containers_list)

    def test_protocol_head(self):
        trash = containers_load(self.robot, 'point', '1', 'myTrash')
        tiprack = containers_load(self.robot, 'tiprack-10ul', '5')

        p200 = pipette.Pipette(
            self.robot,
            name='myPipette',
            trash_container=trash,
            tip_racks=[tiprack],
            max_volume=200,
            min_volume=10,  # These are variable
            ul_per_mm=18.0,
            mount='left',
            channels=1
        )

        instruments_list = self.robot.get_instruments()
        self.assertEqual(instruments_list[0], ('left', p200))

        instruments_list = self.robot.get_instruments('myPipette')
        self.assertEqual(instruments_list[0], ('left', p200))

    def test_deck_setup(self):
        deck = self.robot.deck

        pip = pipette.Pipette(
            self.robot, mount='left', max_volume=300, ul_per_mm=18.0)

        # Check that the fixed trash has loaded on to the pipette
        trash = pip.trash_container
        tiprack = containers_load(self.robot, 'tiprack-10ul', '5')

        self.assertTrue(isinstance(tiprack, Container))
        self.assertTrue(isinstance(deck, Deck))
        # Check that well location is the same on the robot as the pipette
        self.assertEqual(self.robot._deck['12']['tall-fixed-trash'][0], trash)
        self.assertTrue(deck.has_container(tiprack))
