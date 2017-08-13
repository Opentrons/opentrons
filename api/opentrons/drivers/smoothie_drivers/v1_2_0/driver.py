import json
import math
import os
import pkg_resources
import time
from threading import Event

from opentrons.util.log import get_logger
from opentrons.util.vector import Vector
from opentrons.drivers.smoothie_drivers import VirtualSmoothie, SmoothieDriver

from opentrons.util import trace, environment


DEFAULTS_DIR_PATH = pkg_resources.resource_filename(
    'opentrons.config', 'smoothie')
DEFAULTS_FILE_PATH = os.path.join(DEFAULTS_DIR_PATH, 'smoothie-defaults.ini')
CONFIG_DIR_PATH = environment.get_path('APP_DATA_DIR')
CONFIG_DIR_PATH = os.path.join(CONFIG_DIR_PATH, 'smoothie')
CONFIG_FILE_PATH = os.path.join(CONFIG_DIR_PATH, 'smoothie-config.ini')

log = get_logger(__name__)


class SmoothieDriver_1_2_0(SmoothieDriver):

    """
    This object outputs raw GCode commands to perform high-level tasks.
    """

    MOVE = 'G0'
    DWELL = 'G4'
    HOME = 'G28'
    SET_POSITION = 'G92'
    GET_POSITION = 'M114'
    GET_ENDSTOPS = 'M119'
    SET_SPEED = 'G0'
    HALT = 'M112'
    CALM_DOWN = 'M999'
    ACCELERATION = 'M204'
    MOTORS_ON = 'M17'
    MOTORS_OFF = 'M18'
    STEPS_PER_MM = 'M92'

    DISENGAGE_FEEDBACK = 'M63'

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
    config_file_version = None
    ot_version = None

    def __init__(self, defaults):
        self.halted = Event()
        self.stopped = Event()
        self.do_not_pause = Event()
        self.resume()
        self.current_commands = []

        self.ot_one_dimensions = {}
        self.default_speeds = {}
        self.speeds = {}

        self.SMOOTHIE_SUCCESS = 'Success'
        self.SMOOTHIE_ERROR = 'Received unexpected response from Smoothie'
        self.STOPPED = 'Received a STOP signal and exited from movements'

        self.ignore_smoothie_sd = False

        self._apply_defaults(defaults)

    def _apply_defaults(self, defaults_file):

        DEFAULT_VERSIONS = defaults_file['versions']
        DEFAULT_MODELS = json.loads(defaults_file['models']['ot_versions'])

        self.compatible_firmware = json.loads(DEFAULT_VERSIONS['firmware'])
        self.compatible_config = json.loads(DEFAULT_VERSIONS['config'])

        for key in DEFAULT_MODELS.keys():
            axis_size = Vector(DEFAULT_MODELS[key]['dimensions'])
            self.ot_one_dimensions[key] = axis_size
            self.default_speeds[key] = DEFAULT_MODELS[key]['speeds']

    def get_connected_port(self):
        """
        Returns the port the driver is currently connected to
        :return:
        """
        if not self.connection:
            return
        return self.connection.name()

    def get_dimensions(self):
        if not self.ot_version:
            self.get_ot_version()
        return self.ot_one_dimensions[self.ot_version]

    def disconnect(self):
        if self.is_connected():
            self.connection.close()

    def connect(self, device):
        self.connection = device
        self.toggle_port()
        log.debug("Connected to {}".format(device))

        self.turn_off_feedback()
        self.versions_compatible()
        if self.ignore_smoothie_sd:
            self._set_step_per_mm_from_config()

        return self.calm_down()

    def is_connected(self):
        return self.connection and self.connection.isOpen()

    def is_simulating(self):
        return bool(isinstance(
            self.connection.device(), VirtualSmoothie))

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
                self.send_command(self.HALT)
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
                self.connection.write_string(data)
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
                self.connection.name())
            log.error(msg)
            raise RuntimeError(msg)

    def wait_for_response(self, timeout=20.0):
        """
        Repeatedly reads from serial port until data is received,
        or timeout is exceeded

        Raises RuntimeWarning() if no response was recieved before timeout
        """
        count = 0
        end_time = time.time() + timeout
        while self.is_connected() and end_time > time.time():
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
        self.connection.flush_input()

    def readline_from_serial(self, timeout=20):
        """
        Attempt to read a line of data from serial port

        Raises RuntimeWarning if read fails on serial port
        """
        msg = ''
        try:
            self.connection.wait_for_data(timeout=timeout)
            msg = self.connection.readline_string()
            msg = msg.strip()
        except Exception as e:
            self.disconnect()
            raise RuntimeWarning('Lost connection with serial port') from e
        if msg:
            log.debug("Read: {}".format(msg))
            self.detect_limit_hit(msg)  # raises RuntimeWarning if switch hit

        return msg

    def detect_limit_hit(self, msg):
        """
        Detect if it hit a home switch

        Raises RuntimeWarning if Smoothie reports a limit hit
        """
        if '!!' in msg or 'limit' in msg:
            log.debug('home switch hit')
            time.sleep(0.5)
            self.flush_port()
            self.calm_down()
            self.set_position(
                **self.get_position().get('current', {l: 0 for l in 'xyzab'})
            )
            raise RuntimeWarning('Robot Error: limit switch hit')

    def set_coordinate_system(self, mode):
        if mode == 'absolute':
            self.send_command(self.ABSOLUTE_POSITIONING)
        elif mode == 'relative':
            self.send_command(self.RELATIVE_POSITIONING)
        else:
            raise ValueError('Invalid coordinate mode: ' + mode)

    def move(self, mode='absolute', **kwargs):
        self.set_coordinate_system(mode)

        axis_called = [ax for ax in 'xyz' if ax in kwargs]

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

        if axis_called:
            this_head_speed = min([self.speeds[l] for l in axis_called])
            args.update({"F": this_head_speed})
        args.update({"a": self.speeds['a']})
        args.update({"b": self.speeds['b']})

        return self.consume_move_commands(args)

    def move_plunger(self, mode='absolute', **kwargs):
        return self.move(mode, **kwargs)

    def move_head(self, mode='absolute', **kwargs):
        return self.move(mode, **kwargs)

    def consume_move_commands(self, args):
        self.check_paused_stopped()

        log.debug("Moving : {}".format(args))
        res = self.send_command(self.MOVE, **args)
        if res != 'ok':
            return (False, self.SMOOTHIE_ERROR)

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
        return (True, self.SMOOTHIE_SUCCESS)

    def flip_coordinates(self, coordinates, mode='absolute'):
        coordinates = Vector(coordinates) * Vector(1, -1, -1)
        if mode == 'absolute':
            offset = Vector(0, 1, 1)
            offset *= self.ot_one_dimensions[self.get_ot_version()]
            coordinates += offset
        return coordinates

    def wait_for_arrival(self, tolerance=0.1):
        coords = self.get_position()

        prev_max_diff = 0
        did_move_timestamp = time.time()
        while True:
            self.check_paused_stopped()
            self.connection.serial_pause()
            coords = self.get_position()
            diff = {}
            for axis in coords.get('target', {}):
                axis_diff = coords['current'][axis] - coords['target'][axis]
                diff[axis.lower()] = axis_diff

            dist = pow(diff['x'], 2) + pow(diff['y'], 2) + pow(diff['z'], 2)
            dist_head = math.sqrt(dist)

            """
            smoothie not guaranteed to be EXACTLY where it's target is
            but seems to be about +-0.05 mm from the target coordinate
            the robot's physical resolution is found with:
            1mm / config_steps_per_mm
            """
            max_diff = max(dist_head, abs(diff['a']), abs(diff['b']))
            if max_diff < tolerance:
                return
            if max_diff != prev_max_diff:
                did_move_timestamp = time.time()
            prev_max_diff = max_diff
            if time.time() - did_move_timestamp > 1.0:
                raise RuntimeError('Expected robot to move, please reconnect')

    def home(self, *axis):
        axis_to_home = ''
        for a in axis:
            ax = ''.join(sorted(a)).upper()
            if ax in 'ABXYZ':
                axis_to_home += ax
        if not axis_to_home:
            return

        res = None
        try:
            res = self.send_command(self.HOME + axis_to_home)
        except Exception:
            raise RuntimeWarning(
                'HOMING ERROR: Check switches are being pressed and connected')
        if res == 'ok':
            arguments = {
                'name': 'home',
                'axis': axis_to_home,
                'position': {
                    'head': self.get_head_position()["current"],
                    'plunger': self.get_plunger_positions()["current"]
                }
            }
            trace.EventBroker.get_instance().notify(arguments)
            # the axis aren't necessarily set to 0.0
            # values after homing, so force it
            pos_args = {}
            for l in axis_to_home:
                pos_args[l] = 0
            return self.set_position(**pos_args)
        else:
            return False

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
        return True

    def calm_down(self):
        res = self.send_command(self.CALM_DOWN)
        return res == 'ok'

    def reset(self):
        res = self.send_command(self.RESET)
        if 'Rebooting' in res:
            self.disconnect()

    def set_position(self, **kwargs):
        uppercase_args = {}
        for key in kwargs:
            uppercase_args[key.upper()] = kwargs[key]
        res = self.send_command(self.SET_POSITION, **uppercase_args)
        return res == 'ok'

    def get_current_position(self):
        return self.get_position().get('current', {})

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
        res = self.send_command(self.GET_POSITION)
        # remove the "ok " from beginning of response
        res = res[3:]
        coords = {}
        try:
            response_dict = json.loads(res).get(self.GET_POSITION)
            coords = {'target': {}, 'current': {}}
            for letter in 'xyzab':
                # the lowercase axis are the "real-time" values
                coords['current'][letter] = response_dict.get(letter, 0)
                # the uppercase axis are the "target" values
                coords['target'][letter] = response_dict.get(letter.upper(), 0)

        except ValueError:
            log.critical("Error parsing JSON string from smoothie board:")
            log.critical(res)

        return coords

    def turn_off_feedback(self):
        res = self.send_command(self.DISENGAGE_FEEDBACK)
        if res == 'feedback disengaged':
            res = self.wait_for_response()
            return res == 'ok'
        else:
            return False

    def calibrate_steps_per_mm(self, axis, expected_travel, actual_travel):
        current_steps_per_mm = self.get_steps_per_mm(axis)
        current_steps_per_mm *= (expected_travel / actual_travel)
        current_steps_per_mm = round(current_steps_per_mm, 2)
        return self.set_steps_per_mm(axis, current_steps_per_mm)

    def set_head_speed(self, rate=None):
        if rate:
            self.speeds['x'] = rate
            self.speeds['y'] = rate
        return True

    def set_plunger_speed(self, rate, axis):
        if axis.lower() not in 'ab':
            raise ValueError('Axis {} not supported'.format(axis))
        self.speeds[axis.lower()] = rate

    def set_speed(self, *args, **kwargs):
        if len(args) > 0:
            kwargs.update({'x': args[0], 'y': args[0]})
        self.speeds.update({l: kwargs[l] for l in 'xyzab' if l in kwargs})

    def versions_compatible(self):
        self.get_ot_version()
        self.get_firmware_version()
        self.get_config_version()
        res = {
            'firmware': True,
            'config': True,
            'ot_version': True
        }
        if self.firmware_version not in self.compatible_firmware:
            res['firmware'] = False
        if self.config_file_version not in self.compatible_config:
            res['config'] = False
        if not self.ot_version:
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
        if not self.ot_version:
            res = self.get_config_value(self.OT_VERSION)
            if res not in self.ot_one_dimensions:
                log.debug('{} is not an ot_version'.format(res))
                return None
            self.ot_version = res
            self.speeds = self.default_speeds[self.ot_version]
        return self.ot_version

    def get_firmware_version(self):
        if not self.firmware_version:
            res = self.send_command(self.GET_FIRMWARE_VERSION)
            res = res.split(' ')[-1]
            # the version is returned as a JSON dict, the version is a string
            # but not wrapped in double-quotes as JSON requires...
            # aka --> {"version":v1.0.5}
            self.firmware_version = res.split(':')[-1][:-1]
        return self.firmware_version

    def get_config_version(self):
        if not self.config_file_version:
            res = self.get_config_value(self.CONFIG_VERSION)
            self.config_file_version = res
        return self.config_file_version

    def get_steps_per_mm(self, axis):
        if axis.lower() not in 'xyz':
            raise ValueError('Axis {} not supported'.format(axis))

        res = self.send_command(self.STEPS_PER_MM)
        self.wait_for_response()  # extra 'ok' sent from smoothie after M92
        try:
            value = json.loads(res)[self.STEPS_PER_MM][axis.upper()]
            return float(value)
        except Exception:
            raise RuntimeError(
                '{0}: {1}'.format(self.SMOOTHIE_ERROR, res))

    def set_steps_per_mm(self, axis, value):
        if axis.lower() not in 'xyz':
            raise ValueError('Axis {} not supported'.format(axis))

        res = self.send_command(self.STEPS_PER_MM, **{axis.upper(): value})
        self.wait_for_response()  # extra 'ok' sent from smoothie after M92

        key = self.CONFIG_STEPS_PER_MM[axis.lower()]
        try:
            response_dict = json.loads(res)
            returned_value = response_dict[self.STEPS_PER_MM][axis.upper()]
            self.set_config_value(key, str(returned_value))
            return float(returned_value) == value
        except Exception:
            raise RuntimeError(
                '{0}: {1}'.format(self.SMOOTHIE_ERROR, res))

    def get_config_value(self, key):
        command = '{0} {1}'.format(self.CONFIG_GET, key)
        return self.send_command(command).split(' ')[-1]

    def set_config_value(self, key, value):
        command = '{0} {1} {2}'.format(self.CONFIG_SET, key, value)
        res = self.send_command(command)
        success = res.split(' ')[-1] == str(value)
        return success

    def get_endstop_switches(self):
        first_line = self.send_command(self.GET_ENDSTOPS)
        second_line = self.wait_for_response()
        if second_line == 'ok':
            res = json.loads(first_line)
            res = res.get(self.GET_ENDSTOPS)
            obj = {}
            for axis in 'xyzab':
                obj[axis] = bool(res.get('min_' + axis))
            return obj
        else:
            return False

    def set_mosfet(self, mosfet_index, state):
        try:
            command = self.MOSFET[mosfet_index][bool(state)]
            res = self.send_command(command)
            return res == 'ok'
        except IndexError:
            raise IndexError(
                "Smoothie mosfet not at index {}".format(mosfet_index))

    def power_on(self):
        res = self.send_command(self.MOTORS_ON)
        return res == 'ok'

    def power_off(self):
        res = self.send_command(self.MOTORS_OFF)
        return res == 'ok'
