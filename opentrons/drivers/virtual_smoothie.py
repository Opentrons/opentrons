import re
import json

from opentrons.util import log

log = log.get_logger(__name__)


class VirtualSmoothie(object):
    def init_coordinates(self):
        self.coordinates = {
            'current': {'x': 0, 'y': 0, 'z': 0, 'a': 0, 'b': 0},
            'target': {'x': 0, 'y': 0, 'z': 0, 'a': 0, 'b': 0}
        }

        for axis in 'xyzab':
            self.coordinates['current'][axis] = 0.0
            self.coordinates['target'][axis] = 0.0

    def __init__(self, port, options):
        self.port = port
        self.limit_switches = options['limit_switches']
        self.config = options['config']
        self.version = options['firmware']
        self.responses = []
        self.absolute = True
        self.is_open = False
        self.speed = {
            'head': 0.0,
            'plunger': {
                'a': 0.0,
                'b': 0.0
            }
        }
        self.endstop = {
            'min_x': 0,
            'min_y': 0,
            'min_z': 0,
            'min_a': 0,
            'min_b': 0
        }
        self.steps_per_mm = {
            'X': self.config.get('alpha_steps_per_mm', 80),
            'Y': self.config.get('beta_steps_per_mm', 80),
            'Z': self.config.get('gamma_steps_per_mm', 1068.7),
            'F': 60
        }
        self.init_coordinates()

    def isOpen(self):
        return self.is_open

    def close(self):
        self.is_open = False

    def open(self):
        self.is_open = True

    def parse_command(self, gcode):
        parse_arguments = re.compile(r"(([XYZABSPabF])(\-?[0-9\.]*))")
        parse_command = re.compile(r"([GM][0-9]*)")

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
        res = {"M119": self.endstop}
        return json.dumps(res) + '\nok'

    def process_set_position_command(self, arguments):
        for axis in 'XYZAB':
            if axis in arguments:
                target = self.coordinates['target']
                target[axis.lower()] = arguments[axis]
                current = self.coordinates['current']
                current[axis.lower()] = arguments[axis]

        return 'ok'

    def process_home_command(self, arguments):
        axis_list = arguments.keys()
        if len(arguments) == 0:
            axis_list = 'XYZAB'

        for axis in axis_list:
            arguments[axis.upper()] = 0.0
            self.endstop['min_' + axis.lower()] = 0

        self.process_set_position_command(arguments)

        return 'ok'

    def process_move_command(self, arguments):

        for axis in arguments.keys():
            if axis.lower() in 'xyzab' and not self.absolute:
                arguments[axis] += self.coordinates['target'][axis.lower()]

        self.process_set_position_command(arguments)

        axis_hit = None
        for axis in 'xyzab':
            if self.coordinates['target'][axis] < -3 and self.limit_switches:
                axis_hit = 'min_' + axis
                self.endstop[axis_hit] = 1
                break

        if 'F' in arguments:
            self.speed['head'] = arguments['F']

        for axis in 'ab':
            if axis in arguments:
                self.speed['plunger'][axis.lower()] = arguments[axis]

        if axis_hit and self.limit_switches:
            return 'ok\n{"limit":"' + axis_hit + '"}'
        return 'ok'

    def process_get_position(self, arguments):
        res = {}
        for axis in 'xyzab':
            res[axis.upper()] = self.coordinates['target'][axis]
            res[axis] = self.coordinates['current'][axis]
        res = {'M114': res}
        return 'ok {}'.format(json.dumps(res))

    def process_calm_down(self, arguments):
        return 'ok'

    def process_halt(self, arguments):
        e = 'ok Emergency Stop Requested - reset or M999 required to continue'
        return e

    def process_absolute_positioning(self, arguments):
        self.absolute = True
        return 'ok'

    def process_relative_positioning(self, arguments):
        self.absolute = False
        return 'ok'

    def process_version(self, arguments):
        return '{"version":' + self.version + '}'

    def process_reset(self, arguments):
        return 'Smoothie out. Peace. Rebooting in 5 seconds...'

    def process_config_get(self, arguments):
        folder = arguments[0]
        setting = arguments[1]
        if setting in self.config:
            value = self.config[setting]
            return '{0}: {1} is set to {2}'.format(folder, setting, value)
        else:
            return '{0}: {1} is not in config'.format(folder, setting)

    def process_config_set(self, arguments):
        folder = arguments[0]
        setting = arguments[1]
        value = arguments[2]
        self.config[setting] = value
        return '{0}: {1} has been set to {2}'.format(
            folder, setting, value)

    def process_steps_per_mm(self, arguments):
        for axis in arguments.keys():
            if axis.upper() in 'XYZ':
                self.steps_per_mm[axis.upper()] = arguments[axis]
        response = json.dumps({'M92': self.steps_per_mm})
        response += '\nok'
        return response

    def process_dwell_command(self, arguments):
        return 'ok'

    def process_nop(self, arguments):
        return 'ok'

    def process_disengage_feedback(self, arguments):
        return 'feedback disengaged\nok'

    def process_mosfet_state(self, arguments):
        return 'ok'

    def process_power_on(self, arguments):
        return 'ok'

    def process_power_off(self, arguments):
        return 'ok'

    def insert_response(self, message):
        messages = message.split('\n')
        self.responses = list(reversed(messages)) + self.responses

    def process_command(self, command):
        parsed_command = self.parse_command(command)

        command_mapping = {
            'G': self.process_nop,
            'M': self.process_nop,
            'G0': self.process_move_command,
            'G4': self.process_dwell_command,
            'M114': self.process_get_position,
            'G92': self.process_set_position_command,
            'G28': self.process_home_command,
            'M119': self.process_get_endstops,
            'M92': self.process_steps_per_mm,
            'M999': self.process_calm_down,
            'M112': self.process_halt,
            'M63': self.process_disengage_feedback,
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
            'config-set': self.process_config_set
        }
        if parsed_command:
            command = parsed_command['command']
            arguments = parsed_command['arguments']
            if command in command_mapping:
                command_func = command_mapping[command]
                log.debug(
                    'Processing {} calling {}'.format(
                        parsed_command,
                        command_func.__name__))
                message = command_func(arguments)
                self.insert_response(message)
            else:
                log.error(
                    'Command {} is not supported'.format(command))

    def write(self, data):
        if not self.isOpen():
            raise Exception('Virtual Smoothie no currently connected')
        if not isinstance(data, str):
            data = data.decode('utf-8')
        # make it async later
        self.process_command(data)

    def readline(self):
        if not self.isOpen():
            raise Exception('Virtual Smoothie no currently connected')
        if len(self.responses) > 0:
            return self.responses.pop().encode('utf-8')
        else:
            return b''
