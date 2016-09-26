import unittest

from opentrons_sdk.protocol.protocol import Protocol
from opentrons_sdk.containers.placeable import Container
from opentrons_sdk.labware import containers, instruments


class ProtocolTestCase(unittest.TestCase):
    def setUp(self):
        Protocol.reset()
        self.protocol = Protocol.get_instance()

    def test_protocol_container_setup(self):

        plate = containers.load('microplate.96', 'A1')
        tiprack = containers.load('tiprack.p10', 'B2')

        containers_list = self.protocol.get_containers()
        self.assertEqual(len(containers_list), 2)

        self.assertEqual(containers_list[0], ((0, 0), plate))
        self.assertEqual(containers_list[1], ((1, 1), tiprack))

    def test_protocol_head(self):

        trash = containers.load('point.trash', 'A1')
        tiprack = containers.load('tiprack.p10', 'B2')

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
        deck = self.protocol.get_deck()

        trash = containers.load('point.trash', 'A1')
        tiprack = containers.load('tiprack.p10', 'B2')

        self.assertTrue(isinstance(tiprack, Container))
        self.assertTrue(isinstance(deck, Deck))
        self.assertTrue(trash in deck)
        self.assertTrue(tiprack in deck)

        p10 = instruments.Pipette(
            trash_container=trash,
            tip_racks=[tiprack],
            min_vol=10,  # These are variable
            axis="b",
            channels=1
        )
