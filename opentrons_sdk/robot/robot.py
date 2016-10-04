import copy, time

import opentrons_sdk.drivers.motor as motor_drivers
from opentrons_sdk.containers import legacy_containers, placeable
from opentrons_sdk.robot.command import Command
from opentrons_sdk.util import log

from opentrons_sdk.containers.placeable import unpack_location
from opentrons_sdk.containers.calibrator import apply_calibration


class Robot(object):
    _commands = None  # []
    _instance = None

    def __init__(self, driver_instance=None):
        self._commands = []
        self._handlers = []

        self._deck = placeable.Deck()
        self.setup_deck()

        self._ingredients = {}  # TODO needs to be discusses/researched
        self._instruments = {}

        self._driver = driver_instance or motor_drivers.MoveLogger()

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

    def set_driver(self, driver):
        self._driver = driver

    def add_instrument(self, axis, instrument):
        axis = axis.upper()
        self._instruments[axis] = instrument

    def get_motor(self, axis):
        robot_self = self

        class InstrumentMotor():
            def move(self, value, speed=None, absolute=True):
                kwargs = {axis: value}
                return robot_self._driver.move(
                    speed=speed, absolute=absolute, **kwargs
                )

            def home(self):
                return robot_self._driver.home(axis)

            def wait_for_arrival(self):
                return robot_self._driver.wait_for_arrival()

            def wait(self, seconds):
                robot_self._driver.wait(seconds)

            def speed(self, rate, axis):
                robot_self._driver.speed(rate, axis)
                return self


        return InstrumentMotor()

    def list_serial_ports(self):
        return self._driver.list_serial_ports()

    def connect(self, port):
        """
        Connects the motor to a serial port.

        If a device connection is set, then any dummy or alternate motor
        drivers are replaced with the serial driver.
        """
        return self._driver.connect(device=port)

    def home(self, *args):
        if self._driver.resume():
            return self._driver.home(*args)
        else:
            return False

    def add_command(self, command):
        self._commands.append(command)

    def add_command_to_beginning(self, command):
        self._commands = [command] + self._commands

    def register(self, name, callback):
        def commandable():
            self.add_command(Command(do=callback))
        setattr(self, name, commandable)

    def move_head(self, *args, **kwargs):
        self._driver.move(*args, **kwargs)
        self._driver.wait_for_arrival()

    def move_to(self, location, instrument=None, create_path=True):
        placeable, coordinates = unpack_location(location)
        calibration_data = {}
        if instrument:
            calibration_data = instrument.calibration_data
            instrument.placeables.append(placeable)

        coordinates = apply_calibration(
            calibration_data,
            placeable,
            coordinates)

        tallest_z = self._deck.max_dimensions(self._deck)[2][1][2]
        tallest_z += 10

        def _do():
            if create_path:
                self._driver.move(z=tallest_z)
                self._driver.move(x=coordinates[0], y=coordinates[1])
                self._driver.move(z=coordinates[2])
            else:
                self._driver.move(
                    x=coordinates[0],
                    y=coordinates[1],
                    z=coordinates[2])
            self._driver.wait_for_arrival()

        description = "Moving head to {} {}".format(
            str(placeable),
            coordinates)
        self.add_command(Command(do=_do, description=description))

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
            if command.description == "Pausing": return
            print("Executing: ", command.description)
            log.debug("Robot", command.description)
            command.do()

    def disconnect(self):
        if self._driver:
            self._driver.disconnect()

    def containers(self):
        return self._deck.containers()

    def get_deck_slot_types(self):
        return 'acrylic_slots'

    def get_slot_offsets(self):
        """
        col_offset
        - from bottom left corner of A to bottom corner of B

        row_offset
        - from bottom left corner of 1 to bottom corner of 2

        TODO: figure out actual X and Y offsets (from origin)
        """
        SLOT_OFFSETS = {
            '3d_printed_slots': {
                'x_offset': 10,
                'y_offset': 10,
                'col_offset': 91,
                'row_offset': 134.5
            },
            'acrylic_slots': {
                'x_offset': 10,
                'y_offset': 10,
                'col_offset': 96.25,
                'row_offset': 133.3
            }

        }
        slot_settings = SLOT_OFFSETS.get(self.get_deck_slot_types())
        row_offset = slot_settings.get('row_offset')
        col_offset = slot_settings.get('col_offset')
        x_offset = slot_settings.get('x_offset')
        y_offset = slot_settings.get('y_offset')
        return (row_offset, col_offset, x_offset, y_offset)

    def get_max_robot_rows(self):
        # TODO: dynamically figure out robot rows
        return 3

    def setup_deck(self):
        robot_rows = self.get_max_robot_rows()
        row_offset, col_offset, x_offset, y_offset = self.get_slot_offsets()

        for col_index, col in enumerate('EDCBA'):
            for row_index, row in enumerate(range(robot_rows, 0, -1)):
                slot = placeable.Slot()
                slot_coordinates = (
                    (row_offset * row_index) + x_offset,
                    (col_offset * col_index) + y_offset,
                    0  # TODO: should z always be zero?
                )
                slot_name = "{}{}".format(col, row)
                self._deck.add(slot, slot_name, (slot_coordinates))

    @property
    def deck(self):
        return self._deck

    def get_instruments(self):
        """
        :returns: sorted list of (axis, instrument)
        """
        return sorted(self._instruments.items())

    def add_container(self, slot, container_name):
        container = legacy_containers.get_legacy_container(container_name)
        self._deck[slot].add(container, container_name)
        return container
