import unittest
from labsuite.protocol import Protocol
from labsuite.protocol.handlers.motor_control import MotorControlHandler
import labsuite.drivers.motor as motor_drivers


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

    def test_context(self):
        self.protocol.add_container('A1', 'microplate.96')
        self.protocol.add_instrument('A', 'p200')
        self.protocol.calibrate('A1', x=1, y=2, z=3)
        self.protocol.transfer('A1:A1', 'A1:A2', ul=100)
        self.protocol.transfer('A1:A2', 'A1:A3', ul=80)
        self.protocol._initialize_context()
        vol1 = self.protocol._context_handler.get_volume('A1:A2')
        self.assertEqual(vol1, 0)
        self.protocol._run(0)
        vol2 = self.protocol._context_handler.get_volume('A1:A2')
        self.assertEqual(vol2, 100)
        self.protocol._run(1)
        vol3 = self.protocol._context_handler.get_volume('A1:A3')
        self.assertEqual(vol3, 80)

    def test_motor_handler(self):
        motor = self.protocol.attach_motor()
        output_log = motor._driver
        self.protocol.add_instrument('B', 'p200')
        self.protocol.add_container('A1', 'microplate.96')
        self.protocol.calibrate('A1', x=1, y=2, top=3, bottom=13)
        self.protocol.calibrate('A1:A2', bottom=5)
        self.protocol.calibrate_instrument('B', top=0, blowout=10)
        self.protocol.transfer('A1:A1', 'A1:A2', ul=100)
        self.protocol.transfer('A1:A2', 'A1:A3', ul=80)
        prog_out = []
        for progress in self.protocol.run():
            prog_out.append(progress)
        expected = [
            # Transfer 1.
            {'z': 0},  # Move to well.
            {'x': 1, 'y': 2},
            {'z': 3},
            {'b': 5.0},  # Plunge.
            {'x': 1, 'y': 2},
            {'z': 13},  # Move into well.
            {'b': 0},  # Release.
            {'z': 0},  # Move up.
            {'x': 1, 'y': 11},  # Move to well.
            {'z': 3},
            {'x': 1, 'y': 11},
            {'z': 5},  # Move into well.
            {'b': 10},  # Blowout.
            {'z': 0},  # Move up.
            {'b': 0},  # Release.
            # Transfer 2.
            {'z': 0},
            {'x': 1, 'y': 11},
            {'z': 3},
            {'b': 4.0},
            {'x': 1, 'y': 11},
            {'z': 5},
            {'b': 0},
            {'z': 0},
            {'x': 1, 'y': 20},
            {'z': 3},
            {'x': 1, 'y': 20},
            {'z': 13},
            {'b': 10},
            {'z': 0},
            {'b': 0}
        ]
        self.assertEqual(expected, output_log.movements)
        self.assertEqual([(0, 2), (1, 2), (2, 2)], prog_out)

    def test_find_instrument_by_volume(self):
        self.protocol.add_instrument('A', 'p10')
        i = self.protocol._context_handler.get_instrument(volume=6)
        self.assertEqual(i.supports_volume(6), True)

    def test_protocol_run_twice(self):
        self.protocol.add_instrument('A', 'p200')
        self.protocol.add_container('A1', 'microplate.96')
        self.protocol.calibrate('A1', x=1, y=2, z=3)
        self.protocol.calibrate_instrument('A', top=0, blowout=10)
        self.protocol.transfer('A1:A1', 'A1:A2', ul=100)
        self.protocol.transfer('A1:A2', 'A1:A3', ul=80)
        self.protocol.run_all()
        self.protocol.run_all()
