import copy
import os
from threading import Event

import serial

from opentrons import containers
from opentrons.drivers import motor as motor_drivers
from opentrons.drivers.virtual_smoothie import VirtualSmoothie
from opentrons.robot.command import Command
from opentrons.util.log import get_logger
from opentrons.helpers import helpers
from opentrons.util.trace import traceable
from opentrons.util.singleton import Singleton


log = get_logger(__name__)


class Robot(object, metaclass=Singleton):
    """
    This class is the main interface to the robot.

    Through this class you can can:
        * define your :class:`opentrons.Deck`
        * :meth:`simulate` the protocol run
        * :meth:`connect` to Opentrons physical robot
        * :meth:`run` the protocol on a robot
        * :meth:`home` axis, move head (:meth:`move_head`)
        * :meth:`pause` and :func:`resume` the protocol run

    Notes
    -----
    Each Opentrons protocol is a Python script which when evaluated creates
    an execution plan which stored as a list of commands in
    Robot's command queue.

    First you write the protocol in Python then you :func:`simulate`
    it against a virtual robot or :func:`run` it on a real robot.

    Using a Python script and the Opentrons API load your containers and
    instruments (see :class:`Pipette`). Then write your instructions which
    will get converted into an execution plan.

    Example protocol:

    After commands have been enqueued, you can :func:`simulate`
    or :func:`run` on a robot.

    See :class:`Pipette` for the list of supported instructions.

    Examples
    --------
    >>> from opentrons.robot import Robot
    >>> from opentrons.instruments.pipette import Pipette
    >>> robot = Robot()
    >>> plate = robot.add_container('A1', '96-flat', 'plate')
    >>> p200 = Pipette(axis='b')
    >>> p200.aspirate(200, plate[0]) # doctest: +ELLIPSIS
    <opentrons.instruments.pipette.Pipette object at ...>
    >>> robot.commands()
    ['Aspirating 200uL at <Deck>/<Slot A1>/<Container plate>/<Well A1>']
    >>> robot.simulate()
    []
    """

    _commands = None  # []
    _instance = None

    VIRTUAL_SMOOTHIE_PORT = 'Virtual Smoothie'

    def __init__(self):
        """
        Initializes a robot instance.

        Notes
        -----
        This class is a singleton. That means every time you call
        :func:`__init__` the same instance will be returned. There's
        only once instance of a robot.
        """
        self.can_pop_command = Event()
        self.stopped_event = Event()

        self.can_pop_command.set()
        self.stopped_event.clear()

        self.connections = {
            'live': None,
            'simulate': self.get_virtual_device(
                options={'limit_switches': False}
            ),
            'simulate_switches': self.get_virtual_device(
                options={'limit_switches': True}
            )
        }

        self._driver = motor_drivers.CNCDriver()
        self.reset()

    @classmethod
    def get_instance(cls):
        """
        Deprecated. Use Robot() instead.

        Returns
        -------
        An instance of a robot.
        """

        # leaving this method for backwards compatibility
        # before Singleton meta-class was introduced
        #
        # TODO: remove method, refactor dependencies
        return Robot()

    @classmethod
    def reset_for_tests(cls):
        """
        Deprecated.
        """
        robot = Robot.get_instance()
        robot.reset()
        return robot

    def reset(self):
        """
        Resets the state of the robot and clears:
            * Deck
            * Instruments
            * Command queue
            * Runtime warnings
        """
        self._commands = []
        self._handlers = []
        self._runtime_warnings = []

        self._deck = containers.Deck()
        self.setup_deck()

        self._ingredients = {}  # TODO needs to be discusses/researched
        self._instruments = {}

        return self

    def add_instrument(self, axis, instrument):
        """
        Adds instrument to a robot.

        Parameters
        ----------
        axis : str
            Specifies which axis the instruments is attached to.
        instrument : Instrument
            An instance of a :class:`Pipette` to attached to the axis.

        Notes
        -----
        A canonical way to add to add a Pipette to a robot is:

        ::

            from opentrons.instruments.pipette import Pipette
            p200 = Pipette(axis='a')

        This will create a pipette and call :func:`add_instrument`
        to attach the instrument.
        """
        axis = axis.upper()
        self._instruments[axis] = instrument

    def add_warning(self, warning_msg):
        """
        Internal. Add a runtime warning to the queue.
        """
        self._runtime_warnings.append(warning_msg)

    def get_warnings(self):
        """
        Get current runtime warnings.

        Returns
        -------

        Runtime warnings accumulated since the last :func:`run`
        or :func:`simulate`.
        """
        return list(self._runtime_warnings)

    def get_mosfet(self, mosfet_index):
        """
        Get MOSFET for a MagBead (URL).

        Parameters
        ----------
        mosfet_index : int
            Number of a MOSFET on MagBead.

        Returns
        -------
        Instance of :class:`InstrumentMosfet`.
        """
        robot_self = self

        class InstrumentMosfet():
            """
            Provides access to MagBead's MOSFET.
            """

            def engage(self):
                """
                Engages the MOSFET.
                """
                robot_self._driver.set_mosfet(mosfet_index, True)

            def disengage(self):
                """
                Disengages the MOSFET.
                """
                robot_self._driver.set_mosfet(mosfet_index, False)

            def wait(self, seconds):
                """
                Pauses protocol execution.

                Parameters
                ----------
                seconds : int
                    Number of seconds to pause for.
                """
                robot_self._driver.wait(seconds)

        return InstrumentMosfet()

    def get_motor(self, axis):
        """
        Get robot's head motor.

        Parameters
        ----------
        axis : {'a', 'b'}
            Axis name. Please check stickers on robot's gantry for the name.
        """
        robot_self = self

        class InstrumentMotor():
            """
            Provides access to Robot's head motor.
            """
            def move(self, value, mode='absolute'):
                """
                Move plunger motor.

                Parameters
                ----------
                value : int
                    A one-dimensional coordinate to move to.
                mode : {'absolute', 'relative'}
                """
                kwargs = {axis: value}

                return robot_self._driver.move_plunger(
                    mode=mode, **kwargs
                )

            def home(self):
                """
                Home plunger motor.
                """
                return robot_self._driver.home(axis)

            def wait(self, seconds):
                """
                Wait.

                Parameters
                ----------
                seconds : int
                    Number of seconds to pause for.
                """
                robot_self._driver.wait(seconds)

            def speed(self, rate):
                """
                Set motor speed.

                Parameters
                ----------
                rate : int
                """
                robot_self._driver.set_plunger_speed(rate, axis)
                return self

        return InstrumentMotor()

    def flip_coordinates(self, coordinates):
        """
        Flips between Deck and Robot coordinate systems.

        TODO: Add image explaining coordinate systems.
        """
        dimensions = self._driver.get_dimensions()
        return helpers.flip_coordinates(coordinates, dimensions)

    def get_serial_device(self, port):
        """
        Connect to a serial CNC device.

        Parameters
        ----------
        port : str
            OS-specific port name.

        Returns
        -------
        Serial device instance to be supplied to :func:`connect`
        """
        try:
            device = serial.Serial(
                port=port,
                baudrate=115200,
                timeout=self._driver.serial_timeout
            )
            return device
        except serial.SerialException as e:
            log.debug(
                "Error connecting to {}".format(port))
            log.error(e)

        return None

    def get_virtual_device(self, port=None, options=None):
        """
        Connect to a :class:`VirtualSmoothie` to simulate behavior of
        a Smoothieboard

        Parameters
        ----------
        port : str
            Port name. Could be `None` or anything.
        options : dict
            Options to be passed to :class:`VirtualSmoothie`.

            Default:

            ::

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

        """
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
        Connects the robot to a serial port.

        Parameters
        ----------
        port : str
            OS-specific port name or ``'Virtual Smoothie'``
        options : dict
            if :attr:`port` is set to ``'Virtual Smoothie'``, provide
            the list of options to be passed to :func:`get_virtual_device`

        Returns
        -------
        ``True`` for success, ``False`` for failure.
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
        """
        Home robot's head and plunger motors.

        Parameters
        ----------
        *args :
            A string with axes to home. For example ``'xyz'`` or ``'ab'``.

            If no arguments provided home Z-axis then X, Y, B, A

        enqueue : {True, False} Default: ``False``
            If ``True`` put into command queue,
            if ``False`` execute immediately.

        Notes
        -----
        Sometimes while executing a long protocol,
        a robot might accumulate precision
        error and it is recommended to home it. In this scenario, add
        ``robot.home('xyzab', enqueue=True)`` into your script.

        Examples
        --------
        >>> from opentrons.robot import Robot
        >>> robot.connect('Virtual Smoothie')
        True
        >>> robot.home()
        True
        """
        def _do():
            if self._driver.calm_down():
                if args:
                    return self._driver.home(*args)
                else:
                    self._driver.home('z')
                    return self._driver.home('x', 'y', 'b', 'a')
            else:
                return False

        if kwargs.get('enqueue'):
            description = "Homing Robot"
            self.add_command(Command(do=_do, description=description))
        else:
            log.info('Executing: Home now')
            return _do()

    def add_command(self, command):
        if command.description:
            log.info("Enqueuing: {}".format(command.description))
        self._commands.append(command)

    def prepend_command(self, command):
        self._commands = [command] + self._commands

    def register(self, name, callback):
        def commandable():
            self.add_command(Command(do=callback))
        setattr(self, name, commandable)

    def move_head(self, *args, **kwargs):
        self._driver.move_head(*args, **kwargs)

    def head_speed(self, rate):
        self._driver.set_head_speed(rate)

    @traceable('move-to')
    def move_to(self, location, instrument=None, strategy='arc', **kwargs):
        """
        Move an instrument to a coordinate, container or a coordinate within
        a container.

        Parameters
        ----------
        location : one of the following:
            1. :class:`Placeable` (i.e. Container, Deck, Slot, Well) — will
            move to the origin of a container.
            2. :class:`Vector` move to the given coordinate in Deck coordinate
            system.
            3. (:class:`Placeable`, :class:`Vector`) move to a given coordinate
            within object's coordinate system.
        instrument :
            Instrument to move relative to. If ``None``, move relative to the
            center of a gantry.
        strategy : {'arc', 'direct'}
            ``arc`` : move to the point using arc trajectory
            avoiding obstacles.

            ``direct`` : move to the point in a straight line.

        Examples
        --------
        >>> from opentrons.robot import Robot
        >>> robot.reset() # doctest: +ELLIPSIS
        <opentrons.robot.robot.Robot object at ...>
        >>> robot.connect('Virtual Smoothie')
        True
        >>> robot.home()
        True
        >>> plate = robot.add_container('A1', '96-flat', 'plate')
        >>> robot.move_to(plate[0])
        >>> robot.move_to(plate[0].top())
        """

        # Adding this for backwards compatibility with old move_to(now=False)
        # convention.
        now = False
        if 'now' not in kwargs:
            now = not kwargs.get('enqueue')
        else:
            now = kwargs.get('now')

        placeable, coordinates = containers.unpack_location(location)

        if instrument:
            coordinates = instrument.calibrator.convert(
                placeable,
                coordinates)
        else:
            coordinates += placeable.coordinates(placeable.get_deck())

        _, _, tallest_z = self._deck.max_dimensions(self._deck)
        tallest_z += 10

        def _do():
            if strategy == 'arc':
                self._driver.move_head(z=tallest_z)
                self._driver.move_head(x=coordinates[0], y=coordinates[1])
                self._driver.move_head(z=coordinates[2])
            elif strategy == 'direct':
                self._driver.move_head(
                    x=coordinates[0],
                    y=coordinates[1],
                    z=coordinates[2]
                )
            else:
                raise RuntimeError(
                    'Unknown move strategy: {}'.format(strategy))

        if now:
            _do()
        else:
            self.add_command(Command(do=_do))

    @property
    def actions(self):
        """
        Return a copy of a raw list of commands in the Robot's queue.
        """
        return copy.deepcopy(self._commands)

    def prepare_for_run(self):
        """
        Internal. Prepare for a Robot's run.
        """
        if not self._driver.connection:
            raise RuntimeWarning('Please connect to the robot')

        self._runtime_warnings = []

        if not self._instruments:
            self.add_warning('No instruments added to robot')
        if not self._commands:
            self.add_warning('No commands added to robot')

        for instrument in self._instruments.values():
            instrument.reset()

    def run(self):
        """
        Run the command queue on a device provided in :func:`connect`.

        Notes
        -----
        If :func:`connect` was called with ``port='Virtual Smoothie'``
        it will execute similar to :func:`simulate`.

        Examples
        --------
        >>> from opentrons.robot import Robot
        >>> from opentrons.instruments.pipette import Pipette
        >>> robot.reset() # doctest: +ELLIPSIS
        <opentrons.robot.robot.Robot object at ...>
        >>> robot.connect('Virtual Smoothie')
        True
        >>> robot.home()
        True
        >>> plate = robot.add_container('A1', '96-flat', 'plate')
        >>> p200 = Pipette(axis='a')
        >>> robot.move_to(plate[0])
        >>> robot.move_to(plate[0].top())
        """
        self.prepare_for_run()

        for command in self._commands:
            try:
                self.can_pop_command.wait()
                if self.stopped_event.is_set():
                    self.resume()
                    break
                if command.description:
                    log.info("Executing: {}".format(command.description))
                command.do()
            except KeyboardInterrupt as e:
                self._driver.halt()
                raise e

        return self._runtime_warnings

    def simulate(self, switches=False):
        if switches:
            self.set_connection('simulate_switches')
        else:
            self.set_connection('simulate')

        for instrument in self._instruments.values():
            instrument.set_plunger_defaults()

        res = self.run()

        self.set_connection('live')

        for instrument in self._instruments.values():
            instrument.restore_plunger_positions()

        return res

    def set_connection(self, mode):
        if mode in self.connections:
            connection = self.connections[mode]
            if connection:
                self._driver.connect(connection)
            else:
                self._driver.disconnect()
        else:
            raise ValueError(
                'mode expected to be "live" or "simulate", '
                '{} provided'.format(mode))

    def disconnect(self):
        if self._driver:
            self._driver.disconnect()

        self.connections['live'] = None

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
                self._deck.add(slot, slot_name, slot_coordinates)

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

    def commands(self):
        return [c.description for c in self._commands]
