from opentrons.drivers.smoothie_drivers.v3_0_0 import serial_communication
from os import environ


'''
- Driver is responsible for providing an interface for motion control
- Driver is the only system component that knows about GCODES or how smoothie
  communications

- Driver is NOT responsible interpreting the motions in any way or
  knowing anything about what the axes are used for
'''

# DEFAULT_STEPS_PER_MM = 'M92 X80 Y80 Z400 A400 B767.38 C767.38'  # Avagdro

DEFAULT_STEPS_PER_MM = 'M92 X160 Y160 Z800 A800 B767.38 C767.38'  # Ibn

DEFAULT_MAX_AXIS_SPEEDS = 'M203.1 X300 Y200 Z50 A50 B8 C8'
DEFAULT_ACCELERATION = 'M204 S1000 X4000 Y3000 Z2000 A2000 B3000 C3000'
DEFAULT_CURRENT_CONTROL = 'M907 X1.0 Y1.2 Z0.9 A0.9 B0.6 C0.6'


MOVEMENT_ERROR_MARGIN = 1/160  # Largest movement in mm for any step

AXES_SAFE_TO_HOME = 'XZABC'  # Y cannot be homed without homing all
AXES = 'XYZABC'

SEC_PER_MIN = 60
POSITION_THRESH = .25

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

homed_positions = {
    'X': 394, 'Y': 344, 'Z': 227, 'A': 227, 'B': 18.9997, 'C': 18.9997
}


def _parse_axis_values(raw_axis_values):
    parsed_values = raw_axis_values.split(' ')
    parsed_values = parsed_values[2:]
    position = {
        s.split(':')[0].lower(): float(s.split(':')[1])
        for s in parsed_values
    }
    return position


class SmoothieDriver_3_0_0:

    def __init__(self):
        self._position = {}
        self.log = []
        self._update_position({axis: 0 for axis in AXES.lower()})
        self.simulating = True

    def _update_position(self, target):
        self._position.update({
            axis.lower(): value for axis, value
            in target.items()
            if value is not None
        })

        self.log += [self._position.copy()]

    def update_position(self, is_retry=False):
        if self.simulating:
            updated_position = self._position
        else:
            try:
                position_response = \
                    self._send_command(GCODES['CURRENT_POSITION'])
                updated_position = \
                    _parse_axis_values(position_response)
                # TODO jmg 10/27: log warning rather than an exception
            except TypeError as e:
                if is_retry:
                    raise e
                else:
                    self.update_position(is_retry=True)

        self._update_position(updated_position)

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
        return self._position

    def get_switch_state(self):
        '''Returns the state of all SmoothieBoard limit switches'''
        return self._send_command(GCODES['SWITCH_STATUS'])

    def set_speed(self, value):
        ''' set total movement speed in mm/second'''
        speed = value * SEC_PER_MIN
        command = GCODES['SET_SPEED'] + str(speed)
        self._send_command(command)

    def set_power(self, axis, value):
        ''' set total movement speed in mm/second'''
        command = '{}{}{}'.format(
            GCODES['SET_POWER'], axis.upper(), str(value)
        )
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
        else:
            return serial_communication.write_and_return(
                command_line, self.connection, timeout)

    def _setup(self):
        self._reset_from_error()
        self._send_command(DEFAULT_ACCELERATION)
        self._send_command(DEFAULT_CURRENT_CONTROL)
        self._send_command(DEFAULT_MAX_AXIS_SPEEDS)
        self._send_command(DEFAULT_STEPS_PER_MM)
        self._send_command(GCODES['ABSOLUTE_COORDS'])
        self.home()

    def _home_all(self):
        command = GCODES['HOME'] + 'ZA ' \
                  + GCODES['HOME'] + 'XBC ' \
                  + GCODES['HOME'] + 'Y'
        self._send_command(command, timeout=30)

    # ----------- END Private functions ----------- #

    # ----------- Public interface ---------------- #
    def move(self, x=None, y=None, z=None, a=None, b=None, c=None):
        target_position = {'X': x, 'Y': y, 'Z': z, 'A': a, 'B': b, 'C': c}
        coords = [axis + str(coords)
                  for axis, coords in target_position.items()
                  if coords is not None]
        command = GCODES['MOVE'] + ''.join(coords)

        self._send_command(command)

        self._update_position({
            axis: value
            for axis, value in zip('xyzabc', [x, y, z, a, b, c])
        })

    def home(self, axis=None):
        if not axis:
            self._home_all()
            self._update_position(homed_positions)

        else:
            axes_to_home = [
                ax for ax in axis.upper()
                if ax in AXES_SAFE_TO_HOME
            ]
            if axes_to_home:
                command = GCODES['HOME'] + ''.join(axes_to_home)
                self._send_command(command)
                self._update_position({
                    axis: homed_positions[axis] for axis in axes_to_home
                })

            else:
                raise RuntimeError('Cannot home axis: {}'.format(axis))

    def delay(self, seconds):
        seconds = int(seconds)
        milliseconds = (seconds % 1.0) * 1000
        command = \
            GCODES['DWELL'] + 'S' + str(seconds) + 'P' + str(milliseconds)
        self._send_command(command)

    def probe_axis(self, axis, probing_distance):
        if axis.upper() in AXES:
            command = GCODES['PROBE'] + axis.upper() + str(probing_distance)
            self._send_command(command=command, timeout=30)
            self.update_position()
            position_return = self.position[axis]
            return position_return
        else:
            raise RuntimeError("Cant probe axes {}".format(axis))

    # TODO: Write GPIO low
    def kill(self):
        pass

    # ----------- END Public interface ------------ #
