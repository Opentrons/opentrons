class Command(object):
    def __int__(self, do, description=None):
        assert callable(do)
        self.do = do
        self.description = description

    def __call__(self):
        self.do()


class Macro(object):
    def __init__(self, description):
        self.description = description
        self._commands = []

    def add(self, command : Command):
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


class Pipette(object):
    def aspirate(self):
        def do():
            self.motor.move(x=50)
            self.wait(50)

        c = Command(do)

        self.protocol.add(c)

    def call(self, do):
        self.protocol.add(Command(do=do))


p200.apsirate()

level = 100

def magbead():
    global level
    magbead.up(level)

while level < 300:
    p = Robot.get_instance()
    p.register('magbead_move', magbead())

    p.magbead_move()




