import copy

from opentrons_sdk.containers import placeable
from opentrons_sdk.util import log
from opentrons_sdk.protocol.handlers import ContextHandler
from opentrons_sdk.protocol.command import Command

import opentrons_sdk.drivers.motor as motor_drivers


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

    def set_driver(self, driver):
        self._driver = driver

    def get_motor(self, axis):
        robot_self = self

        class InstrumentMotor():
            def move(self, value, speed=None, absolute=True):
                kwargs = {axis:value}
                return robot_self._driver.move(speed=speed, absolute=absolute, **kwargs)
            def home(self):
                return robot_self._driver.home(axis)
            def wait_for_arrival(self):
                return robot_self._driver.wait_for_arrival()

        return InstrumentMotor()

    def list_serial_ports(self):
        return self._driver.list_serial_ports()

    def connect(self, port):
        """
        Connects the MotorControlHandler to a serial port.

        If a device connection is set, then any dummy or alternate motor
        drivers are replaced with the serial driver.
        """
        self.set_driver(motor_drivers.OpenTrons())
        return self._driver.connect(device=port)

    def simulate(self):
        self.set_driver(motor_drivers.MoveLogger())

    def home(self):
        if self._driver.resume():
            return self._driver.home()
        else:
            return False

    def add_command(self, command: Command):
        # TODO: validate with isinstance
        self._commands.append(command)

    def register(self, name, callback):
        def commandable():
            self.add_command(Command(do=callback))
        setattr(self, name, commandable)

    def move_to(self, address, instrument=None):
        coords = None
        if isinstance(address, placeable.Placeable):
            coords = address.coordinates()
        elif isinstance(address, tuple) and len(address) == 3:
            coords = address
        else:
            raise Exception('Unable to parse address: {}'.format(address))


        # TODO: (andy) path optomization goes here
        #       now it simply just goes to the top every time

        def _do():
            self._driver.move(z=0)
            self._driver.move(x=coords[0], y=coords[1])
            self._driver.move(z=coords[2])
            self._driver.wait_for_arrival()

        description = "Moving head to {}".format(str(address))
        self.add_command(Command(do=_do, description=description))

    def add_container(self, slot, name):
        container_obj = self._context_handler.add_container(slot, name)
        # self._containers[slot] = name
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
        while self._commands:
            command = self._commands.pop(0)
            command.do()
            log.debug("Robot", command.description)


    def _initialize_context(self):
        """
        Initializes the context.
        """
        calibration = None
        if self._context_handler:
            calibration = self._context_handler._calibration
        self._context_handler = ContextHandler(self)
        if calibration:
            self._context_handler._calibration = calibration

    def disconnect(self):
        if self._motor_handler:
            self._motor_handler.disconnect()

    def containers(self):
        return self._context_handler.get_containers()

    def get_instruments(self):
        return self._context_handler.get_instruments()

    def get_deck(self):
        return self._context_handler.get_deck()
