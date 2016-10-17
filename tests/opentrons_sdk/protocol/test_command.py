import threading
import unittest

from opentrons_sdk.robot.command import Command, Macro


class CommandTest(unittest.TestCase):

	def setUp(self):
		pass

	def test_command(self):
		expected = None
		def _do():
			nonlocal expected
			expected = 'test'
		description = 'test'
		command = Command(do=_do, description=description)
		command()
		self.assertEquals(expected, command.description)

	def test_macro(self):
		expected = []

		macro = Macro('macro_test')

		for i in range(3):
			def _do():
				nonlocal expected
				expected.append('test')
			command = Command(do=_do)
			macro.add(command)

		macro.do()

		self.assertEquals(expected, ['test', 'test', 'test'])