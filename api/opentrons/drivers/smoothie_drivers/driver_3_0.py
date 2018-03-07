from os import environ
import logging
from time import sleep
from threading import Event
from typing import Dict

from opentrons.drivers.smoothie_drivers import serial_communication
from opentrons.drivers.rpi_drivers import gpio
'''
- Driver is responsible for providing an interface for motion control
- Driver is the only system component that knows about GCODES or how smoothie
  communications

- Driver is NOT responsible interpreting the motions in any way
  or knowing anything about what the axes are used for
'''

log = logging.getLogger(__name__)

ERROR_KEYWORD = 'error'
ALARM_KEYWORD = 'ALARM'

# TODO (artyom, ben 20171026): move to config
HOMED_POSITION = {
    'X': 418,
    'Y': 353,
    'Z': 218,
    'A': 218,
    'B': 19,
    'C': 19
}

PLUNGER_BACKLASH_MM = 0.3
LOW_CURRENT_Z_SPEED = 30
CURRENT_CHANGE_DELAY = 0.05

Y_SWITCH_BACK_OFF_MM = 20
Y_BACKOFF_LOW_CURRENT = 0.8
Y_BACKOFF_SLOW_SPEED = 50
Y_RETRACT_SPEED = 8
Y_RETRACT_DISTANCE = 3

DEFAULT_AXES_SPEED = 400

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
          'RELATIVE_COORDS': 'G91',
          'RESET_FROM_ERROR': 'M999',
          'PUSH_SPEED': 'M120',
          'POP_SPEED': 'M121',
          'SET_SPEED': 'G0F',
          'READ_INSTRUMENT_ID': 'M369',
          'WRITE_INSTRUMENT_ID': 'M370',
          'READ_INSTRUMENT_MODEL': 'M371',
          'WRITE_INSTRUMENT_MODEL': 'M372',
          'SET_MAX_SPEED': 'M203.1',
          'SET_CURRENT': 'M907'}

# Number of digits after the decimal point for coordinates being sent
# to Smoothie
GCODE_ROUNDING_PRECISION = 3

PIPETTE_DATA_LENGTH = 32


def _parse_axis_values(raw_axis_values):
    parsed_values = raw_axis_values.strip().split(' ')
    parsed_values = parsed_values[2:]
    if len(parsed_values) != 6:
        raise ParseError('Unexpected response from Smoothieware: {}'.format(
            raw_axis_values))
    return {
        s.split(':')[0].upper(): round(
            float(s.split(':')[1]),
            GCODE_ROUNDING_PRECISION)
        for s in parsed_values
    }


def _parse_instrument_data(smoothie_response):
    items = smoothie_response.split('\n')[0].strip().split(':')
    mount = items[0]
    # data received from Smoothieware is stringified HEX values
    # because of how Smoothieware handles GCODE messages
    data = bytearray.fromhex(items[1])
    return {mount: data}


def _byte_array_to_ascii_string(byte_array):
    # remove trailing null characters
    for c in [b'\x00', b'\xFF']:
        if c in byte_array:
            byte_array = byte_array[:byte_array.index(c)]
    return byte_array.decode()


def _byte_array_to_hex_string(byte_array):
    # data must be sent as stringified HEX values
    # because of how Smoothieware parses GCODE messages
    return ''.join('%02x' % b for b in byte_array)


def _parse_switch_values(raw_switch_values):
    # probe has a space after it's ":" for some reasone
    if 'Probe: ' in raw_switch_values:
        raw_switch_values = raw_switch_values.replace('Probe: ', 'Probe:')
    parsed_values = raw_switch_values.strip().split(' ')
    return {
        s.split(':')[0].split('_')[0]: bool(int(s.split(':')[1]))
        for s in parsed_values
        if any([n in s for n in ['max', 'Probe']])
    }


class SmoothieError(Exception):
    pass


class ParseError(Exception):
    pass


class SmoothieDriver_3_0_0:
    def __init__(self, config):
        self.run_flag = Event()
        self.run_flag.set()

        self._position = HOMED_POSITION.copy()
        self.log = []
        self._update_position({axis: 0 for axis in AXES})
        self.simulating = True
        self._connection = None
        self._config = config
        self._saved_current_settings = config.default_current.copy()
        self._current_settings = self._saved_current_settings.copy()
        self._max_speed_settings = config.default_max_speed.copy()
        self._saved_max_speed_settings = self._max_speed_settings.copy()

        self._combined_speed = float(DEFAULT_AXES_SPEED)
        self._saved_axes_speed = float(self._combined_speed)

        self._homed_position = HOMED_POSITION.copy()

    @property
    def homed_position(self):
        return self._homed_position.copy()

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
        else:
            try:
                position_response = \
                    self._send_command(GCODES['CURRENT_POSITION'])
                updated_position = \
                    _parse_axis_values(position_response)
                # TODO jmg 10/27: log warning rather than an exception
            except (TypeError, ParseError) as e:
                if is_retry:
                    raise e
                else:
                    self.update_position(default=default, is_retry=True)

        self._update_position(updated_position)

    def _read_from_pipette(self, gcode, mount):
        res = self._send_command(gcode + mount)
        try:
            res = _parse_instrument_data(res)
            assert mount in res
            assert len(res[mount]) == PIPETTE_DATA_LENGTH
            return _byte_array_to_ascii_string(res[mount])
        except Exception as e:
            return None

    def _write_to_pipette(self, gcode, mount, data_string):
        if not isinstance(data_string, str):
            raise ValueError(
                'Expected {0}, not {1}'.format(str, type(data_string)))
        byte_string = _byte_array_to_hex_string(
            bytearray(data_string.encode()))
        command = gcode + mount + byte_string
        self._send_command(command)

    def _read_pipette_id(self, mount):
        return self._read_from_pipette(
            GCODES['READ_INSTRUMENT_ID'], mount)

    def _read_pipette_model(self, mount):
        return self._read_from_pipette(
            GCODES['READ_INSTRUMENT_MODEL'], mount)

    def _write_pipette_id(self, mount, data_string):
        self._write_to_pipette(
            GCODES['WRITE_INSTRUMENT_ID'], mount, data_string)

    def _write_pipette_model(self, mount, data_string):
        self._write_to_pipette(
            GCODES['WRITE_INSTRUMENT_MODEL'], mount, data_string)

    # FIXME (JG 9/28/17): Should have a more thought out
    # way of simulating vs really running
    def connect(self):
        self.simulating = False
        if environ.get('ENABLE_VIRTUAL_SMOOTHIE', '').lower() == 'true':
            self.simulating = True
            return

        smoothie_id = environ.get('OT_SMOOTHIE_ID', 'FT232R')
        self._connection = serial_communication.connect(
            device_name=smoothie_id,
            baudrate=self._config.serial_speed
        )
        self._setup()

    def disconnect(self):
        self.simulating = True

    def get_fw_version(self):
        version = 'Virtual Smoothie'
        if not self.simulating:
            version = serial_communication.write_and_return(
                "version\n", self._connection).split('\r')[0]
        return version

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
        res = self._send_command(GCODES['LIMIT_SWITCH_STATUS'])
        return _parse_switch_values(res)

    @property
    def current(self):
        return self._current_settings

    @property
    def speed(self):
        pass

    def set_speed(self, value):
        ''' set total axes movement speed in mm/second'''
        self._combined_speed = float(value)
        speed_per_min = int(self._combined_speed * SEC_PER_MIN)
        command = GCODES['SET_SPEED'] + str(speed_per_min)
        self._send_command(command)

    def push_speed(self):
        self._saved_axes_speed = float(self._combined_speed)

    def pop_speed(self):
        self.set_speed(self._saved_axes_speed)

    def set_axis_max_speed(self, settings):
        '''
        Sets the maximum speed (mm/sec) that a given axis will move

        settings
            Dict with axes as valies (e.g.: 'X', 'Y', 'Z', 'A', 'B', or 'C')
            and floating point number for millimeters per second (mm/sec)
        '''
        self._max_speed_settings.update(settings)
        values = ['{}{}'.format(axis.upper(), value)
                  for axis, value in sorted(settings.items())]
        command = '{} {}'.format(
            GCODES['SET_MAX_SPEED'],
            ' '.join(values)
        )
        self._send_command(command)

    def push_axis_max_speed(self):
        self._saved_max_speed_settings = self._max_speed_settings.copy()

    def pop_axis_max_speed(self):
        self.set_axis_max_speed(self._saved_max_speed_settings)

    def set_current(self, settings):
        '''
        Sets the current in mA by axis.

        settings
            Dict with axes as valies (e.g.: 'X', 'Y', 'Z', 'A', 'B', or 'C')
            and floating point number for current (generally between 0.1 and 2)
        '''
        self._current_settings.update(settings)
        values = ['{}{}'.format(axis, value)
                  for axis, value in sorted(settings.items())]
        command = '{} {}'.format(
            GCODES['SET_CURRENT'],
            ' '.join(values)
        )
        self._send_command(command)
        self.delay(CURRENT_CHANGE_DELAY)

    def push_current(self):
        self._saved_current_settings.update(self._current_settings)

    def pop_current(self):
        self.set_current(self._saved_current_settings)

    # ----------- Private functions --------------- #

    def _reset_from_error(self):
        self._send_command(GCODES['RESET_FROM_ERROR'])

    def _hard_reset_smoothie(self):
        log.debug('Halting Smoothie (simulating: {})'.format(self.simulating))
        if self.simulating:
            pass
        else:
            gpio.set_low(gpio.OUTPUT_PINS['HALT'])
            sleep(0.1)
            gpio.set_high(gpio.OUTPUT_PINS['HALT'])

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
            moving_plungers = []
            if GCODES['MOVE'] in command or GCODES['HOME'] in command:
                moving_plungers = [ax for ax in 'BC' if ax in command]

            if moving_plungers:
                self.set_current({
                    axis: self._config.plunger_current_high
                    for axis in moving_plungers
                })

            command_line = command + ' M400'
            ret_code = serial_communication.write_and_return(
                command_line, self._connection, timeout)

            # Smoothieware returns error state if a switch was hit while moving
            smoothie_error = False
            if ERROR_KEYWORD in ret_code or ALARM_KEYWORD in ret_code:
                self._reset_from_error()
                smoothie_error = True

            if moving_plungers:
                self.set_current({
                    axis: self._config.plunger_current_low
                    for axis in moving_plungers
                })

            # ensure we lower plunger currents before raising an exception
            if smoothie_error:
                raise SmoothieError(ret_code)

            return ret_code

    def _home_x(self):
        # move the gantry forward on Y axis with low power
        self.push_current()
        self.push_speed()
        self.set_current({'Y': Y_BACKOFF_LOW_CURRENT})
        self.set_speed(Y_BACKOFF_SLOW_SPEED)

        # move away from the Y endstop switch
        target_coord = {'Y': self.position['Y'] - Y_SWITCH_BACK_OFF_MM}
        self.move(target_coord)
        self.pop_current()
        self.pop_speed()

        # now it is safe to home the X axis
        self._send_command(GCODES['HOME'] + 'X')

    def _home_y(self):
        # home the Y at normal speed (fast)
        self._send_command(GCODES['HOME'] + 'Y')

        # slow the maximum allowed speed on Y axis
        self.push_axis_max_speed()
        self.set_axis_max_speed({'Y': Y_RETRACT_SPEED})

        # retract, then home, then retract again
        relative_retract_command = '{0} {1}Y{2} {3}'.format(
            GCODES['RELATIVE_COORDS'],  # set to relative coordinate system
            GCODES['MOVE'],  # move 3 millimeters away from switch
            str(-Y_RETRACT_DISTANCE),
            GCODES['ABSOLUTE_COORDS']  # set back to absolute coordinate system
        )
        self._send_command(relative_retract_command)
        self._send_command(GCODES['HOME'] + 'Y')
        self._send_command(relative_retract_command)

        # bring max speeds back to normal
        self.pop_axis_max_speed()

    def _setup(self):
        self._reset_from_error()
        self._send_command(self._config.acceleration)
        self._send_command(self._config.current)
        self._send_command(self._config.steps_per_mm)
        self._send_command(GCODES['ABSOLUTE_COORDS'])
        self.update_position(default=self.homed_position)
        self.pop_axis_max_speed()
        self.pop_speed()
    # ----------- END Private functions ----------- #

    # ----------- Public interface ---------------- #
    def move(self, target):
        from numpy import isclose

        self.run_flag.wait()

        def valid_movement(coords, axis):
            return not (
                (axis in DISABLE_AXES) or
                (coords is None) or
                isclose(coords, self.position[axis])
            )

        def create_coords_list(coords_dict):
            return [
                axis + str(round(coords, GCODE_ROUNDING_PRECISION))
                for axis, coords in sorted(coords_dict.items())
                if valid_movement(coords, axis)
            ]

        backlash_target = target.copy()
        backlash_target.update({
            axis: value + PLUNGER_BACKLASH_MM
            for axis, value in sorted(target.items())
            if axis in 'BC' and self.position[axis] < value
        })

        target_coords = create_coords_list(target)
        backlash_coords = create_coords_list(backlash_target)

        if target_coords:
            command = ''
            if backlash_coords != target_coords:
                command += GCODES['MOVE'] + ''.join(backlash_coords) + ' '
            command += GCODES['MOVE'] + ''.join(target_coords)
            self._send_command(command)
            self._update_position(target)

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

        for axes in home_sequence:
            if 'X' in axes:
                self._home_x()
            elif 'Y' in axes:
                self._home_y()
            else:
                # if we are homing neither the X nor Y axes, simple home
                command = GCODES['HOME'] + axes
                self._send_command(command, timeout=30)

        # Only update axes that have been selected for homing
        homed = {
            ax: self.homed_position.get(ax)
            for ax in ''.join(home_sequence)
        }
        self.update_position(default=homed)

        # coordinate after homing might not synce with default in API
        # so update this driver's homed position using current coordinates
        new = {
            ax: self.position[ax]
            for ax in self.homed_position.keys()
            if ax in axis
        }
        self._homed_position.update(new)

        return self.position

    def fast_home(self, axis, safety_margin):
        ''' home after a controlled motor stall

        Given a known distance we have just stalled along an axis, move
        that distance away from the homing switch. Then finish with home.
        '''
        # move some mm distance away from the target axes endstop switch(es)
        destination = {
            ax: self.homed_position.get(ax) - abs(safety_margin)
            for ax in axis.upper()
        }

        # there is a chance the axis will hit it's home switch too soon
        # if this happens, catch the error and continue with homing afterwards
        try:
            self.move(destination)
        except SmoothieError:
            pass

        # then home once we're closer to the endstop(s)
        disabled = ''.join([ax for ax in AXES if ax not in axis.upper()])
        return self.home(axis=axis, disabled=disabled)

    def pause(self):
        if not self.simulating:
            self.run_flag.clear()

    def resume(self):
        if not self.simulating:
            self.run_flag.set()

    def delay(self, seconds):
        # per http://smoothieware.org/supported-g-codes:
        # In grbl mode P is float seconds to comply with gcode standards
        command = '{code}P{seconds}'.format(
            code=GCODES['DWELL'],
            seconds=seconds
        )
        self._send_command(command)

    def probe_axis(self, axis, probing_distance) -> Dict[str, float]:
        if axis.upper() in AXES:
            command = GCODES['PROBE'] + axis.upper() + str(probing_distance)
            self._send_command(command=command, timeout=30)
            self.update_position(self.position)
            return self.position
        else:
            raise RuntimeError("Cant probe axis {}".format(axis))

    def turn_on_red_button_light(self):
        gpio.set_high(gpio.OUTPUT_PINS['RED_BUTTON'])
        gpio.set_low(gpio.OUTPUT_PINS['GREEN_BUTTON'])
        gpio.set_low(gpio.OUTPUT_PINS['BLUE_BUTTON'])

    def turn_on_green_button_light(self):
        gpio.set_low(gpio.OUTPUT_PINS['RED_BUTTON'])
        gpio.set_high(gpio.OUTPUT_PINS['GREEN_BUTTON'])
        gpio.set_low(gpio.OUTPUT_PINS['BLUE_BUTTON'])

    def turn_on_blue_button_light(self):
        gpio.set_low(gpio.OUTPUT_PINS['RED_BUTTON'])
        gpio.set_low(gpio.OUTPUT_PINS['GREEN_BUTTON'])
        gpio.set_high(gpio.OUTPUT_PINS['BLUE_BUTTON'])

    def turn_off_button_light(self):
        gpio.set_low(gpio.OUTPUT_PINS['RED_BUTTON'])
        gpio.set_low(gpio.OUTPUT_PINS['GREEN_BUTTON'])
        gpio.set_low(gpio.OUTPUT_PINS['BLUE_BUTTON'])

    def turn_on_rail_lights(self):
        gpio.set_high(gpio.OUTPUT_PINS['FRAME_LEDS'])

    def turn_off_rail_lights(self):
        gpio.set_low(gpio.OUTPUT_PINS['FRAME_LEDS'])

    def read_button(self):
        return gpio.read(gpio.INPUT_PINS['BUTTON_INPUT'])

    def read_window_switches(self):
        return gpio.read(gpio.INPUT_PINS['WINDOW_INPUT'])

    def kill(self):
        """
        In order to terminate Smoothie motion immediately (including
        interrupting a command in progress, we set the reset pin low and then
        back to high, then call `_setup` method to send the RESET_FROM_ERROR
        Smoothie code to return Smoothie to a normal waiting state and reset
        any other state needed for the driver.
        """
        self._hard_reset_smoothie()
        sleep(0.1)
        self._reset_from_error()
        self._setup()

    # ----------- END Public interface ------------ #
