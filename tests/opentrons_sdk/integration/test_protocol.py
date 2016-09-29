import unittest
from opentrons_sdk import containers

from opentrons_sdk.robot import Robot
from opentrons_sdk.containers.placeable import Container, Deck
from opentrons_sdk.labware import instruments


class ProtocolTestCase(unittest.TestCase):
    def setUp(self):
        Robot.reset()
        self.protocol = Robot.get_instance()

    def test_protocol_container_setup(self):
        plate = containers.load('96-flat', 'A1')
        tiprack = containers.load('tiprack-10ul', 'B2')

        containers_list = self.protocol.containers()
        self.assertEqual(len(containers_list), 2)

        self.assertTrue(plate in containers_list)
        self.assertTrue(tiprack in containers_list)

    def test_protocol_head(self):
        trash = containers.load('point', 'A1')
        tiprack = containers.load('tiprack-10ul', 'B2')

        p200 = instruments.Pipette(
            trash_container=trash,
            tip_racks=[tiprack],
            min_vol=10,  # These are variable
            axis="b",
            channels=1
        )

        instruments_list = self.protocol.get_instruments()
        self.assertEqual(instruments_list[0], ('B', p200))

    def test_deck_setup(self):
        deck = self.protocol.deck

        trash = containers.load('point', 'A1')
        tiprack = containers.load('tiprack-10ul', 'B2')

        self.assertTrue(isinstance(tiprack, Container))
        self.assertTrue(isinstance(deck, Deck))
        self.assertTrue(deck.has_container(trash))
        self.assertTrue(deck.has_container(tiprack))

        p10 = instruments.Pipette(
            trash_container=trash,
            tip_racks=[tiprack],
            min_vol=10,  # These are variable
            axis="b",
            channels=1
        )

    def test_tip_manipulation(self):
        deck = self.protocol.deck

        trash = containers.load('point', 'A1')
        tiprack = containers.load('tiprack-10ul', 'B2')

        p10 = instruments.Pipette(
            trash_container=trash,
            tip_racks=[tiprack],
            min_vol=10,  # These are variable
            axis="b",
            channels=1
        )

        # p10.new_tip()  # Finds a new tip and grabs that tip
        # p10.droptip()  # Drop the tip to the trash_container
        #
        # p10.eject_tip(trash)
        # p10.pickup_tip(tiprack['B5'])
        #no arg, go `to `tiprack, pickup tip
        #with an arg, go to slot, pickup tip

