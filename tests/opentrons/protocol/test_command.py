import unittest

from opentrons.robot.command import Command, Macro


class CommandTest(unittest.TestCase):

    def setUp(self):
        pass

    def test_command(self):
        expected = ''

        def _setup():
            nonlocal expected
            expected = 'hello'

        def _do():
            nonlocal expected
            expected += ' world'
        description = 'hello world'
        command = Command(do=_do, setup=_setup, description=description)
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
