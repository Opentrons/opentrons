from opentrons.drivers.smoothie_drivers.v3_0_0 import serial_communication
from os import environ
from opentrons.robot.robot_configs import (
    config, PLUNGER_CURRENT_LOW, PLUNGER_CURRENT_HIGH
)


'''
- Driver is responsible for providing an interface for motion control
- Driver is the only system component that knows about GCODES or how smoothie
  communications

- Driver is NOT responsible interpreting the motions in any way
  or knowing anything about what the axes are used for
'''

# TODO (artyom, ben 20171026): move to config
HOMED_POSITION = {
    'X': 394,
    'Y': 344,
    'Z': 227,
    'A': 227,
    'B': 18.9997,
    'C': 18.9997
}

HOME_SEQUENCE = ['ZABC', 'X', 'Y']
AXES = ''.join(HOME_SEQUENCE)
# Ignore these axis when sending move or home command
DISABLE_AXES = ''

MOVEMENT_ERROR_MARGIN = 1/160  # Largest movement in mm for any step
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
          'SET_CURRENT': 'M907'}

# Number of digits after the decimal point for coordinates being sent
# to Smoothie
GCODE_ROUNDING_PRECISION = 3


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
        self._update_position({axis: 0 for axis in AXES})
        self.simulating = True
        self._connection = None

    def _update_position(self, target):
        self._position.update({
            axis: value
            for axis, value in target.items() if value is not None
        })

        self.log += [self._position.copy()]

    def update_position(self, default=None, is_retry=False):
        if default is None:
            default = self._position

        if self.simulating:
            updated_position = self._position.copy()
            updated_position.update(**default)

        if not self.simulating:
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
                    self.update_position(default=default, is_retry=True)

        self._update_position(updated_position)

    # FIXME (JG 9/28/17): Should have a more thought out
    # way of simulating vs really running
    def connect(self):
        self.simulating = False
        if environ.get('ENABLE_VIRTUAL_SMOOTHIE', '').lower() == 'true':
            self.simulating = True
            return

        self._connection = serial_communication.connect()
        self._setup()

    def disconnect(self):
        self.simulating = True

    @property
    def position(self):
        """
        Instead of sending M114.2 we are storing target values in
        self._position since movement and home commands are blocking and
        assumed to go the correct place.

        Cases where Smoothie would not be in the correct place (such as if a
        belt slips) would not be corrected by getting position with M114.2
        because Smoothie would also not be aware of slippage.
        """
        return {k.upper(): v for k, v in self._position.items()}

    @property
    def switch_state(self):
        '''Returns the state of all SmoothieBoard limit switches'''
        return self._send_command(GCODES['LIMIT_SWITCH_STATUS'])

    @property
    def current(self):
        pass

    @property
    def speed(self):
        pass

    def set_speed(self, value):
        ''' set total movement speed in mm/second'''
        speed = value * SEC_PER_MIN
        command = GCODES['SET_SPEED'] + str(speed)
        self._send_command(command)

    def set_current(self, axes, value):
        ''' set total movement speed in mm/second'''
        values = ['{}{}'.format(axis, value) for axis in axes]
        command = '{} {}'.format(
            GCODES['SET_CURRENT'],
            ' '.join(values)
        )
        self._send_command(command)
        self.delay(0.05)

    # ----------- Private functions --------------- #

    def _reset_from_error(self):
        self._send_command(GCODES['RESET_FROM_ERROR'])

    # TODO: Write GPIO low
    def _reboot(self):
        self._setup()

    # Potential place for command optimization (buffering, flushing, etc)
    def _send_command(self, command, timeout=None):
        if self.simulating:
            pass
        else:
            moving_plunger = ('B' in command or 'C' in command) \
                and (GCODES['MOVE'] in command or GCODES['HOME'] in command)

            if moving_plunger:
                self.set_current('BC', PLUNGER_CURRENT_HIGH)

            command_line = command + ' M400'
            ret_code = serial_communication.write_and_return(
                command_line, self._connection, timeout)

            if moving_plunger:
                self.set_current('BC', PLUNGER_CURRENT_LOW)

            return ret_code

    def _setup(self):
        self._reset_from_error()
        self._send_command(config.acceleration)
        self._send_command(config.current)
        self._send_command(config.max_speeds)
        self._send_command(config.steps_per_mm)
        self._send_command(GCODES['ABSOLUTE_COORDS'])
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

        coords = [axis + str(round(coords, GCODE_ROUNDING_PRECISION))
                  for axis, coords in target.items()
                  if valid_movement(coords, axis)]

        if coords:
            command = GCODES['MOVE'] + ''.join(coords)
            self._send_command(command)
            self._update_position(target)

    def home(self, axis=AXES, disabled=DISABLE_AXES):
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
        home_sequence = list(filter(
            None,
            [
                ''.join(set(group) & set(axis) - set(disabled))
                for group in HOME_SEQUENCE
            ]))

        command = ' '.join([GCODES['HOME'] + axes for axes in home_sequence])
        self._send_command(command, timeout=30)

        position = HOMED_POSITION

        # Only update axes that have been selected for homing
        homed = {
            ax: position[ax]
            for ax in ''.join(home_sequence)
        }

        self.update_position(default=homed)

        return homed

    def delay(self, seconds):
        # per http://smoothieware.org/supported-g-codes:
        # In grbl mode P is float seconds to comply with gcode standards
        command = '{code}P{seconds}'.format(
            code=GCODES['DWELL'],
            seconds=seconds
        )
        self._send_command(command)

    def probe_axis(self, axis, probing_distance):
        if axis.upper() in AXES:
            command = GCODES['PROBE'] + axis.upper() + str(probing_distance)
            self._send_command(command=command, timeout=30)
            self.update_position(self._position)
            return self._position[axis.upper()]
        else:
            raise RuntimeError("Cant probe axis {}".format(axis))

    # TODO: Write GPIO low
    def kill(self):
        pass

    # ----------- END Public interface ------------ #
