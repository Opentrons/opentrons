import unittest
from opentrons_sdk.protocol import Protocol


class ProtocolTest(unittest.TestCase):

    def setUp(self):
        self.protocol = Protocol()

    @property
    def instructions(self):
        return self.protocol._commands

    def test_normalize_address(self):
        self.protocol.add_container('A1', 'microplate.96', label="Output")
        label = self.protocol._normalize_address('Output:A1')
        self.assertEqual(label, ('output', (0, 0)))
        slot = self.protocol._normalize_address('A1:A1')
        self.assertEqual(slot, ((0, 0), (0, 0)))

    def test_transfer(self):
        """ Basic transfer. """
        self.protocol.add_container('A1', 'microplate.96')
        self.protocol.add_container('B1', 'microplate.96')
        self.protocol.add_instrument('A', 'p200')
        self.protocol.add_instrument('B', 'p20')
        self.protocol.transfer('A1:A1', 'B1:B1', ul=100, tool='p20')
        expected = [{
            'transfer': {
                'tool': 'p20',
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
        self.protocol.add_container('A1', 'microplate.96', label="Label")
        self.protocol.transfer_group(
            ('A1:A1', 'B1:B1', {'ul': 15}),
            ('A2:A2', 'B2:B2', {'ml': 1}),
            ('A3:A3', 'B3:B3', {'blowout': False}),
            ('A4:A4', 'B4:B4'),
            ('Label:A5', 'B5:C1'),
            ul=12,
            tool='p10'
        )
        self.assertEqual(self.instructions, expected)

    def test_distribute(self):
        self.protocol.distribute(
            'A1:A1',
            ('B1:B1', 50),
            ('C1:C1', 5),
            ('D1:D1', 10)
        )
        expected = [{
            'distribute': {
                'tool': 'p10',
                'blowout': True,
                'start': ((0, 0), (0, 0)),
                'transfers': [
                    {
                        'volume': 50,
                        'end': ((1, 0), (1, 0)),  # B1:B1
                    },
                    {
                        'volume': 5,
                        'end': ((2, 0), (2, 0)),  # C1:C1
                    },
                    {
                        'volume': 10,
                        'end': ((3, 0), (3, 0))  # D1:D1
                    }
                ]
            }
        }]
        self.assertEqual(self.instructions, expected)

    def test_consolidate(self):
        """ Consolidate. """
        self.protocol.consolidate(
            'A1:A1',
            ('B1:B1', 50),
            ('C1:C1', 5),
            ('D1:D1', 10)
        )
        expected = [{
            'consolidate': {
                'tool': 'p10',
                'blowout': True,
                'end': ((0, 0), (0, 0)),
                'transfers': [
                    {
                        'volume': 50,
                        'start': ((1, 0), (1, 0)),  # B1:B1
                    },
                    {
                        'volume': 5,
                        'start': ((2, 0), (2, 0)),  # C1:C1
                    },
                    {
                        'volume': 10,
                        'start': ((3, 0), (3, 0))  # D1:D1
                    }
                ]
            }
        }]
        self.assertEqual(self.instructions, expected)

    def test_mix(self):
        """ Mix. """
        self.protocol.mix(
            'A1:A1',
            volume=50,
            repetitions=10
        )
        expected = [{'mix': {
            'tool': 'p10',
            'start': ((0, 0), (0, 0)),  # A1:A1
            'blowout': True,
            'volume': 50,
            'reps': 10
        }}]
        self.assertEqual(self.instructions, expected)

    def test_protocol_run_twice(self):
        """ Run a protocol twice without error. """
        self.protocol.add_instrument('A', 'p200')
        self.protocol.add_container('C1', 'tiprack.p200')
        self.protocol.add_container('A1', 'microplate.96')
        self.protocol.calibrate('A1', x=1, y=2, z=3)
        self.protocol.calibrate_instrument('A', top=0, blowout=10)
        self.protocol.transfer('A1:A1', 'A1:A2', ul=100)
        self.protocol.transfer('A1:A2', 'A1:A3', ul=80)
        self.protocol.run_all()
        self.protocol.run_all()
