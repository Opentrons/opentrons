import unittest
from labsuite.engine.commands import define_argument, syntax, execute

define_argument(
    'plate',
    '(([A-Z][1-9])|(\w+)):(([A-Z][1-9])|(\w+))',
    'A1:A1 or Plate1:A1'
)

@syntax('<plate:from_plate> to <plate:to_plate>')
def transfer(from_plate=None, to_plate=None):
    """ Print a message to the console. """
    return 'Transfer from {} to {}.'.format(from_plate, to_plate)

class CommandTest(unittest.TestCase):

    def test_basic_parsing(self):
        parsed = execute('transfer A2:B1 to D3:A1')
        expected = 'Transfer from A2:B1 to D3:A1.'
        self.assertEqual(expected, parsed)
