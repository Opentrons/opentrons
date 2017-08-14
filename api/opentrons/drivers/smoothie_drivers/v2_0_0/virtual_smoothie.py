import io
import os
import re

from opentrons.drivers.smoothie_drivers import VirtualSmoothie
from opentrons.util import log

log = log.get_logger(__name__)


class VirtualSmoothie_2_0_0(VirtualSmoothie):

    def __init__(self, options):
        self.port = None
        self.baudrate = None
        self.timeout = None
        self.in_waiting = 0
        self.is_open = False
        self.limit_switches = options['limit_switches']
        self.config = options['config']
        self.version = options['firmware']
        self.responses = []
        self.absolute = True

        file_path = options.get('config_file_path')
        self.config_file_string = ''
        if file_path:
            with io.open(file_path, 'r', encoding='utf-8') as f:
                self.config_file_string = str(f.read())

        self.speeds = {
            'x': 4000,
            'y': 4000,
            'z': 3000,
            'a': 500,
            'b': 500
        }
        self.endstop = {
            'X_min': 0,
            'Y_min': 0,
            'Z_min': 0,
            'A_min': 0,
            'B_min': 0
        }
        self.steps_per_mm = {
            'X': self.config.get('alpha_steps_per_mm', 80),
            'Y': self.config.get('beta_steps_per_mm', 80),
            'Z': self.config.get('gamma_steps_per_mm', 400),
            'A': self.config.get('delta_steps_per_mm', 1600),
            'B': self.config.get('epsilon_steps_per_mm', 1600)
        }
        self.accelerations = {
            'X': self.config.get('alpha_steps_per_mm', 2000),
            'Y': self.config.get('beta_steps_per_mm', 2000),
            'Z': self.config.get('gamma_steps_per_mm', 2000),
            'A': self.config.get('delta_steps_per_mm', 300),
            'B': self.config.get('epsilon_steps_per_mm', 300)
        }
        self.init_coordinates()

    def isOpen(self):
        return bool(self.is_open)

    def close(self):
        self.is_open = False

    def open(self):
        self.is_open = True

    def init_coordinates(self):
        self.coordinates = {
            'current': {'x': 0, 'y': 0, 'z': 0, 'a': 0, 'b': 0},
            'target': {'x': 0, 'y': 0, 'z': 0, 'a': 0, 'b': 0}
        }

        for axis in 'xyzab':
            self.coordinates['current'][axis] = 0.0
            self.coordinates['target'][axis] = 0.0

    def parse_command(self, gcode):
        gcode = gcode.replace('M400', '')
        parse_arguments = re.compile(r"(([XYZABCSPabF])(\-?[0-9\.]*))")
        parse_command = re.compile(r"([GM][0-9\.]*)")

        command = re.findall(parse_command, gcode)
        if len(command) != 1:
            tokens = gcode.split(' ')
            command = tokens[0]
            arguments = tokens[1:]
            return {
                'command': command,
                'arguments': arguments
            }

        res = {'command': '', 'arguments': {}}
        res['command'] = command[0]

        arguments = re.findall(parse_arguments, gcode)

        for arg in arguments:
            coordinates = arg[2]
            axis = arg[1]
            # Axis without coordinates
            if coordinates == '':
                res['arguments'][axis] = None
            else:
                res['arguments'][axis] = float(coordinates)

        return res

    def process_get_endstops(self, arguments):
        # X_min:0 Y_min:0 Z_min:0 A_min:0 B_min:0 \
        # pins- (XL)P1.24:0 (YL)P1.26:0 (ZL)P1.28:0 (AL)P1.25:0 (BL)P1.27:0  # noqa
        # ok
        # ok
        res = ''
        for name in ['X', 'Y', 'Z', 'A', 'B']:
            name += '_min'
            res += '{}:{} '.format(name, self.endstop[name])
        res += 'pins- (XL)P1.24:0 (YL)P1.26:0 (ZL)P1.28:0 (AL)P1.25:0 (BL)P1.27:0'  # noqa
        return res + '\nok\nok'

    def set_position_from_arguments(self, arguments):
        for axis in 'XYZAB':
            if axis in arguments:
                target = self.coordinates['target']
                target[axis.lower()] = arguments[axis]
                current = self.coordinates['current']
                current[axis.lower()] = arguments[axis]

    def process_home_command(self, arguments):
        axis_list = arguments.keys()
        if len(arguments) == 0:
            axis_list = 'XYZAB'

        for axis in axis_list:
            arguments[axis.upper()] = 3.0
            self.endstop[axis.upper() + '_min'] = 0

        self.set_position_from_arguments(arguments)

        return 'ok\nok'

    def process_set_zero_command(self, arguments):
        axis_list = arguments.keys()
        if len(arguments) == 0:
            axis_list = 'XYZAB'

        for axis in axis_list:
            arguments[axis.upper()] = 0.0

        self.set_position_from_arguments(arguments)

        return 'ok\nok'

    def process_move_command(self, arguments):

        for axis in arguments.keys():
            if axis.lower() in 'xyzab' and not self.absolute:
                arguments[axis] += self.coordinates['target'][axis.lower()]

        self.set_position_from_arguments(arguments)

        axis_hit = None
        for axis in 'xyzab':
            if self.coordinates['target'][axis] < -3 and self.limit_switches:
                axis_hit = axis.upper() + '_min'
                self.endstop[axis_hit] = 1
                break

        if axis_hit and self.limit_switches:
            # Limit switch X was hit - reset or M999 required
            return 'Limit switch {} was hit - reset or M999 required'.format(
                axis_hit)
        return 'ok\nok'

    def process_get_position(self, arguments):
        # ok MCS: X:0.0000 Y:0.0000 Z:0.0000 A:0.0000 B:0.0000
        res = 'ok MCS:'
        for axis in 'XYZAB':
            res += ' {}:{}'.format(
                axis, self.coordinates['current'][axis.lower()])
        return '{}\nok'.format(res)

    def process_get_target(self, arguments):
        # ok MP: X:0.0000 Y:0.0000 Z:0.0000 A:0.0000 B:0.0000
        res = 'ok MP:'
        for axis in 'XYZAB':
            res += ' {}:{}'.format(
                axis, self.coordinates['target'][axis.lower()])
        return '{}\nok'.format(res)

    def process_acceleration(self, arguments):
        for axis, value in arguments.items():
            if axis.upper() in 'XYZAB':
                self.accelerations[axis.upper()] = value
        return 'ok\nok'

    def process_speed(self, arguments):
        for axis, value in arguments.items():
            if axis.upper() in 'XYZAB':
                self.speeds[axis.lower()] = value
        return 'ok\nok'

    def process_calm_down(self, arguments):
        return 'ok\nok'

    def process_halt(self, arguments):
        e = 'ok Emergency Stop Requested - reset or M999 required to exit HALT state'  # noqa
        e += '\nok'
        return e

    def process_absolute_positioning(self, arguments):
        self.absolute = True
        return 'ok\nok'

    def process_relative_positioning(self, arguments):
        self.absolute = False
        return 'ok\nok'

    def process_version(self, arguments):
        # Build version: BRANCH-HASH, Build date: MONTH DAY YEAR HOUR:MIN:SEC, MCU: LPC1769, System Clock: 120MHz   # noqa
        #   CNC Build 6 axis
        #   6 axis
        # ok
        res = 'Build version: {}, '.format(self.version)
        res += 'Build date: Mar 18 2017 21:15:21, MCU: LPC1769, System Clock: 120MHz'  # noqa
        res += '\n  CNC Build 6 axis'
        res += '\n  6 axis'
        return res + '\nok'

    def process_reset(self, arguments):
        return 'Smoothie out. Peace. Rebooting in 5 seconds...\nok'

    def process_config_get(self, arguments):
        # sd: alpha_steps_per_mm is set to 80
        # ok
        folder = arguments[0]
        setting = arguments[1]
        if setting in self.config:
            value = self.config[setting]
            return '{0}: {1} is set to {2}\nok'.format(folder, setting, value)
        else:
            return '{0}: {1} is not in config\nok'.format(folder, setting)

    def process_config_set(self, arguments):
        folder = arguments[0]
        setting = arguments[1]
        value = arguments[2]
        self.config[setting] = value
        return '{0}: {1} has been set to {2}\nok'.format(
            folder, setting, value)

    def process_cat_file(self, arguments):
        file_path = arguments[0]
        if 'sd/config' not in file_path:
            return 'File not found: {}\nok'.format(arguments[0])
        return '\n{}\nok'.format(self.config_file_string)

    def process_steps_per_mm(self, arguments):
        for axis in arguments.keys():
            if axis.upper() in 'XYZAB':
                self.steps_per_mm[axis.upper()] = arguments[axis]
        response = ''
        for axis in 'XYZAB':
            response += '{}:{} '.format(
                axis.upper(), self.steps_per_mm[axis.upper()])
        response += '\nok\nok'
        return response

    def process_dwell_command(self, arguments):
        return 'ok\nok'

    def process_nop(self, arguments):
        return 'ok\nok'

    def process_mosfet_state(self, arguments):
        return 'ok\nok'

    def process_power_on(self, arguments):
        return 'ok\nok'

    def process_power_off(self, arguments):
        return 'ok\nok'

    def insert_response(self, message):
        messages = message.split('\n')
        self.responses = list(reversed(messages)) + self.responses
        self.in_waiting = sum([len(s) for s in self.responses])

    def process_command(self, command):
        parsed_command = self.parse_command(command)

        command_mapping = {
            'G': self.process_nop,
            'M': self.process_nop,
            'G0': self.process_move_command,
            'G4': self.process_dwell_command,
            'M114.2': self.process_get_position,
            'M114.4': self.process_get_target,
            'M203.1': self.process_speed,
            'M204': self.process_acceleration,
            'G28.2': self.process_home_command,
            'G28.3': self.process_set_zero_command,
            'M119': self.process_get_endstops,
            'M92': self.process_steps_per_mm,
            'M999': self.process_calm_down,
            'M112': self.process_halt,
            'G90': self.process_absolute_positioning,
            'G91': self.process_relative_positioning,
            'M40': self.process_mosfet_state,
            'M41': self.process_mosfet_state,
            'M42': self.process_mosfet_state,
            'M43': self.process_mosfet_state,
            'M44': self.process_mosfet_state,
            'M45': self.process_mosfet_state,
            'M46': self.process_mosfet_state,
            'M47': self.process_mosfet_state,
            'M48': self.process_mosfet_state,
            'M49': self.process_mosfet_state,
            'M50': self.process_mosfet_state,
            'M51': self.process_mosfet_state,
            'M17': self.process_power_on,
            'M18': self.process_power_off,
            'version': self.process_version,
            'reset': self.process_reset,
            'config-get': self.process_config_get,
            'config-set': self.process_config_set,
            'cat': self.process_cat_file
        }
        if parsed_command:
            command = parsed_command['command']
            arguments = parsed_command['arguments']
            if command in command_mapping:
                command_func = command_mapping[command]
                # log.debug(
                #     'Processing {} calling {}'.format(
                #         parsed_command,
                #         command_func.__name__))
                message = command_func(arguments)
                self.insert_response(message)
            else:
                pass
                # log.error(
                #     'Command {} is not supported'.format(command))

    def write(self, data):
        gfile = os.environ.get('GCODE_FILE')
        if gfile:
            with open(gfile, 'a') as gf:
                gf.write(data.decode())

        if not self.isOpen():
            raise RuntimeError('Virtual Smoothie not currently connected')
        if not isinstance(data, str):
            data = data.decode('utf-8')
        # make it async later
        self.process_command(data)

    def readline(self):
        if not self.isOpen():
            raise RuntimeError('Virtual Smoothie not currently connected')
        if len(self.responses) > 0:
            return self.responses.pop().encode('utf-8')
        else:
            return b''

    def flush(self):
        pass

    def reset_input_buffer(self):
        self.responses = []
        self.in_waiting = 0
