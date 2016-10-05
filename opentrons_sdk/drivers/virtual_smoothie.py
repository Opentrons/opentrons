import re
import json


class VirtualSmoothie(object):
    def init_coordinates(self):
        self.coordinates = {
            'current': {},
            'target': {}
        }

        for axis in 'xyzab':
            self.coordinates['current'][axis] = 0.0
            self.coordinates['target'][axis] = 0.0

    def __init__(self, version, settings):
        self.settings = settings
        self.version = version
        self.responses = []
        self.absolute = True
        self.is_open = False
        self.speeds = {
            'head': 0.0,
            'plunger': {
                'a': 0.0,
                'b': 0.0
            }
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
        parse_command = re.compile(r"([GM][0-9]+)")

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
        return (r'{"M119":{"min_x":0,"min_y":0,'
                r'"min_z":0,"min_a":0,"min_b":0}}') + '\nok'

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

        self.process_set_position_command(arguments)

        return 'ok'

    def process_move_command(self, arguments):

        if not self.absolute:
            for axis in arguments.keys():
                arguments[axis] += self.coordinates['target'][axis.lower()]

        self.process_set_position_command(arguments)

        if 'F' in arguments:
            self.speed['head'] = arguments['F']

        for axis in 'ab':
            if axis in arguments:
                self.speed['plunger'][axis.lower()] = arguments[axis]

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

    def process_absolute_positioning(self, arguments):
        self.absolute = True
        return 'ok'

    def process_relative_positioning(self, arguments):
        self.absolute = False
        return 'ok'

    def process_version(self, arguments):
        return '{"version":' + self.version + '}'

    def process_config_get(self, arguments):
        folder = arguments[0]
        setting = arguments[1]
        if setting in self.settings:
            value = self.settings[setting]
            return '{0}: {1} is set to {2}'.format(folder, setting, value)
        else:
            return '{0}: {1} is not in config'.format(folder, setting)

    def process_config_set(self, arguments):
        folder = arguments[0]
        setting = arguments[1]
        value = arguments[2]
        self.settings[setting] = value
        return '{0}: {1} has been set to {2}'.format(
            folder, setting, value)

    def process_dwell_command(self, arguments):
        return 'ok'

    def insert_response(self, message):
        messages = message.split('\n')
        self.responses = list(reversed(messages)) + self.responses

    def process_command(self, command):
        parsed_command = self.parse_command(command)

        command_mapping = {
            'G0': self.process_move_command,
            'G4': self.process_dwell_command,
            'M114': self.process_get_position,
            'G92': self.process_set_position_command,
            'G28': self.process_home_command,
            'M119': self.process_get_endstops,
            'M999': self.process_calm_down,
            'G90': self.process_absolute_positioning,
            'G91': self.process_relative_positioning,
            'version': self.process_version,
            'config-get': self.process_config_get,
            'config-set': self.process_config_set
        }
        if parsed_command:
            command = parsed_command['command']
            arguments = parsed_command['arguments']
            if command in command_mapping:
                command_func = command_mapping[command]
                message = command_func(arguments)
                self.insert_response(message)
            else:
                print('Command {} is not supported'.format(command))
                self.insert_response('ok')

    def write(self, data):
        command = str(data)
        # make async later
        self.process_command(command)

    def readline(self):
        if len(self.responses) > 0:
            return self.responses.pop()
        else:
            return ''
