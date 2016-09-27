
import copy

from opentrons_sdk.labware.grid import normalize_position, humanize_position

from opentrons_sdk.util.log import debug
from opentrons_sdk.protocol.handlers import ContextHandler, MotorControlHandler
from opentrons_sdk.protocol.command import Command


class Robot(object):
    _commands = None  # []

    _handlers = None  # List of attached handlers for run_next.

    # Context and Motor are important handlers, so we provide
    # a way to get at them.
    _context_handler = None  # Operational context (virtual robot).
    _motor_handler = None

    _containers = None  # { slot: container_name }

    _instance = None


    @classmethod
    def get_instance(cls):
        if not cls._instance or not isinstance(cls._instance, cls):
            cls._instance = cls()
        return cls._instance

    @classmethod
    def reset(cls):
        """
        Use this for testing
        :return:
        """
        Robot._instance = None
        return Robot.get_instance()

    def __init__(self):
        self._ingredients = {}
        self._commands = []
        self._handlers = []
        self._initialize_context()

    def add_command(self, command: Command):
        # TODO: validate with isinstance
        self._commands.append(command)

    def move_to(self, address):
        self.motor.move(x=100)
        self.motor.move(y7=100)
        # def _move_to():
        # self._commands.add(command.Command(_move_to))

    def add_container(self, slot, name):
        container_obj = self._context_handler.add_container(slot, name)
        self._containers[slot] = name
        return container_obj

    def add_instrument(self, axis, instrument=None):
        self._context_handler.add_instrument(axis, instrument)

    @property
    def actions(self):
        return copy.deepcopy(self._commands)

    def run(self):
        """
        A generator that runs each command and yields the current command
        index and the number of total commands.
        """
        # TODO: Rewrite to use new command queue
        self._initialize_context()
        i = 0
        yield(0, len(self._commands))
        while i < len(self._commands):
            cur = self._commands[i]
            command = list(cur)[0]
            args = cur[command]
            self._run(i)
            i += 1
            yield (i, len(self._commands))

    def run_all(self):
        """
        Convenience method to run every command in a protocol.

        Useful for when you don't care about the progress.
        """
        # TODO: Rewrite to use new command queue
        for _ in self.run():
            pass

    def _initialize_context(self):
        """
        Initializes the context.
        """
        calibration = None
        if self._context_handler:
            calibration = self._context_handler._calibration
        self._context_handler = ContextHandler(self)
        for slot, name in self._containers.items():
            self._context_handler.add_container(slot, name)
        if calibration:
            self._context_handler._calibration = calibration

    def _run_in_context_handler(self, command, **kwargs):
        """
        Runs a command in the virtualized context.

        This is useful for letting us know if there's a problem with a
        particular command without having to wait to run it on the robot.

        If you use this on your own you're going to end up with weird state
        bugs that have nothing to do with the protocol.
        """
        method = getattr(self._context_handler, command)
        if not method:
            raise KeyError("Command not defined: " + command)
        method(**kwargs)

    def _run(self, index):
        # TODO: Rewrite to use new command queue
        cur = self._commands[index]
        command = list(cur)[0]
        kwargs = cur[command]
        self._run_in_context_handler(command, **kwargs)
        for h in self._handlers:
            debug(
                "Protocol",
                "{}.{}: {}"
                .format(type(h).__name__, command, kwargs)
            )
            h.before_each()
            method = getattr(h, command)
            method(**kwargs)
            h.after_each()

    def attach_handler(self, handler_class):
        """
        When you attach a handler, commands are run on the handler in sequence
        when Protocol.run_next() is called.

        You don't have to attach the ContextHandler, you get that for free.
        It's a good example implementation of what these things are
        supposed to do.

        Any command that the robot supports must be present on the Handler
        you pass in, or you'll get exceptions. Just make sure you subclass
        from ProtocolHandler and you'll be fine; empty methods are stubbed
        out for all supported commands.

        Pass in the class, not an instance. This method returns the
        instantiated object, which you can use to do any additional setup
        required for the particular Handler.
        """
        handler = handler_class(self, self._context_handler)
        self._handlers.append(handler)
        return handler

    def attach_motor(self, port=None):
        self._motor_handler = self.attach_handler(MotorControlHandler)
        if port is not None:
            self._motor_handler.connect(port)
        else:
            self._motor_handler.simulate()
        return self._motor_handler

    def disconnect(self):
        if self._motor_handler:
            self._motor_handler.disconnect()


    def containers(self):
        return self._context_handler.get_containers()

    def get_instruments(self):
        return self._context_handler.get_instruments()

    def get_deck(self):
        return self._context_handler.get_deck()
