from opentrons.drivers.smoothie_drivers.v3_0_0 import serial_communication
from os import environ
from threading import Event
from copy import copy


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
SMOOTHIE_BOARD_NAME = 'FT232R'


def _parse_axis_values(raw_axis_values):
    parsed_values = raw_axis_values.split(' ')
    parsed_values = parsed_values[2:]
    return {
        s.split(':')[0].upper(): float(s.split(':')[1])
        for s in parsed_values
    }


class SmoothieDriver_3_0_0:
    def __init__(self, config):
        self.run_flag = Event()
        self.run_flag.set()

        self._position = {}
        self.log = []
        self._update_position({axis: 0 for axis in AXES})
        self.simulating = True
        self._connection = None
        self._config = config
        self._power_settings = config.default_power

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

        self._connection = serial_communication.connect(
            device_name=SMOOTHIE_BOARD_NAME,
            baudrate=self._config.serial_speed
        )
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
    def power(self):
        return self._power_settings

    @property
    def speed(self):
        pass

    def set_speed(self, value):
        ''' set total movement speed in mm/second'''
        speed = value * SEC_PER_MIN
        command = GCODES['SET_SPEED'] + str(speed)
        self._send_command(command)

    def set_power(self, settings):
        ''' set total movement speed in mm/second
        settings
            Dict with axes as valies (e.g.: 'X', 'Y', 'Z', 'A', 'B', or 'C')
            and floating point number for setting (generally between 0.1 and 2)
        '''
        self._power_settings.update(settings)
        values = ['{}{}'.format(axis, value)
                  for axis, value in sorted(settings.items())]
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
        """
        Submit a GCODE command to the robot, followed by M400 to block until
        done. This method also ensures that any command on the B or C axis
        (the axis for plunger control) do current ramp-up and ramp-down, so
        that plunger motors rest at a low current to prevent burn-out.

        :param command: the GCODE to submit to the robot
        :param timeout: the time to wait before returning (indefinite wait if
            this is set to none
        """
        if self.simulating:
            pass
        else:
            # TODO (ben 20171117): modify all axes to dwell at low current
            moving_plunger = ('B' in command or 'C' in command) \
                and (GCODES['MOVE'] in command or GCODES['HOME'] in command)

            if moving_plunger:
                self.set_power({axis: self._config.plunger_current_high
                               for axis in 'BC'})

            command_line = command + ' M400'
            ret_code = serial_communication.write_and_return(
                command_line, self._connection, timeout)

            if moving_plunger:
                self.set_power({axis: self._config.plunger_current_low
                               for axis in 'BC'})

            return ret_code

    def _setup(self):
        self._reset_from_error()
        self._send_command(self._config.acceleration)
        self._send_command(self._config.current)
        self._send_command(self._config.max_speeds)
        self._send_command(self._config.steps_per_mm)
        self._send_command(GCODES['ABSOLUTE_COORDS'])
    # ----------- END Private functions ----------- #

    # ----------- Public interface ---------------- #
    def move(self, target, low_power_z=False):
        from numpy import isclose

        self.run_flag.wait()

        def valid_movement(coords, axis):
            return not (
                (axis in DISABLE_AXES) or
                (coords is None) or
                isclose(coords, self._position[axis])
            )

        coords = [axis + str(round(coords, GCODE_ROUNDING_PRECISION))
                  for axis, coords in sorted(target.items())
                  if valid_movement(coords, axis)]

        low_power_axes = [axis
                          for axis, _ in sorted(target.items())
                          if axis in 'ZA']
        prior_power = copy(self._power_settings)

        if low_power_z:
            new_power = {axis: 0.1
                         for axis in low_power_axes}
            self.set_power(new_power)

        if coords:
            command = GCODES['MOVE'] + ''.join(coords)
            self._send_command(command)
            self._update_position(target)

        if low_power_z:
            self.set_power(prior_power)

    def home(self, axis=AXES, disabled=DISABLE_AXES):

        self.run_flag.wait()

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

    def pause(self):
        self.run_flag.clear()

    def resume(self):
        self.run_flag.set()

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
            return self._position
        else:
            raise RuntimeError("Cant probe axis {}".format(axis))

    # TODO: Write GPIO low
    def kill(self):
        pass

    # ----------- END Public interface ------------ #
