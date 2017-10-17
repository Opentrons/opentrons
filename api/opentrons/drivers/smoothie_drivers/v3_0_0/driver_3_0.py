from opentrons.drivers.smoothie_drivers.v3_0_0 import serial_communication
from os import environ

'''
- Driver is responsible for providing an interface for motion control
- Driver is the only system component that knows about GCODES or how smoothie
  communications

- Driver is NOT responsible interpreting the motions in any way or knowing anything
  about what the axes are used for
'''

DEFAULT_STEPS_PER_MM = 'M92 X80 Y80 Z800 A800 B767.38 C767.38'
DEFAULT_MAX_AXIS_SPEEDS = 'M203.1 X500 Y300 Z50 A50 B40 C40'
DEFAULT_ACCELERATION = 'M204 S1000 X4000 Y3000 Z2000 A2000 B1000 C1000'
DEFAULT_CURRENT_CONTROL = 'M907 X1.0 Y1.2 Z0.9 A0.9 B0.25 C0.25'

AXES_SAFE_TO_HOME = 'XZABC' # Y cannot be homed without homing all
AXES = 'XYZABC'

SEC_PER_MIN = 60

GCODES = {'HOME': 'G28.2',
          'MOVE': 'G0',
          'DWELL': 'G4',
          'CURRENT_POSITION': 'M114.2',
          'LIMIT_SWITCH_STATUS': 'M119',
          'PROBE': 'G38.2',
          'ABSOLUTE_COORDS': 'G90',
          'RESET_FROM_ERROR': 'M999',
          'SET_SPEED': 'G0F',
          'SET_POWER': 'M907'}


def _parse_axis_values(raw_axis_values):
    parsed_values = raw_axis_values.split(' ')
    parsed_values = parsed_values[2:]
    dict = {
        s.split(':')[0].lower(): float(s.split(':')[1])
        for s in parsed_values
    }
    return dict


class SmoothieDriver_3_0_0:

    def __init__(self):
        self._position = {}
        self.log = []
        self._update_position({axis: 0 for axis in AXES})
        self.simulating = True

    def _update_position(self, target):
        self._position.update({
            axis: value for axis, value in target.items() if value is not None
        })
        self.log += [self._position.copy()]

    # FIXME (JG 9/28/17): Should have a more thought out
    # way of simulating vs really running
    def connect(self):
        self.simulating = False

        if environ.get('ENABLE_VIRTUAL_SMOOTHIE', '').lower() == 'true':
            self.simulating = True
            return

        self.connection = serial_communication.connect()

        self._setup()

    def disconnect(self):
        self.simulating = True

    @property
    def position(self):
        if self.simulating:
            res = {k.lower(): v for k, v in self._position.items()}
            return res
        try:
            position_response = self._send_command(GCODES['CURRENT_POSITION'])
            parsed_position = _parse_axis_values(position_response)
        except TypeError:
            position_response = self._send_command(GCODES['CURRENT_POSITION']) #Recovery attempt
            parsed_position = _parse_axis_values(position_response)


        return parsed_position

    @property
    def switch_state(self):
        '''Returns the state of all SmoothieBoard limit switches'''
        return self._send_command(GCODES['SWITCH_STATUS'])

    @property
    def power(self):
        pass

    def set_power(self, power_dict):
        pass

    @property
    def speed(self):
        pass

    def set_speed(self, value):
        ''' set total movement speed in mm/second'''
        speed = value * SEC_PER_MIN
        command = GCODES['SET_SPEED'] + str(speed)
        self._send_command(command)

    def set_power(self, axis, value):
        ''' set total movement speed in mm/second'''
        command = '{}{}{}'.format(GCODES['SET_POWER'], axis.upper(), str(value))
        self._send_command(command)

    # ----------- Private functions --------------- #

    def _reset_from_error(self):
        self._send_command(GCODES['RESET_FROM_ERROR'])

    # TODO: Write GPIO low
    def _reboot(self):
        self._setup()

    # Potential place for command optimization (buffering, flushing, etc)
    def _send_command(self, command, timeout=None):
        command_line = command + ' M400'

        if self.simulating:
            pass
            # print('[DRIVER - SIMULATING] sending command {}'.format(repr(command_line)))
        else:
            # print('[DRIVER] sending command {}'.format(repr(command_line)))
            return serial_communication.write_and_return(
                command_line, self.connection, timeout)

    def _setup(self):
        self._reset_from_error()
        self._send_command(DEFAULT_ACCELERATION)
        self._send_command(DEFAULT_CURRENT_CONTROL)
        self._send_command(DEFAULT_MAX_AXIS_SPEEDS)
        self._send_command(DEFAULT_STEPS_PER_MM)
        self._send_command(GCODES['ABSOLUTE_COORDS'])

    def _home_all(self):
        command = GCODES['HOME'] + 'Y'
        self._send_command(command, timeout=30)

    # ----------- END Private functions ----------- #

    # ----------- Public interface ---------------- #
    def move(self, x=None, y=None, z=None, a=None, b=None, c=None):
        if self.simulating:
            self._update_position({
                axis: value
                for axis, value in zip('XYZABC', [x, y, z, a, b, c])
            })

        target_position = {'X': x, 'Y': y, 'Z': z, 'A': a, 'B': b, 'C': c}
        coords = [axis + str(coords)
                  for axis, coords in target_position.items()
                  if coords is not None]
        command = GCODES['MOVE'] + ''.join(coords)
        self._send_command(command)

    def home(self, axis=None):
        homed_positions = {'X': 400, 'Y': -282, 'Z': 227, 'A': 227, 'B': 20, 'C': 20}
        if not axis:
            if self.simulating:
                self._update_position(homed_positions)
            self._home_all()
        else:
            axes_to_home = [ax for ax in axis.upper() if ax in AXES_SAFE_TO_HOME]
            if axes_to_home:
                if self.simulating:
                    pos = {axis: homed_positions[axis] for axis in axes_to_home}
                    self._update_position(pos)
                command = GCODES['HOME'] + ''.join(axes_to_home)
                self._send_command(command)
            else:
                raise RuntimeError('Cannot home axis: {}'.format(axis))

    def delay(self, seconds):
        seconds = int(seconds)
        milliseconds = (seconds % 1.0) * 1000
        command = GCODES['DWELL'] + 'S' + str(seconds) + 'P' + str(milliseconds)
        self._send_command(command)

    def probe_axis(self, axis, probing_distance):
        if axis.upper() in AXES:
            command = GCODES['PROBE'] + axis.upper() + str(probing_distance)
            self._send_command(command=command, timeout=30)
            position_return = self.position[axis]
            return position_return
        else:
            raise RuntimeError("Cant probe axes {}".format(axis))

    #TODO: Write GPIO low
    def kill(self):
        pass

    # ----------- END Public interface ------------ #
