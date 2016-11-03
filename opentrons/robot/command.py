class Command(object):
    def __init__(self, do=None, setup=None, description=None):
        assert callable(do)
        self.setup = setup
        self.do = do
        self.description = description

    def __call__(self):
        if self.setup:
            self.setup()
        self.do()

    def __str__(self):
        return self.description or ''


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
