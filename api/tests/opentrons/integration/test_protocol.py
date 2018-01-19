import unittest

from opentrons import Robot
from opentrons.containers import load as containers_load
from opentrons.containers.placeable import Container, Deck
from opentrons.instruments import pipette


# TODO: Refactor this into a standalone protocol script thats invoked by test
class ProtocolTestCase(unittest.TestCase):
    def setUp(self):
        self.robot = Robot()

    def test_protocol_container_setup(self):
        plate = containers_load(self.robot, '96-flat', '1', 'myPlate')
        tiprack = containers_load(self.robot, 'tiprack-10ul', '5')

        containers_list = self.robot.get_containers()
        self.assertEqual(len(containers_list), 2)

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
            min_volume=10,  # These are variable
            mount='left',
            channels=1
        )

        instruments_list = self.robot.get_instruments()
        self.assertEqual(instruments_list[0], ('left', p200))

        instruments_list = self.robot.get_instruments('myPipette')
        self.assertEqual(instruments_list[0], ('left', p200))

    def test_deck_setup(self):
        deck = self.robot.deck

        trash = containers_load(self.robot, 'point', '1', 'myTrash')
        tiprack = containers_load(self.robot, 'tiprack-10ul', '5')

        self.assertTrue(isinstance(tiprack, Container))
        self.assertTrue(isinstance(deck, Deck))
        self.assertTrue(deck.has_container(trash))
        self.assertTrue(deck.has_container(tiprack))
