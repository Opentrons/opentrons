import unittest

from opentrons_sdk.protocol.robot import Robot
from opentrons_sdk.containers.placeable import Container, Deck
from opentrons_sdk.labware import containers, instruments


class ProtocolTestCase(unittest.TestCase):
    def setUp(self):
        Robot.reset()
        self.robot = Robot.get_instance()

    def test_protocol_container_setup(self):
        plate = containers.load('96-flat', 'A1')
        tiprack = containers.load('tiprack-10ul', 'B2')

        containers_list = self.robot.containers()
        self.assertEqual(len(containers_list), 2)

        self.assertTrue(plate in containers_list)
        self.assertTrue(tiprack in containers_list)

    def test_protocol_head(self):
        trash = containers.load('point', 'A1')
        tiprack = containers.load('tiprack-10ul', 'B2')

        p200 = instruments.Pipette(
            trash_container=trash,
            tip_racks=[tiprack],
            min_volume=10,  # These are variable
            axis="b",
            channels=1
        )

        instruments_list = self.robot.get_instruments()
        self.assertEqual(instruments_list[0], ('B', p200))

    def test_deck_setup(self):
        deck = self.robot.get_deck()

        trash = containers.load('point', 'A1')
        tiprack = containers.load('tiprack-10ul', 'B2')

        self.assertTrue(isinstance(tiprack, Container))
        self.assertTrue(isinstance(deck, Deck))
        self.assertTrue(deck.has_container(trash))
        self.assertTrue(deck.has_container(tiprack))
