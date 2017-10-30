from opentrons.drivers.smoothie_drivers.v3_0_0 import serial_communication
from os import environ
from numpy import insert, add, array
from numpy.linalg import inv


'''
- Driver is responsible for providing an interface for motion control
- Driver is the only system component that knows about GCODES or how smoothie
  communications

- Driver is NOT responsible interpreting the motions in any way
  or knowing anything about what the axes are used for
'''

# Ignore these axis when sending move or home command
# TODO(artyom, ben 20171026): move to config
DEFAULT_STEPS_PER_MM = 'M92 X80 Y80 Z400 A400 B767.38 C767.38'
DEFAULT_MAX_AXIS_SPEEDS = 'M203.1 X900 Y550 Z140 A140 B40 C40'
DEFAULT_ACCELERATION = 'M204 S1000 X4000 Y3000 Z2000 A2000 B1000 C1000'
DEFAULT_CURRENT_CONTROL = 'M907 X1.0 Y1.2 Z0.9 A0.9 B0.25 C0.25'
HOMING_OFFSETS = 'M206 X0'

# TODO (artyom, ben 20171026): move to config
HOMED_POSITIONS = {'X': 394, 'Y': 344, 'Z': 227, 'A': 227, 'B': 20, 'C': 20}
HOME_SEQUENCE = ['ZABC', 'X', 'Y']
AXES = ''.join(HOME_SEQUENCE)
DISABLE_AXES = 'BC'

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
    return {
        s.split(':')[0].upper(): float(s.split(':')[1])
        for s in parsed_values
    }


class SmoothieDriver_3_0_0:
    def __init__(self):
        self._position = {}
        self.log = []
        self._update_position({axis: 0 for axis in AXES.lower()})
        self.simulating = True

    def _update_position(self, target):
        self._position.update({
            axis.upper(): value
            for axis, value in target.items() if value is not None
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
        """
        Instead of sending M114.2 we are storing target values
        in self._position since movement
        and home commands are blocking and assumed to go the correct place.
        Cases where Smoothie would not be in the correct place (such as if a
        belt slips) would not be corrected by getting position with M114.2
        because Smoothie would also not be aware of slippage.
        """
        res = {k.upper(): v for k, v in self._position.items()}
        return res

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

    def set_speed(self, values):
        command = GCODES['SET_SPEED'] + ' ' + ' '.join([
            '{axis}{value}'.format(axis=axis.upper(), value=value)
            for axis, value in values.items()
        ])
        self._send_command(command)

    def set_power(self, axis, value):
        ''' set total movement speed in mm/second'''
        command = '{}{}{}'.format(
            GCODES['SET_POWER'],
            axis.upper(),
            value
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

        if not self.simulating:
            return serial_communication.write_and_return(
                command_line, self.connection, timeout)

    def _setup(self):
        self._reset_from_error()
        self._send_command(DEFAULT_ACCELERATION)
        self._send_command(DEFAULT_CURRENT_CONTROL)
        self._send_command(DEFAULT_MAX_AXIS_SPEEDS)
        self._send_command(DEFAULT_STEPS_PER_MM)
        self._send_command(HOMING_OFFSETS)
        self._send_command(GCODES['ABSOLUTE_COORDS'])
        self.home()

    # ----------- END Private functions ----------- #

    # ----------- Public interface ---------------- #
    def move(self, target):
        from numpy import isclose

        def valid_movement(coords, axis):
            return not (
                (axis in DISABLE_AXES) or
                (coords is None) or
                isclose(coords, self._position[axis])
            )

        coords = [axis + str(coords)
                  for axis, coords in target.items()
                  if valid_movement(coords, axis)]

        if coords:
            command = GCODES['MOVE'] + ''.join(coords)
            self._send_command(command)
            self._update_position(target)

    def home(self, axis=AXES):
        axis = axis.upper()

        # If Y is requested make sure we home X first
        if 'Y' in axis:
            axis += 'X'

        # If horizontal movement is requested, ensure we raise the instruments
        if 'X' in axis:
            axis += 'ZA'

        # These two additions are safe even if they duplicate requested axes
        # because of the use of set operations below, which will de-duplicate
        # characters from the resulting string

        # HOME_SEQUENCE defines a pattern for homing, specifically that the
        # ZABC axes should be homed first so that horizontal movement doesn't
        # happen with the pipette down (which could bump into things). Then
        # the X axis is homed, which has to happen before Y. Finally Y can be
        # homed. This variable will contain the sequence just explained, but
        # filters out unrequested axes using set intersection (&) and then
        # filters out disabled axes using set difference (-)
        home_sequence = filter(
            None,
            [
                ''.join(set(group) & set(axis) - set(DISABLE_AXES))
                for group in HOME_SEQUENCE
            ])

        command = ' '.join([GCODES['HOME'] + axes for axes in home_sequence])
        self._send_command(command, timeout=30)

        position = HOMED_POSITIONS

        if not self.simulating:
            position = _parse_axis_values(
                self._send_command(GCODES['CURRENT_POSITION'])
            )
            self._update_position(position)

        homed = {
            axis: position[axis]
            for axis in ''.join(home_sequence)
        }

        # Only update axes that have been selected for homing
        self._update_position(homed)

        return homed

    def delay(self, sec):
        sec = float(sec)
        msec = (sec - int(sec)) * 1000
        command = '{code}S{sec}P{msec}'.format(
            code=GCODES['DWELL'],
            sec=sec,
            msec=msec
        )
        self._send_command(command)

    def probe_axis(self, axis, probing_distance):
        if axis.upper() in AXES:
            command = GCODES['PROBE'] + axis.upper() + str(probing_distance)
            self._send_command(command=command, timeout=30)
            return self._position[axis.upper()]
        else:
            raise RuntimeError("Cant probe axis {}".format(axis))

    # TODO: Write GPIO low
    def kill(self):
        pass

    # ----------- END Public interface ------------ #
