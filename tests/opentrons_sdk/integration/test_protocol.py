import unittest

from opentrons_sdk.protocol.protocol import Protocol
from opentrons_sdk.labware import containers



class ProtocolTestCase(unittest.TestCase):
    def setUp(self):
        self.protocol = Protocol.get_instance()

    def test_protocol_load(self):
        plate = containers.load('microplate.96', 'A1')
        # self.protocol

