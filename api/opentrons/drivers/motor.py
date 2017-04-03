import configparser
import glob
import json
import math
import os
import pkg_resources
import sys
import time
from threading import Event

import serial

from opentrons.util.log import get_logger
from opentrons.util.vector import Vector
from opentrons.drivers.virtual_smoothie import VirtualSmoothie

from opentrons.util import trace


DEFAULTS_DIR_PATH = pkg_resources.resource_filename(
    'opentrons.config', 'smoothie')
DEFAULTS_FILE_PATH = os.path.join(DEFAULTS_DIR_PATH, 'smoothie-defaults.ini')
CONFIG_DIR_PATH = os.environ.get('APP_DATA_DIR', os.getcwd())
CONFIG_DIR_PATH = os.path.join(CONFIG_DIR_PATH, 'smoothie')
CONFIG_FILE_PATH = os.path.join(CONFIG_DIR_PATH, 'smoothie-config.ini')

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

    def __init__(self):
        self.halted = Event()
        self.stopped = Event()
        self.do_not_pause = Event()
        self.resume()
        self.current_commands = []

        self.SMOOTHIE_SUCCESS = 'Success'
        self.SMOOTHIE_ERROR = 'Received unexpected response from Smoothie'
        self.STOPPED = 'Received a STOP signal and exited from movements'

        self.ignore_smoothie_sd = False

        self.defaults = configparser.ConfigParser()
        self.defaults.read(DEFAULTS_FILE_PATH)
        self._apply_defaults()

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

    def get_connected_port(self):
        """
        Returns the port the driver is currently connected to
        :return:
        """
        if not self.connection:
            return
        return self.connection.port

    def get_dimensions(self):
        if not self.ot_version:
            self.get_ot_version()
        return self.ot_one_dimensions[self.ot_version]

    def get_serial_ports_list(self):
        """ Lists serial port names

            :raises EnvironmentError:
                On unsupported or unknown platforms
            :returns:
                A list of the serial ports available on the system
        """
        if sys.platform.startswith('win'):
            ports = ['COM%s' % (i + 1) for i in range(256)]
        elif (sys.platform.startswith('linux') or
              sys.platform.startswith('cygwin')):
            # this excludes your current terminal "/dev/tty"
            ports = glob.glob('/dev/tty*')
        elif sys.platform.startswith('darwin'):
            ports = glob.glob('/dev/tty.*')
        else:
            raise EnvironmentError('Unsupported platform')

        result = []
        port_filter = {'usbmodem', 'COM', 'ACM', 'USB'}
        for port in ports:
            try:
                if any([f in port for f in port_filter]):
                    s = serial.Serial(port)
                    s.close()
                    result.append(port)
            except Exception as e:
                log.debug(
                    'Exception in testing port {}'.format(port))
                log.debug(e)
        return result

    def disconnect(self):
        if self.is_connected() and self.connection:
            self.connection.close()
        self.connection = None

    def connect(self, device):
        self.connection = device
        self.toggle_port()
        log.debug("Connected to {}".format(device))

        self.versions_compatible()

        # TODO: (andy) smoothieware edge has this weird bug,
        # seems to require the following commands to run after Smoothieboard
        # boots, or else all motors freeze up and make high-pitch sounds
        self.write_to_serial('G91 G0 X0.001\r\n')
        self.wait_for_ok()
        self.send_halt_command()

        self.calm_down()

    def is_connected(self):
        return self.connection and self.connection.isOpen()

    def toggle_port(self):
        self.connection.close()
        self.connection.open()
        self.flush_port()

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

    def send_command(self, command, **kwargs):
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
        response = self.write_to_serial(command)
        return response

    def write_to_serial(self, data, max_tries=10, try_interval=0.2):
        """
        Sends data string to serial ports

        Returns data immediately read from port after write

        Raises RuntimeError write fails or connection times out
        """
        log.debug("Write: {}".format(str(data).encode()))
        if self.is_connected():
            try:
                self.connection.write(str(data).encode())
            except Exception as e:
                self.disconnect()
                raise RuntimeError('Lost connection with serial port') from e
            return self.wait_for_response()
        elif self.connection is None:
            msg = "No connection found."
            log.warn(msg)
            raise RuntimeError(msg)
        elif max_tries > 0:
            self.toggle_port()
            return self.write_to_serial(
                data, max_tries=max_tries - 1, try_interval=try_interval
            )
        else:
            msg = "Cannot connect to serial port {}".format(
                self.connection.port)
            log.error(msg)
            raise RuntimeError(msg)

    def wait_for_response(self, timeout=20.0):
        """
        Repeatedly reads from serial port until data is received,
        or timeout is exceeded

        Raises RuntimeWarning() if no response was recieved before timeout
        """
        count = 0
        max_retries = int(timeout / self.serial_timeout)
        while self.is_connected() and count < max_retries:
            count = count + 1
            out = self.readline_from_serial()
            if out:
                log.debug(
                    "Waited {} lines for response {}.".format(count, out)
                )
                return out
            else:
                if count == 1 or count % 10 == 0:
                    # Don't log all the time; gets spammy.
                    log.debug(
                        "Waiting {} lines for response.".format(count)
                    )
        raise RuntimeWarning(
            'No response from serial port after {} seconds'.format(timeout))

    def flush_port(self):
        while self.is_connected() and self.connection.readline().decode():
            time.sleep(self.serial_timeout)

    def readline_from_serial(self):
        """
        Attempt to read a line of data from serial port

        Raises RuntimeWarning if read fails on serial port
        """
        msg = b''
        try:
            msg = self.connection.readline()
            msg = msg.strip()
        except Exception as e:
            self.disconnect()
            raise RuntimeWarning('Lost connection with serial port') from e
        if msg:
            log.debug("Read: {}".format(msg))
            self.detect_smoothie_error(msg)  # raises RuntimeWarning if switch hit

        return msg

    def detect_smoothie_error(self, msg):
        """
        Detect if it hit a home switch

        Raises RuntimeWarning if Smoothie reports a limit hit
        """
        string_msg = msg.decode()
        if '!!' in string_msg or 'Limit' in string_msg or 'error' in string_msg:
            self.flush_port()
            self.calm_down()
            error_msg = 'Smoothie Error: {}'.format(string_msg)
            log.debug(error_msg)
            raise RuntimeWarning(error_msg)

    def _parse_axis_values(self, string):
        try:
            return {
                s.split(':')[0].lower(): float(s.split(':')[1])
                for s in string.decode('utf-8').split(' ')[2:]
            }
        except ValueError as e:
            log.critical("Error parsing position string from smoothie board:")
            log.critical(res)
            raise ValueError(e) from e

    def set_coordinate_system(self, mode):
        if mode == 'absolute':
            self.send_command(self.ABSOLUTE_POSITIONING)
        elif mode == 'relative':
            self.send_command(self.RELATIVE_POSITIONING)
        else:
            raise ValueError('Invalid coordinate mode: ' + mode)
        self.wait_for_ok()

    def move(self, mode='absolute', **kwargs):
        self.set_coordinate_system(mode)
        self.set_speed()

        current = self.get_head_position()['target']
        log.debug('Current Head Position: {}'.format(current))
        target_point = {
            axis: kwargs.get(
                axis,
                0 if mode == 'relative' else current[axis]
            )
            for axis in 'xyz'
        }
        log.debug('Destination: {}'.format(target_point))

        flipped_vector = self.flip_coordinates(
            Vector(target_point), mode)
        for axis in 'xyz':
            kwargs[axis] = flipped_vector[axis]

        args = {axis.upper(): kwargs.get(axis)
                for axis in 'xyzab'
                if axis in kwargs}
        args.update({"F": max(list(self.speeds.values()))})

        self.consume_move_commands(args)

    def move_plunger(self, mode='absolute', **kwargs):
        self.move(mode, **kwargs)

    def move_head(self, mode='absolute', **kwargs):
        self.move(mode, **kwargs)

    def consume_move_commands(self, args):
        self.check_paused_stopped()

        log.debug("Moving : {}".format(args))
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

            """
            smoothie not guaranteed to be EXACTLY where it's target is
            but seems to be about +-0.05 mm from the target coordinate
            the robot's physical resolution is found with:
            1mm / config_steps_per_mm

            Also, the higher the tolerance, the faster robot coordinates
            will transition from one to the next (faster change in direction)
            """
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

        res = None
        try:
            self.send_command(self.HOME + axis_to_home)
            self.wait_for_ok()
            self.send_command(self.SET_ZERO + axis_to_home)
            self.wait_for_ok()
            self.power_off()
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

    def wait(self, delay_time):
        start_time = time.time()
        end_time = start_time + delay_time
        arguments = {'name': 'delay-start', 'time': delay_time}
        trace.EventBroker.get_instance().notify(arguments)
        if not isinstance(self.connection, VirtualSmoothie):
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
        if res != b'ok':
            self.wait_for_ok()
        self.wait_for_ok()

    def send_halt_command(self):
        self.send_command(self.HALT)
        self.wait_for_ok()

    def reset(self):
        res = self.send_command(self.RESET)
        if b'Rebooting' in res:
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

    def calibrate_steps_per_mm(self, axis, expected_travel, actual_travel):
        current_steps_per_mm = self.get_steps_per_mm(axis)
        current_steps_per_mm *= (expected_travel / actual_travel)
        current_steps_per_mm = round(current_steps_per_mm, 2)
        self.set_steps_per_mm(axis, current_steps_per_mm)

    def set_acceleration(self, **kwargs):
        axis = {
            ax.upper(): val
            for ax, val in kwargs.items()
            if ax.upper() in 'XYZABC'
        }
        self.send_command(self.SET_ACCELERATION, **axis)
        self.wait_for_ok()

    def calculate_shared_speed(self, **kwargs):
        return min([self.speeds[key.lower()] for key in list(kwargs.keys())])

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

    def get_ot_version(self):
        res = self.get_config_value(self.OT_VERSION)
        self.ot_version = None
        if res not in self.ot_one_dimensions:
            log.debug('{} is not an ot_version'.format(res))
            return None
        self.ot_version = res
        log.debug('Read ot_version {}'.format(res))
        return self.ot_version

    def get_firmware_version(self):
        # Build version: BRANCH-HASH, Build date: Mar 18 2017 21:15:21, MCU: LPC1769, System Clock: 120MHz
        #   CNC Build 6 axis
        #   6 axis
        # ok
        line_1 = self.send_command(self.GET_FIRMWARE_VERSION)
        self.ignore_next_line()
        self.ignore_next_line()
        self.wait_for_ok()

        # use the "branch-hash" portion as the version
        self.firmware_version = line_1.decode().split(',')[0].split(' ')[-1]

        return self.firmware_version

    def get_config_version(self):
        res = self.get_config_value(self.CONFIG_VERSION)
        self.config_file_version = res
        return self.config_file_version

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

        self.send_command(self.STEPS_PER_MM, **{axis.upper(): value})
        self.wait_for_ok()
        self.wait_for_ok()

        key = self.CONFIG_STEPS_PER_MM[axis.lower()]
        try:
            response_dict = json.loads(res.decode())
            returned_value = response_dict[self.STEPS_PER_MM][axis.upper()]
            self.set_config_value(key, str(returned_value))
            return float(returned_value) == value
        except Exception:
            raise RuntimeError(
                '{0}: {1}'.format(self.SMOOTHIE_ERROR, res))

    def get_config_value(self, key):
        command = '{0} {1}'.format(self.CONFIG_GET, key)
        res = self.send_command(command).decode()
        self.wait_for_ok()
        if 'is set to' in res:
            return res.split(' ')[-1]
        return None

    def set_config_value(self, key, value):
        success = True
        command = '{0} {1} {2}'.format(self.CONFIG_SET, key, value)
        res = self.send_command(command)
        self.wait_for_ok()  # ignore second 'ok'
        success = res.decode().split(' ')[-1] == str(value)
        return success

    def get_endstop_switches(self):
        # X_min:0 Y_min:0 Z_min:0 A_min:0 B_min:0 pins- (XL)P1.24:0 .......
        endstop_values = self.send_command(self.GET_ENDSTOPS).decode()
        self.wait_for_ok()  # remove 'ok'
        self.wait_for_ok()  # remove 'ok'

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
            return res == b'ok'
        except IndexError:
            raise IndexError(
                "Smoothie mosfet not at index {}".format(mosfet_index))

    def power_on(self):
        self.send_command(self.MOTORS_ON)
        self.wait_for_ok()

    def power_off(self):
        self.send_command(self.MOTORS_OFF)
        self.wait_for_ok()

    def wait_for_ok(self):
        res = self.wait_for_response()
        if res != b'ok':
            raise RuntimeError(
                '{0}: {1}'.format(self.SMOOTHIE_ERROR, res))

    def ignore_next_line(self):
        self.wait_for_response()
