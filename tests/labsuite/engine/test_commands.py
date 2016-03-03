import unittest
from labsuite.engine.commands import define_argument, syntax, execute

define_argument(
	'string',
	'"([^"]*?)"',
	'Any string, enclosed in double quotes.'
)

@syntax('<string>')
def echo(message):
	""" Print a message to the console. """
	return 'You wanted to print: '+ message

class CommandTest(unittest.TestCase):

	def test_basic_parsing(self):
		parsed = execute('echo "Hello, world!"')
		expected = 'You wanted to print: Hello, world!'
		self.assertEqual(expected, parsed)