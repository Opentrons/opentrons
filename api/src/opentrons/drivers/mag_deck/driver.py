from os import environ
import logging
from threading import Event, Lock
from time import sleep
from typing import Optional, Dict, Tuple
from serial.serialutil import SerialException  # type: ignore

from opentrons.drivers import serial_communication
from opentrons.drivers.serial_communication import SerialNoResponse

'''
- This driver is responsibe for providing an interface for the mag deck
- The driver is the only system component that knows about the mag-deck's
  GCODES or how the mag-deck communicates

- The driver is NOT responsible for interpreting deck states in any way
  or knowing anything about what the device is being used for
'''

log = logging.getLogger(__name__)

ERROR_KEYWORD = 'error'
ALARM_KEYWORD = 'alarm'

DEFAULT_MAG_DECK_TIMEOUT = 10   # Quite large to account for probe time

DEFAULT_STABILIZE_DELAY = 0.1
DEFAULT_COMMAND_RETRIES = 3

GCODES = {
    'HOME': 'G28.2',
    'PROBE_PLATE': 'G38.2',
    'GET_PLATE_HEIGHT': 'M836',
    'GET_CURRENT_POSITION': 'M114.2',
    'MOVE': 'G0',
    'DEVICE_INFO': 'M115',
    'PROGRAMMING_MODE': 'dfu'
}

MAG_DECK_BAUDRATE = 115200

MAG_DECK_COMMAND_TERMINATOR = '\r\n\r\n'
MAG_DECK_ACK = 'ok\r\nok\r\n'

# Number of digits after the decimal point for millimeter values
# being sent to/from magnetic module
GCODE_ROUNDING_PRECISION = 3

mag_locks: Dict[str, Tuple[Lock, 'MagDeck']] = {}


class MagDeckError(Exception):
    pass


class ParseError(Exception):
    pass


def _parse_string_value_from_substring(substring) -> str:
    '''
    Returns the ascii value in the expected string "N:aa11bb22", where "N" is
    the key, and "aa11bb22" is string value to be returned
    '''
    try:
        value = substring.split(':')[1]
        return str(value)
    except (ValueError, IndexError, TypeError, AttributeError):
        log.exception('Unexpected arg to _parse_string_value_from_substring:')
        raise ParseError(
            'Unexpected arg to _parse_string_value_from_substring: {}'.format(
                substring))


def _parse_number_from_substring(substring) -> Optional[float]:
    '''
    Returns the number in the expected string "N:12.3", where "N" is the
    key, and "12.3" is a floating point value

    For the magnetic module's height response like "height:12.34" "
    "height:none" should return a None value
    '''
    try:
        value = substring.split(':')[1]
        if value.strip().lower() == 'none':
            return None
        return round(float(value), GCODE_ROUNDING_PRECISION)
    except (ValueError, IndexError, TypeError, AttributeError):
        log.exception('Unexpected argument to _parse_number_from_substring:')
        raise ParseError(
            'Unexpected argument to _parse_number_from_substring: {}'.format(
                substring))


def _parse_key_from_substring(substring) -> str:
    '''
    Returns the key in the expected string "N:12.3", where "N" is the
    key, and "12.3" is a floating point value
    '''
    try:
        return substring.split(':')[0]
    except (ValueError, IndexError, TypeError, AttributeError):
        log.exception('Unexpected argument to _parse_key_from_substring:')
        raise ParseError(
            'Unexpected argument to _parse_key_from_substring: {}'.format(
                substring))


def _parse_device_information(device_info_string) -> dict:
    '''
    Parse the magnetic module's device information response.
    Example response from magnetic module:
    "serial:aa11 model:bb22 version:cc33"
    '''
    error_msg = 'Unexpected argument to _parse_device_information: {}'.format(
        device_info_string)
    if not device_info_string or \
            not isinstance(device_info_string, str):
        raise ParseError(error_msg)
    parsed_values = device_info_string.strip().split(' ')
    if len(parsed_values) < 3:
        log.error(error_msg)
        raise ParseError(error_msg)
    res = {
        _parse_key_from_substring(s): _parse_string_value_from_substring(s)
        for s in parsed_values[:3]
    }
    for key in ['model', 'version', 'serial']:
        if key not in res:
            raise ParseError(error_msg)
    return res


def _parse_distance_response(distance_string) -> float:
    '''
    Parse responses of 'GET_PLATE_HEIGHT' & 'GET_CURRENT_POSITION'
    Example response of-
    GET_PLATE_HEIGHT: "height:12.34"
    GET_CURRENT_POSITION: "Z:12.34"
    '''
    err_msg = 'Unexpected argument to _parse_distance_response: {}'.format(
        distance_string)
    if not distance_string or \
            not isinstance(distance_string, str):
        raise ParseError(err_msg)
    if 'Z' not in distance_string and 'height' not in distance_string:
        raise ParseError(err_msg)
    return _parse_number_from_substring(  # type: ignore
        distance_string.strip())          # (preconditions checked above)


class MagDeck:
    def __init__(self, config={}):
        self.run_flag = Event()
        self.run_flag.set()

        self._connection = None
        self._config = config

        self._plate_height = None
        self._mag_position = None
        self._port = None
        self._lock = None

    def connect(self, port=None) -> str:
        '''
        :param port: '/dev/ot_module_magdeck[#]'
        NOTE: Using the symlink above to connect makes sure that the robot
        connects/reconnects to the module even after a device
        reset/reconnection
        '''
        if environ.get('ENABLE_VIRTUAL_SMOOTHIE', '').lower() == 'true':
            return ''
        try:
            self.disconnect(port)
            self._connect_to_port(port)
            if mag_locks.get(port):
                self._lock = mag_locks[port][0]
            else:
                self._lock = Lock()
                mag_locks[port] = (self._lock, self)
            self._wait_for_ack()    # verify the device is there
            self._port = port

        except (SerialException, SerialNoResponse) as e:
            return str(e)
        return ''

    def disconnect(self, port=None):
        if port and self.is_connected():
            self._connection.close()
            del mag_locks[port]
        elif self.is_connected():
            self._connection.close()
        self._connection = None

    def is_connected(self) -> bool:
        # Does not detect if the module was physically plugged out
        # TODO: have it test actual connection
        if not self._connection:
            return False
        return self._connection.is_open

    @property
    def port(self) -> str:
        if not self._connection:
            return ''
        return self._connection.port

    def home(self) -> str:
        '''
        Homes the magnet
        '''
        self.run_flag.wait()
        try:
            self._send_command(GCODES['HOME'])
        except (MagDeckError, SerialException, SerialNoResponse) as e:
            return str(e)
        return ''

    def probe_plate(self) -> str:
        '''
        Probes for the deck plate and calculates the plate distance
        from home.
        To be used for calibrating MagDeck
        '''
        self.run_flag.wait()
        try:
            self._send_command(GCODES['PROBE_PLATE'])
        except (MagDeckError, SerialException, SerialNoResponse) as e:
            return str(e)
        return ''

    @property
    def plate_height(self) -> float:
        '''
        Default plate_height for the device is 30;
        calculated as MAX_TRAVEL_DISTANCE(45mm) - 15mm
        '''
        self._update_plate_height()
        return self._plate_height

    @property
    def mag_position(self) -> float:
        '''
        Default mag_position for the device is 0.0
        i.e. it boots with the current position as 0.0
        '''
        self._update_mag_position()
        return self._mag_position

    def move(self, position_mm) -> str:
        '''
        Move the magnets along Z axis where the home position is 0.0;
        position_mm-> a point along Z. Does not self-check if the position
        is outside of the deck's linear range
        '''
        self.run_flag.wait()
        try:
            position_mm = round(
                float(position_mm), GCODE_ROUNDING_PRECISION)
            self._send_command(
                '{0} Z{1}'.format(GCODES['MOVE'], position_mm))
        except (MagDeckError, SerialException, SerialNoResponse) as e:
            return str(e)
        return ''

    def get_device_info(self) -> dict:
        '''
        Queries Temp-Deck for it's build version, model, and serial number

        returns: dict
            Where keys are the strings 'version', 'model', and 'serial',
            and each value is a string identifier

            {
                'serial': '1aa11bb22',
                'model': '1aa11bb22',
                'version': '1aa11bb22'
            }

        Example input from Temp-Deck's serial response:
            "serial:aa11bb22 model:aa11bb22 version:aa11bb22"
        '''
        try:
            return self._recursive_get_info(DEFAULT_COMMAND_RETRIES)
        except (MagDeckError, SerialException, SerialNoResponse) as e:
            return {'error': str(e)}

    def enter_programming_mode(self) -> str:
        '''
        Enters and stays in DFU mode for 8 seconds.
        The module resets upon exiting the mode
        which causes the robot to lose serial connection to it.
        The connection can be restored by performing a .disconnect()
        followed by a .connect() to the same symlink node
        '''
        try:
            self._send_command(GCODES['PROGRAMMING_MODE'])
        except (MagDeckError, SerialException, SerialNoResponse) as e:
            return str(e)
        return ''

    def _recursive_write_and_return(self, cmd, timeout, retries, tag=None):
        if not tag:
            tag = f'magdeck {id(self)}'
        try:
            return serial_communication.write_and_return(
                cmd,
                MAG_DECK_ACK,
                self._connection,
                timeout,
                tag=tag)
        except SerialNoResponse as e:
            retries -= 1
            if retries <= 0:
                raise e
            sleep(DEFAULT_STABILIZE_DELAY)
            if self._connection:
                self._connection.close()
                self._connection.open()
            return self._recursive_write_and_return(
                cmd, timeout, retries, tag=tag)

    def _wait_for_ack(self):
        '''
        This methods writes a sequence of newline characters, which will
        guarantee mag-deck responds with 'ok\r\nok\r\n' within 1 seconds
        '''
        self._send_command('\r\n', timeout=DEFAULT_MAG_DECK_TIMEOUT)

    # Potential place for command optimization (buffering, flushing, etc)
    def _send_command(self, command, timeout=DEFAULT_MAG_DECK_TIMEOUT):
        command_line = command + ' ' + MAG_DECK_COMMAND_TERMINATOR
        with self._lock:
            ret_code = self._recursive_write_and_return(
                command_line, timeout, DEFAULT_COMMAND_RETRIES)

            # Smoothieware returns error state if a switch was hit while moving
            if (ERROR_KEYWORD in ret_code.lower()) or \
                    (ALARM_KEYWORD in ret_code.lower()):
                log.error(f'Received error message from Mag-Deck: {ret_code}')
                raise MagDeckError(ret_code)

            return ret_code.strip()

    def _connect_to_port(self, port=None):
        try:
            mag_deck = environ.get('OT_MAG_DECK_ID')
            self._connection = serial_communication.connect(
                device_name=mag_deck,
                port=port,
                baudrate=MAG_DECK_BAUDRATE
            )
        except SerialException:
            # if another process is using the port, pyserial raises an
            # exception that describes a "readiness to read" which is confusing
            error_msg = "Unable to access Serial port to Mag-Deck. This is"
            " because another process is currently using it, or"
            " the Serial port is disabled on this device (OS)"
            raise SerialException(error_msg)
        except TypeError:
            # This happens if there are no ot_module_magdeck* devices in /dev
            # For development use ENABLE_VIRTUAL_SMOOTHIE=true
            raise SerialException('No port specified')

    def _update_plate_height(self) -> str:
        try:
            res = self._send_command(GCODES['GET_PLATE_HEIGHT'])
            distance = _parse_distance_response(res)
        except (MagDeckError, SerialException, SerialNoResponse) as e:
            return str(e)
        self._plate_height = distance
        return ''

    def _update_mag_position(self) -> str:
        try:
            res = self._send_command(GCODES['GET_CURRENT_POSITION'])
            distance = _parse_distance_response(res)
        except (MagDeckError, SerialException, SerialNoResponse) as e:
            return str(e)
        self._mag_position = distance
        return ''

    def _recursive_get_info(self, retries) -> dict:
        try:
            device_info = self._send_command(GCODES['DEVICE_INFO'])
            return _parse_device_information(device_info)
        except ParseError as e:
            retries -= 1
            if retries <= 0:
                raise MagDeckError(e)
            sleep(DEFAULT_STABILIZE_DELAY)
            return self._recursive_get_info(retries)
