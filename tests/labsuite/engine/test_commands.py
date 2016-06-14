import unittest
from labsuite.engine.commands import define_argument, syntax, execute
from labsuite.engine.commands import _flush_context


class CommandTest(unittest.TestCase):

    def setUp(self):

        define_argument(
            'plate',
            '(([A-Z][1-9])|(\w+)):(([A-Z][1-9])|(\w+))',
            'A1:A1 or Plate1:A1'
        )

        define_argument(
            'volume',
            '\d+[umµ]l',
            '10ul, 10ml, 10l, 10µl, etc.'
        )

        @syntax('<plate:from_plate> to <plate:to_plate>')
        def transfer(from_plate=None, to_plate=None):
            """ Named tag arguments. """
            return 'Transfer from {} to {}.'.format(from_plate, to_plate)

        @syntax('<volume> to <plate>')
        def move_volume(volume=None, plate=None):
            """ Unnamed tag arguments. """
            return 'Move volume of {} to {}.'.format(volume, plate)

    def tearDown(self):
        _flush_context()

    def test_basic_parsing(self):
        """ Parsing of named tags. """
        parsed = execute('transfer A2:B1 to D3:A1')
        expected = 'Transfer from A2:B1 to D3:A1.'
        self.assertEqual(expected, parsed)

    def move_volume(self):
        """ Parsing of unnamed tags. """
        parsed = execute('move_volume 100ul to D3:A1')
        expected = 'Move volume of 100ul to D3:A1.'
        self.assertEqual(expected, parsed)
