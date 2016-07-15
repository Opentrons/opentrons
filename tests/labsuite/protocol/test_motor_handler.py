import unittest
from labsuite.protocol import Protocol


class MotorHandlerTest(unittest.TestCase):

    def setUp(self):
        self.protocol = Protocol()

    def test_basic_transfer(self):
        """ Basic transfer. """
        motor = self.protocol.attach_motor()
        output_log = motor._driver
        self.protocol.add_instrument('B', 'p200')
        self.protocol.add_container('A1', 'microplate.96')
        self.protocol.add_container('C1', 'tiprack.p200')
        self.protocol.add_container('B2', 'point.trash')
        self.protocol.calibrate('A1', x=1, y=2, top=3, bottom=13)
        self.protocol.calibrate('A1:A2', bottom=5)
        self.protocol.calibrate('C1', x=100, y=100, top=50)
        self.protocol.calibrate('B2', x=200, y=250, top=15)
        self.protocol.calibrate_instrument('B', top=0, blowout=10, droptip=25)
        self.protocol.transfer('A1:A1', 'A1:A2', ul=100)
        self.protocol.transfer('A1:A2', 'A1:A3', ul=80)
        prog_out = []
        for progress in self.protocol.run():
            prog_out.append(progress)
        expected = [
            # Transfer 1.
            {'x': 100, 'y': 100},  # Pickup tip.
            {'z': 50},
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
            {'x': 200, 'y': 250},  # Dispose tip.
            {'z': 15},
            {'b': 25},
            {'b': 0},
            # Transfer 2.
            {'x': 100, 'y': 109},
            {'z': 50},
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
            {'b': 0},
            {'x': 200, 'y': 250},
            {'z': 15},
            {'b': 25},
            {'b': 0}
        ]
        self.assertEqual(expected, output_log.movements)
        self.assertEqual([(0, 2), (1, 2), (2, 2)], prog_out)

    def test_transfer_without_tiprack(self):
        """ Raise error when no tiprack found. """
        self.protocol.attach_motor()
        self.protocol.add_instrument('B', 'p200')
        self.protocol.add_container('A1', 'microplate.96')
        self.protocol.calibrate_instrument('B', top=0, blowout=10)
        self.protocol.transfer('A1:A1', 'A1:A2', ul=100)
        self.protocol.transfer('A1:A2', 'A1:A3', ul=80)
        with self.assertRaises(KeyError):
            for progress in self.protocol.run():
                next

    def test_transfer_without_dispose_point(self):
        """ Raise when no dispose point set. """
        self.protocol.attach_motor()
        self.protocol.add_instrument('B', 'p200')
        self.protocol.add_container('A1', 'microplate.96')
        self.protocol.add_container('C1', 'tiprack.p200')
        self.protocol.calibrate_instrument('B', top=0, blowout=10)
        self.protocol.transfer('A1:A1', 'A1:A2', ul=100)
        self.protocol.transfer('A1:A2', 'A1:A3', ul=80)
        with self.assertRaises(KeyError):
            for progress in self.protocol.run():
                next
