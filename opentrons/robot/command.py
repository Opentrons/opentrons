class Command(object):
    def __init__(self, do, description=None):
        assert callable(do)
        self.do = do
        self.description = description

    def __call__(self):
        self.do()


class Macro(object):
    def __init__(self, description):
        self.description = description
        self._commands = []

    def add(self, command):
        if not isinstance(command, Command):
            raise TypeError(
                'Expected object of type Command. Got "{}"'
                .format(type(command).__name__)
            )

        self._commands.append(command)

    def do(self):
        for command in self._commands:
            command.do()

    __call__ = do
