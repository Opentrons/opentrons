import unittest
from opentrons import containers

from opentrons import Robot
from opentrons.containers.placeable import Container, Deck
from opentrons import instruments


class ProtocolTestCase(unittest.TestCase):
    def setUp(self):
        Robot.reset_for_tests()
        self.robot = Robot.get_instance()

    def test_protocol_container_setup(self):
        plate = containers.load('96-flat', 'A1', 'myPlate')
        tiprack = containers.load('tiprack-10ul', 'B2')

        containers_list = self.robot.containers().values()
        self.assertEqual(len(containers_list), 2)

        self.assertEqual(self.robot._deck['A1']['myPlate'], plate)
        self.assertEqual(self.robot._deck['B2']['tiprack-10ul'], tiprack)

        self.assertTrue(plate in containers_list)
        self.assertTrue(tiprack in containers_list)

    def test_protocol_head(self):
        trash = containers.load('point', 'A1', 'myTrash')
        tiprack = containers.load('tiprack-10ul', 'B2')

        p200 = instruments.Pipette(
            name='myPipette',
            trash_container=trash,
            tip_racks=[tiprack],
            min_volume=10,  # These are variable
            axis="b",
            channels=1
        )

        instruments_list = self.robot.get_instruments()
        self.assertEqual(instruments_list[0], ('B', p200))

        instruments_list = self.robot.get_instruments('myPipette')
        self.assertEqual(instruments_list[0], ('B', p200))

    def test_deck_setup(self):
        deck = self.robot.deck

        trash = containers.load('point', 'A1', 'myTrash')
        tiprack = containers.load('tiprack-10ul', 'B2')

        self.assertTrue(isinstance(tiprack, Container))
        self.assertTrue(isinstance(deck, Deck))
        self.assertTrue(deck.has_container(trash))
        self.assertTrue(deck.has_container(tiprack))
