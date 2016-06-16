import unittest
import json
from labsuite.engine.protocol import Protocol


class ProtocolTest(unittest.TestCase):

    def setUp(self):
        self.protocol = Protocol()
        self.protocol.add_instrument('p10')

    @property
    def instructions(self):
        return self.protocol._actions

    def test_normalize_address(self):
        self.protocol.add_container('microplate.96', 'A1', label="Output")
        label = self.protocol._normalize_address('Output:A1')
        self.assertEqual(label, ('output', (0, 0)))
        slot = self.protocol._normalize_address('A1:A1')
        self.assertEqual(slot, ((0, 0), (0, 0)))

    def test_transfer(self):
        """ Basic transfer. """
        self.protocol.transfer('A1:A1', 'B1:B1', ul=100)
        expected = [{
            'transfer': {
                'tool': 'p10',
                'volume': 100,
                'start': ((0, 0), (0, 0)),
                'end': ((1, 0), (1, 0)),
                'blowout': True,
                'touchtip': True
            }
        }]
        self.assertEqual(self.instructions, expected)

    def test_transfer_group(self):
        """ Transfer group. """
        expected = [{
            'transfer_group': {
                'tool': 'p10',
                'transfers': [
                    {
                        'volume': 15,
                        'start': ((0, 0), (0, 0)),  # A1:A1
                        'end': ((1, 0), (1, 0)),  # B1:B1
                        'blowout': True,
                        'touchtip': True
                    },
                    {
                        'volume': 1000,
                        'start': ((0, 1), (0, 1)),  # A2:A2
                        'end': ((1, 1), (1, 1)),  # B2:B2
                        'blowout': True,
                        'touchtip': True
                    },
                    {
                        'volume': 12,
                        'start': ((0, 2), (0, 2)),  # A3:A3
                        'end': ((1, 2), (1, 2)),  # B3:B3
                        'blowout': False,
                        'touchtip': True
                    },
                    {
                        'volume': 12,
                        'start': ((0, 3), (0, 3)),  # A4:A4
                        'end': ((1, 3), (1, 3)),  # B4:B4
                        'blowout': True,
                        'touchtip': True
                    },
                    {
                        'volume': 12,
                        'start': ('label', (0, 4)),  # label:A5
                        'end': ((1, 4), (2, 0)),  # B5:C1
                        'blowout': True,
                        'touchtip': True
                    }
                ]
            }
        }]
        self.protocol.add_container('microplate.96', 'A1', label="Label")
        self.protocol.transfer_group(
            ('A1:A1', 'B1:B1', {'ul': 15}),
            ('A2:A2', 'B2:B2', {'ml': 1}),
            ('A3:A3', 'B3:B3', {'blowout': False}),
            ('A4:A4', 'B4:B4'),
            ('Label:A5', 'B5:C1'),
            ul=12
        )
        self.assertEqual(self.instructions, expected)
