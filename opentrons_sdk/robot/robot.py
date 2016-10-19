import copy
import os
from threading import Event

import serial

from opentrons_sdk import containers
from opentrons_sdk.drivers import motor as motor_drivers
from opentrons_sdk.drivers.virtual_smoothie import VirtualSmoothie
from opentrons_sdk.robot.command import Command
from opentrons_sdk.util import log

from opentrons_sdk.helpers import helpers
from opentrons_sdk.util.trace import traceable


class Robot(object):
    _commands = None  # []
    _instance = None

    VIRTUAL_SMOOTHIE_PORT = 'Virtual Smoothie'

    def __init__(self):
        self.can_pop_command = Event()
        self.stopped_event = Event()

        self.can_pop_command.set()
        self.stopped_event.clear()

        self.connections = {
            'live': None,
            'simulate': self.get_virtual_device(
                {'limit_switches': False}
            ),
            'simulate_switches': self.get_virtual_device(
                {'limit_switches': True}
            )
        }

        self._driver = motor_drivers.CNCDriver()
        self.reset()

    @classmethod
    def get_instance(cls):
        if not cls._instance or not isinstance(cls._instance, cls):
            cls._instance = cls()
        return cls._instance

    @classmethod
    def reset_for_tests(cls):
        robot = Robot.get_instance()
        robot.reset()
        return robot

    def reset(self):
        self._commands = []
        self._handlers = []
        self._runtime_warnings = []

        self._deck = containers.Deck()
        self.setup_deck()

        self._ingredients = {}  # TODO needs to be discusses/researched
        self._instruments = {}

        return self

    def set_driver(self, driver):
        self._driver = driver

    def add_instrument(self, axis, instrument):
        axis = axis.upper()
        self._instruments[axis] = instrument

    def add_warning(self, warning_msg):
        self._runtime_warnings.append(warning_msg)

    def get_warnings(self):
        return list(self._runtime_warnings)

    def get_mosfet(self, mosfet_index):
        robot_self = self

        class InstrumentMosfet():

            def engage(self):
                robot_self._driver.set_mosfet(mosfet_index, True)

            def disengage(self):
                robot_self._driver.set_mosfet(mosfet_index, False)

            def wait(self, seconds):
                robot_self._driver.wait(seconds)

        return InstrumentMosfet()

    def get_motor(self, axis):
        robot_self = self

        class InstrumentMotor():

            def move(self, value, mode='absolute'):
                kwargs = {axis: value}

                return robot_self._driver.move_plunger(
                    mode=mode, **kwargs
                )

            def home(self):
                return robot_self._driver.home(axis)

            def wait(self, seconds):
                robot_self._driver.wait(seconds)

            def speed(self, rate):
                robot_self._driver.set_plunger_speed(rate, axis)
                return self

        return InstrumentMotor()

    def flip_coordinates(self, coordinates):
        dimensions = self._driver.get_dimensions()
        return helpers.flip_coordinates(coordinates, dimensions)

    def get_serial_device(self, port):
        try:
            device = serial.Serial(
                port=port,
                baudrate=115200,
                timeout=self.serial_timeout
            )
            return device
        except serial.SerialException as e:
            log.debug(
                "Robot",
                "Error connecting to {}".format(port))
            log.error("Serial", e)

        return None

    def get_virtual_device(self, port=None, options=None):
        default_options = {
            'limit_switches': True,
            'firmware': 'v1.0.5',
            'config': {
                'ot_version': 'one_pro',
                'version': 'v1.0.3',        # config version
                'alpha_steps_per_mm': 80.0,
                'beta_steps_per_mm': 80.0
            }
        }
        if not options:
            options = {}
        default_options.update(options)
        return VirtualSmoothie(port=port, options=default_options)

    def connect(self, port=None, options=None):
        """
        Connects the motor to a serial port.
        """
        device = None
        if not port or port == self.VIRTUAL_SMOOTHIE_PORT:
            device = self.get_virtual_device(
                port=self.VIRTUAL_SMOOTHIE_PORT, options=options)
        else:
            device = self.get_serial_device(port)

        res = self._driver.connect(device)

        if res:
            self.connections['live'] = device

        return res

    def home(self, *args, **kwargs):
        def _do():
            if self._driver.calm_down():
                if args:
                    return self._driver.home(*args)
                else:
                    self._driver.home('z')
                    return self._driver.home('x', 'y', 'b', 'a')
            else:
                return False

        if kwargs.get('now'):
            return _do()
        else:
            description = "Homing Robot"
            self.add_command(Command(do=_do, description=description))

    def add_command(self, command):
        if command.description:
            log.info("Enqueing:", command.description)
        self._commands.append(command)

    def prepend_command(self, command):
        self._commands = [command] + self._commands

    def register(self, name, callback):
        def commandable():
            self.add_command(Command(do=callback))
        setattr(self, name, commandable)

    def move_head(self, *args, **kwargs):
        self._driver.move_head(*args, **kwargs)

    @traceable('move-to')
    def move_to(self, location, instrument=None, create_path=True, now=False):
        placeable, coordinates = containers.unpack_location(location)

        if instrument:
            coordinates = instrument.calibrator.convert(
                placeable,
                coordinates)
        else:
            coordinates += placeable.coordinates(placeable.get_deck())

        tallest_z = self._deck.max_dimensions(self._deck)[2][1][2]
        tallest_z += 10

        def _do():
            if create_path:
                self._driver.move_head(z=tallest_z)
                self._driver.move_head(x=coordinates[0], y=coordinates[1])
                self._driver.move_head(z=coordinates[2])
            else:
                self._driver.move_head(
                    x=coordinates[0],
                    y=coordinates[1],
                    z=coordinates[2]
                )

        if now:
            _do()
        else:
            self.add_command(Command(do=_do))

    def move_to_top(self, location, instrument=None, create_path=True):
        placeable, coordinates = containers.unpack_location(location)
        top_location = (placeable, placeable.from_center(x=0, y=0, z=1))
        self.move_to(top_location, instrument, create_path)

    @property
    def actions(self):
        return copy.deepcopy(self._commands)

    def run(self, mode='simulate'):

        self.set_connection(mode)

        self._runtime_warnings = []

        for instrument in self._instruments.values():
            instrument.reset()

        try:
            for command in self._commands:
                try:
                    self.can_pop_command.wait()
                    if self.stopped_event.is_set():
                        self.resume()
                        break
                    # print("Executing:", command.description)
                    log.info("Executing:", command.description)
                    if command.description:
                        print("Executing:", command.description)
                        log.info("Executing:", command.description)
                    command.do()
                except KeyboardInterrupt as e:
                    self._driver.halt()
                    raise e
        finally:
            self.set_connection('live')

        return self._runtime_warnings

    def set_connection(self, mode):
        if mode == 'simulate':
            self._driver.connect(self.connections['simulate'])
        elif mode == 'live':
            if self.connections['live']:
                self._driver.connect(self.connections['live'])
            else:
                self._driver.disconnect()
        else:
            raise ValueError(
                'mode expected to be "live" or "simulate", '
                '{} provided'.format(mode))

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

        for col_index, col in enumerate('ABCDE'):
            for row_index, row in enumerate(range(1, robot_rows + 1)):
                slot = containers.Slot()
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

    def get_instruments_by_name(self, name):
        res = []
        for k, v in self.get_instruments():
            if v.name == name:
                res.append((k, v))

        return res

    def get_instruments(self, name=None):
        """
        :returns: sorted list of (axis, instrument)
        """
        if name:
            return self.get_instruments_by_name(name)

        return sorted(self._instruments.items())

    def add_container(self, slot, container_name, label):
        container = containers.get_legacy_container(container_name)
        container.properties['type'] = container_name
        self._deck[slot].add(container, label)
        return container

    def clear(self):
        self._commands = []

    def pause(self):
        self.can_pop_command.clear()
        self.stopped_event.clear()
        self._driver.pause()

    def stop(self):
        self.stopped_event.set()
        self.can_pop_command.set()
        self._driver.stop()

    def resume(self):
        self.stopped_event.clear()
        self.can_pop_command.set()
        self._driver.resume()

    def get_serial_ports_list(self):
        ports = []
        # TODO: Store these settings in config
        if os.environ.get('DEBUG', '').lower() == 'true':
            ports = [self.VIRTUAL_SMOOTHIE_PORT]
        ports.extend(self._driver.get_serial_ports_list())
        return ports

    def is_connected(self):
        return self._driver.is_connected()

    def get_connected_port(self):
        return self._driver.get_connected_port()

    def versions(self):
        # TODO: Store these versions in config
        return {
            'firmware': self._driver.get_firmware_version(),
            'config': self._driver.get_config_version(),
            'robot': self._driver.get_ot_version(),
        }

    def diagnostics(self):
        # TODO: Store these versions in config
        return {
            'axis_homed': self._driver.axis_homed,
            'switches': self._driver.get_endstop_switches()
        }
