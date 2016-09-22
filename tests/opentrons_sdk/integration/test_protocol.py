import unittest

from opentrons_sdk.protocol.protocol import Protocol
from opentrons_sdk.labware import containers



class ProtocolTestCase(unittest.TestCase):
    def setUp(self):
        Protocol.reset()
        self.protocol = Protocol.get_instance()

    def test_protocol_load(self):

        plate = containers.load('microplate.96', 'A1')
        tiprack = containers.load('tiprack.p10', 'B2')

        containers_list = self.protocol.get_containers()
        self.assertEqual(len(containers_list), 2)

        self.assertEqual(containers_list[0], ((0, 0), plate))
        self.assertEqual(containers_list[1], ((1, 1), tiprack))


