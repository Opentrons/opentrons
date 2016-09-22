import unittest

from opentrons_sdk.protocol.protocol import Protocol
from opentrons_sdk.labware import containers



class ProtocolTestCase(unittest.TestCase):
    def setUp(self):
        self.protocol = Protocol.get_instance()

    def test_protocol_load(self):
        container_name = 'microplate.96'
        plate = containers.load(container_name, 'A1')
        self.assertEqual(plate.name, container_name)

