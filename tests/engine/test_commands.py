import unittest
from engine import commands

class CommandTest(unittest.TestCase):

	def test_basic_parsing(self):
		parsed = commands.parse('echo Hello, world!')
		expected = {
		  'command': 'echo',
		  'message': 'Hello, world!'
		}
		self.assertEqual(expected, parsed)