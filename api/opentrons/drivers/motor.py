import configparser
import json
import math
import time
from threading import Event

from opentrons.util.log import get_logger
from opentrons.util.vector import Vector
from opentrons.drivers.virtual_smoothie import VirtualSmoothie

from opentrons.util import trace


log = get_logger(__name__)


class CNCDriver(object):

    """
    This object outputs raw GCode commands to perform high-level tasks.
    """

    MOVE = 'G0'
    DWELL = 'G4'
    HOME = 'G28.2'
    SET_ZERO = 'G28.3'
    GET_POSITION = 'M114.2'
    GET_TARGET = 'M114.4'
    GET_ENDSTOPS = 'M119'
    HALT = 'M112'
    CALM_DOWN = 'M999'
    SET_SPEED = 'M203.1'
    SET_ACCELERATION = 'M204'
    MOTORS_ON = 'M17'
    MOTORS_OFF = 'M18'
    AXIS_AMPERAGE = 'M907'
    STEPS_PER_MM = 'M92'

    PUSH_SPEED = 'M120'
    POP_SPEED = 'M121'

    RESET = 'reset'

    ABSOLUTE_POSITIONING = 'G90'
    RELATIVE_POSITIONING = 'G91'

    CONFIG_GET = 'config-get sd'
    CONFIG_SET = 'config-set sd'
    OT_VERSION = 'ot_version'
    GET_FIRMWARE_VERSION = 'version'
    CONFIG_VERSION = 'version'
    CONFIG_STEPS_PER_MM = {
        'x': 'alpha_steps_per_mm',
        'y': 'beta_steps_per_mm',
        'z': 'gamma_steps_per_mm'
    }

    MOSFET = [
        {True: 'M41', False: 'M40'},
        {True: 'M43', False: 'M42'},
        {True: 'M45', False: 'M44'},
        {True: 'M47', False: 'M46'},
        {True: 'M49', False: 'M48'},
        {True: 'M51', False: 'M50'}
    ]

    """
    Serial port connection to talk to the device.
    """
    connection = None

    serial_timeout = None
    serial_baudrate = None

    firmware_version = None
    config_version = None
    ot_version = None

    def __init__(self, defaults_file_path):
        self.halted = Event()
        self.stopped = Event()
        self.do_not_pause = Event()
        self.resume()
        self.current_commands = []

        self.SMOOTHIE_SUCCESS = 'Success'
        self.SMOOTHIE_ERROR = 'Received unexpected response from Smoothie'
        self.STOPPED = 'Received a STOP signal and exited from movements'

        self.ignore_smoothie_sd = False

        self.config_file = ''
        self.config_dict = {}

        self.defaults = configparser.ConfigParser()
        self.defaults.read(defaults_file_path)
        self._apply_defaults()

    def get_connected_port(self):
        """
        Returns the port the driver is currently connected to
        :return:
        """
        if not self.connection:
            return
        return self.connection.name()

    def disconnect(self):
        if self.is_connected():
            self.connection.close()
        self.connection = None

    def connect(self, smoothie_connection):
        self.connection = smoothie_connection
        self.toggle_port()
        log.debug("Connected to {}".format(smoothie_connection.name()))

        self.versions_compatible()

        # TODO: (andy) Smoothieware EDGE has this weird bug,
        # seems to require the following commands to run after Smoothieboard
        # boots, or else all motors freeze up and make high-pitch sounds.
        # This is simply sending a tiny move command, then halt, then resume
        self.send_command('G91 G0 X0.001', read_after=False)
        self.wait_for_ok()
        self.send_halt_command()

        self.calm_down()

    def is_connected(self):
        if self.connection:
            return self.connection.isOpen()
        return False

    def toggle_port(self):
        self.connection.close()
        self.connection.open()
        self.connection.flush_input()

    def wait_for_ok(self):
        res = self.wait_for_response()
        if res != 'ok':
            raise RuntimeError(
                '{0}: {1}'.format(self.SMOOTHIE_ERROR, res))

    def ignore_next_line(self):
        self.wait_for_response(ignore_error=True)

    def readline_from_serial(self, ignore_error=False):
        """
        Attempt to read a line of data from serial port

        Raises RuntimeWarning if read fails on serial port
        """
        msg = self.connection.readline_string()
        if msg:
            log.debug("Read: {}".format(msg))
            if not ignore_error:
                self.detect_smoothie_error(str(msg))
        return msg

    def wait_for_response(self, timeout=20.0, ignore_error=False):
        """
        Repeatedly reads from serial port until data is received,
        or timeout is exceeded

        Raises RuntimeWarning() if no response was recieved before timeout
        """
        self.connection.wait_for_data(timeout=timeout)
        return self.readline_from_serial(ignore_error=ignore_error)

    # THREADING
    def pause(self):
        self.halted.clear()
        self.stopped.clear()
        self.do_not_pause.clear()

    def resume(self):
        self.halted.clear()
        self.stopped.clear()
        self.do_not_pause.set()

    def stop(self):
        self.halted.clear()
        self.stopped.set()
        self.do_not_pause.set()

    def halt(self):
        self.halted.set()
        self.stopped.set()
        self.do_not_pause.set()

    def check_paused_stopped(self):
        self.do_not_pause.wait()
        if self.stopped.is_set():
            if self.halted.is_set():
                self.send_halt_command()
                self.calm_down()
            self.resume()
            raise RuntimeWarning(self.STOPPED)

    # SMOOTHIE METHODS
    def send_command(self, command, read_after=True, **kwargs):
        """
        Sends a GCode command.  Keyword arguments will be automatically
        converted to GCode syntax.

        Returns a string with the Smoothie board's response
        Empty string if no response from Smoothie

        send_command(self.MOVE, x=100 y=100)
        G0 X100 Y100
        """

        args = ' '.join(['{}{}'.format(k, v) for k, v in kwargs.items()])
        command = '{} {}\r\n'.format(command, args)
        if self.is_connected():
            log.debug("Write: {}".format(command))
            self.connection.flush_input()
            self.connection.write_string(command)
            if read_after:
                return self.wait_for_response()
        else:
            raise RuntimeError('Not connected to robot')

    def detect_smoothie_error(self, msg):
        """
        Detect if it hit a home switch

        Raises RuntimeWarning if Smoothie reports a limit hit
        """
        if 'reset or M999' in msg or 'error:' in msg:
            self.calm_down()
            error_msg = 'Robot Error: limit switch hit'
            log.debug(error_msg)
            raise RuntimeWarning(error_msg)

    def move(self, mode='absolute', **kwargs):
        self.set_coordinate_system(mode)
        self.set_speed()

        current = self.get_head_position()['target']
        target_point = {
            axis: kwargs.get(
                axis,
                0 if mode == 'relative' else current[axis]
            )
            for axis in 'xyz'
        }

        flipped_vector = self.flip_coordinates(
            Vector(target_point), mode)
        for axis in 'xyz':
            kwargs[axis] = flipped_vector[axis]

        args = {axis.upper(): kwargs.get(axis)
                for axis in 'xyzab'
                if axis in kwargs}
        args.update({"F": max(list(self.speeds.values()))})

        self.check_paused_stopped()
        self.send_command(self.MOVE, **args)
        self.wait_for_ok()
        self.wait_for_arrival()

        arguments = {
            'name': 'move-finished',
            'position': {
                'head': self.get_head_position()["current"],
                'plunger': self.get_plunger_positions()["current"]
            },
            'class': type(self.connection).__name__
        }
        trace.EventBroker.get_instance().notify(arguments)

    def move_plunger(self, mode='absolute', **kwargs):
        self.move(mode, **kwargs)

    def move_head(self, mode='absolute', **kwargs):
        self.move(mode, **kwargs)

    def flip_coordinates(self, coordinates, mode='absolute'):
        if not self.ot_version:
            self.get_ot_version()
        coordinates = Vector(coordinates) * Vector(1, -1, -1)
        if mode == 'absolute':
            offset = Vector(0, 1, 1) * self.ot_one_dimensions[self.ot_version]
            coordinates += offset
        return coordinates

    def wait_for_arrival(self, tolerance=0.5):
        target = self.get_target_position()

        while True:
            self.check_paused_stopped()

            current = self.get_current_position()
            diff = {}
            for axis in list(target.keys()):
                diff[axis] = current[axis] - target[axis]
            dist = pow(diff['x'], 2) + pow(diff['y'], 2) + pow(diff['z'], 2)
            dist_head = math.sqrt(dist)

            if dist_head < tolerance:
                if abs(diff['a']) < tolerance and abs(diff['b']) < tolerance:
                    break

    def home(self, *axis):

        self.send_halt_command()
        self.calm_down()

        axis_to_home = ''
        for a in axis:
            ax = ''.join(sorted(a)).upper()
            if ax in 'ABXYZ':
                axis_to_home += ax
        if not axis_to_home:
            return

        try:
            self.send_command(self.HOME + axis_to_home)
            self.wait_for_ok()
            self.send_command(self.SET_ZERO + axis_to_home)
            self.wait_for_ok()
        except Exception:
            raise RuntimeWarning(
                'HOMING ERROR: Check switches are being pressed and connected')

        arguments = {
            'name': 'home',
            'axis': axis_to_home,
            'position': {
                'head': self.get_head_position()["current"],
                'plunger': self.get_plunger_positions()["current"]
            }
        }
        trace.EventBroker.get_instance().notify(arguments)

    def set_coordinate_system(self, mode):
        if mode == 'absolute':
            self.send_command(self.ABSOLUTE_POSITIONING)
        elif mode == 'relative':
            self.send_command(self.RELATIVE_POSITIONING)
        else:
            raise ValueError('Invalid coordinate mode: ' + mode)
        self.wait_for_ok()

    def wait(self, delay_time):
        start_time = time.time()
        end_time = start_time + delay_time
        arguments = {'name': 'delay-start', 'time': delay_time}
        trace.EventBroker.get_instance().notify(arguments)
        if not isinstance(self.connection.device(), VirtualSmoothie):
            while time.time() + 1.0 < end_time:
                self.check_paused_stopped()
                time.sleep(1)
                arguments = {
                    'name': 'countdown',
                    'countdown': int(end_time - time.time())
                }
                trace.EventBroker.get_instance().notify(arguments)
            remaining_time = end_time - time.time()
            time.sleep(max(0, remaining_time))
        arguments = {'name': 'delay-finish'}
        trace.EventBroker.get_instance().notify(arguments)

    def calm_down(self):
        res = self.send_command(self.CALM_DOWN)
        if res != 'ok':
            self.wait_for_ok()
        self.wait_for_ok()

    def send_halt_command(self):
        self.send_command(self.HALT, read_after=False)
        self.connection.serial_pause()
        self.connection.flush_input()

    def reset(self):
        res = self.send_command(self.RESET)
        if 'Rebooting' in res:
            self.wait_for_ok()
            self.disconnect()

    def get_head_position(self):
        coords = self.get_position()
        coords['current'] = self.flip_coordinates(Vector(coords['current']))
        coords['target'] = self.flip_coordinates(Vector(coords['target']))

        return coords

    def get_plunger_positions(self):
        coords = self.get_position()
        plunger_coords = {}
        for state in ['current', 'target']:
            plunger_coords[state] = {
                axis: coords[state][axis]
                for axis in 'ab'
            }

        return plunger_coords

    def get_position(self):
        return {
            'current': self.get_current_position(),
            'target': self.get_target_position()
        }

    def get_current_position(self):
        # ok MCS: X:0.0000 Y:0.0000 Z:0.0000 A:0.0000 B:0.0000 C:0.0000
        current_string = self.send_command(self.GET_POSITION)
        self.wait_for_ok()
        return self._parse_axis_values(current_string)

    def get_target_position(self):
        # ok MP: X:0.0000 Y:0.0000 Z:0.0000 A:0.0000 B:0.0000 C:0.0000
        target_string = self.send_command(self.GET_TARGET)
        self.wait_for_ok()
        return self._parse_axis_values(target_string)

    def set_acceleration(self, **kwargs):
        axis = {
            ax.upper(): val
            for ax, val in kwargs.items()
            if ax.upper() in 'XYZABC'
        }
        self.send_command(self.SET_ACCELERATION, **axis)
        self.wait_for_ok()

    def set_speed(self, *args, **kwargs):
        if len(args) > 0:
            self.speeds['x'] = args[0]
            self.speeds['y'] = args[0]
        if 'xy' in kwargs:
            self.speeds['x'] = kwargs['xy']
            self.speeds['y'] = kwargs['xy']
        for l in 'xyzab':
            if l in kwargs:
                self.speeds[l] = int(kwargs[l])
        if self.is_connected():
            kwargs = {
                key.upper(): int(val / 60)  # M203.1 is in mm/sec (not mm/min)
                for key, val in self.speeds.items()
            }
            self.send_command(self.SET_SPEED, **kwargs)
            self.wait_for_ok()

    def set_plunger_speed(self, rate, axis):
        if axis.lower() not in 'ab':
            raise ValueError('Axis {} not supported'.format(axis))
        self.speeds[axis] = rate

    def calibrate_steps_per_mm(self, axis, expected_travel, actual_travel):
        current_steps_per_mm = self.get_steps_per_mm(axis)
        current_steps_per_mm *= (expected_travel / actual_travel)
        current_steps_per_mm = round(current_steps_per_mm, 2)
        self.set_steps_per_mm(axis, current_steps_per_mm)

    def get_steps_per_mm(self, axis):
        if axis.lower() not in 'xyzab':
            raise ValueError('Axis {} not supported'.format(axis))

        res = self.send_command(self.STEPS_PER_MM)
        self.wait_for_ok()
        self.wait_for_ok()
        return self._parse_axis_values(res).get(axis.lower())

    def set_steps_per_mm(self, axis, value):
        if axis.lower() not in 'xyz':
            raise ValueError('Axis {} not supported'.format(axis))

        res = self.send_command(self.STEPS_PER_MM, **{axis.upper(): value})
        self.wait_for_ok()
        self.wait_for_ok()

        returned_value = self._parse_axis_values(res).get(axis.lower())
        assert float(returned_value) == value

        key = self.CONFIG_STEPS_PER_MM[axis.lower()]
        self.set_config_value(key, str(returned_value))
        assert float(returned_value) == value

    def get_endstop_switches(self):
        # X_min:0 Y_min:0 Z_min:0 A_min:0 B_min:0 pins- (XL)P1.24:0 .......
        endstop_values = self.send_command(self.GET_ENDSTOPS)
        self.wait_for_ok()
        self.wait_for_ok()

        # ['X_min:0', 'Y_min:0', 'Z_min:0', 'A_min:0', 'B_min:0']
        endstop_values = endstop_values.split(' ')[:5]
        return {
            endstop[0].lower(): bool(int(endstop.split(':')[1]))
            for endstop in endstop_values
        }

    def set_mosfet(self, mosfet_index, state):
        try:
            command = self.MOSFET[mosfet_index][bool(state)]
            res = self.send_command(command)
            return res == 'ok'
        except IndexError:
            raise IndexError(
                "Smoothie mosfet not at index {}".format(mosfet_index))

    def power_on(self):
        self.send_command(self.MOTORS_ON)
        self.wait_for_ok()

    def power_off(self):
        self.send_command(self.MOTORS_OFF)
        self.wait_for_ok()

    def _parse_axis_values(self, string):
        try:
            parsed_values = string.split(' ')
            if parsed_values[0] == 'ok':
                parsed_values = parsed_values[2:]
            return {
                s.split(':')[0].lower(): float(s.split(':')[1])
                for s in parsed_values
            }
        except ValueError as e:
            log.critical("Error parsing position string from smoothie board:")
            log.critical(string)
            raise ValueError(e) from e

    # SETTINGS
    def read_config_file(self):
        self.send_command('cat /sd/config', read_after=False)
        self.connection.wait_for_data(timeout=3)

        self.config_file = ''
        self.config_dict = {}

        count = 50  # arbitrary
        while count > 0:
            data = self.readline_from_serial()
            if not data:
                count -= 1
                continue
            if len(data) and data != 'ok':
                self.config_file += data
                data = data.split('#')[0].strip()
                if not len(data):
                    continue
                data = [d.strip() for d in data.split(' ') if len(d)]
                self.config_dict[data[0]] = data[-1]
            elif data == 'ok':
                self.connection.flush_input()
                break

    def get_config_value(self, key):
        if not self.config_file:
            self.read_config_file()
        return self.config_dict.get(key)

    def set_config_value(self, key, value):
        command = '{0} {1} {2}'.format(self.CONFIG_SET, key, value)
        self.send_command(command)
        self.wait_for_ok()  # ignore second 'ok'
        self.read_config_file()

    def versions_compatible(self):
        self.get_ot_version()
        self.get_firmware_version()
        self.get_config_version()
        res = {
            'firmware': True,
            'config': True,
            'ot_version': True
        }
        if self.firmware_version not in self.COMPATIBLE_FIRMARE:
            res['firmware'] = False
        if self.config_file_version not in self.COMPATIBLE_CONFIG:
            res['config'] = False
        if self.ot_version not in self.ot_one_dimensions:
            res['ot_version'] = False

        if not all(res.values()):
            raise RuntimeError(
                'This Robot\'s versions are incompatible with the API: '
                'firmware={firmware}, '
                'config={config}, '
                'ot_version={ot_version}'.format(
                    firmware=self.firmware_version,
                    config=self.config_file_version,
                    ot_version=self.ot_version
                )
            )
        return res

    def get_ot_version(self):
        res = self.get_config_value(self.OT_VERSION)
        self.ot_version = None
        if res not in self.ot_one_dimensions:
            log.debug('{} is not an ot_version'.format(res))
            return None
        self.ot_version = res
        return self.ot_version

    def get_firmware_version(self):
        # Build version: BRANCH-HASH, Build date: Mar 18 2017 21:15:21, MCU: LPC1769, System Clock: 120MHz  # noqa
        #   CNC Build 6 axis
        #   6 axis
        # ok
        line_1 = self.send_command(self.GET_FIRMWARE_VERSION)
        self.ignore_next_line()
        self.ignore_next_line()
        self.wait_for_ok()

        # use the "branch-hash" portion as the version
        self.firmware_version = line_1.split(',')[0].split(' ')[-1]

        return self.firmware_version

    def get_config_version(self):
        res = self.get_config_value(self.CONFIG_VERSION)
        self.config_file_version = res
        return self.config_file_version

    def get_dimensions(self):
        if not self.ot_version:
            self.get_ot_version()
        return self.ot_one_dimensions[self.ot_version]

    def _apply_defaults(self):
        self.serial_timeout = float(
            self.defaults['serial'].get('timeout', 0.02))
        self.serial_baudrate = int(
            self.defaults['serial'].get('baudrate', 115200))

        self.speeds = json.loads(
            self.defaults['state'].get(
                'speeds',
                '{"x": 3000, "y":3000, "z": 1600, "a": 300, "b": 300}'
            )
        )

        self.COMPATIBLE_FIRMARE = json.loads(
            self.defaults['versions'].get('firmware', '[]'))
        self.COMPATIBLE_CONFIG = json.loads(
            self.defaults['versions'].get('config', '[]'))
        self.ot_one_dimensions = json.loads(
            self.defaults['versions'].get('ot_versions', '{}'))
        for key in self.ot_one_dimensions.keys():
            axis_size = Vector(self.ot_one_dimensions[key])
            self.ot_one_dimensions[key] = axis_size
