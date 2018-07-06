from os import environ
import logging
from threading import Event
from time import sleep

from serial.serialutil import SerialException

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

DEFAULT_MAG_DECK_TIMEOUT = 1

DEFAULT_STABILIZE_DELAY = 0.1
DEFAULT_COMMAND_RETRIES = 3

GCODES = {
    'HOME': 'G28',
    'PROBE_PLATE': 'G38.2',
    'GET_PLATE_POSITION': 'M836',
    'GET_CURRENT_POSITION': 'M114.2',
    'MOVE': 'G0',
    'DEVICE_INFO': 'M115',
    'PROGRAMMING_MODE': 'dfu'
}

MAG_DECK_BAUDRATE = 115200

MAG_DECK_COMMAND_TERMINATOR = '\r\n\r\n'
MAG_DECK_ACK = 'ok\r\nok\r\n'

# Number of digits after the decimal point for temperatures being sent
# to/from Temp-Deck
GCODE_ROUNDING_PRECISION = 3


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


def _parse_number_from_substring(substring) -> float:
    '''
    Returns the number in the expected string "N:12.3", where "N" is the
    key, and "12.3" is a floating point value

    For the temp-deck's temperature response, one expected input is something
    like "T:none", where "none" should return a None value
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
        Parse the mag-deck's device information response.

        Example response from temp-deck: "serial:aa11 model:bb22 version:cc33"
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


class MagDeck:
    def __init__(self, config={}):
        self.run_flag = Event()
        self.run_flag.set()

        self.simulating = True
        self._connection = None
        self._config = config

    def _recursive_write_and_return(self, cmd, timeout, retries):
        try:
            return serial_communication.write_and_return(
                cmd,
                MAG_DECK_ACK,
                self._connection,
                timeout)
        except SerialNoResponse as e:
            retries -= 1
            if retries <= 0:
                raise e
            if not self.simulating:
                sleep(DEFAULT_STABILIZE_DELAY)
            if self._connection:
                self._connection.close()
                self._connection.open()
            return self._recursive_write_and_return(
                cmd, timeout, retries)

    def _wait_for_ack(self):
        '''
        This methods writes a sequence of newline characters, which will
        guarantee mag-deck responds with 'ok\r\nok\r\n' within 1 seconds
        '''
        self._send_command('\r\n', timeout=DEFAULT_MAG_DECK_TIMEOUT)

    # Potential place for command optimization (buffering, flushing, etc)
    def _send_command(self, command, timeout=DEFAULT_MAG_DECK_TIMEOUT):

        if self.simulating:
            return

        command_line = command + ' ' + MAG_DECK_COMMAND_TERMINATOR
        ret_code = self._recursive_write_and_return(
            command_line, timeout, DEFAULT_COMMAND_RETRIES)

        # Smoothieware returns error state if a switch was hit while moving
        if (ERROR_KEYWORD in ret_code.lower()) or \
                (ALARM_KEYWORD in ret_code.lower()):
            log.error(
                'Received error message from Mag-Deck: {}'.format(ret_code))
            raise MagDeckError(ret_code)

        return ret_code.strip()

    def _connect_to_port(self, port=None):
        try:
            mag_deck = environ.get('OT_MAG_DECK_ID', None)
            self._connection = serial_communication.connect(
                device_name=mag_deck,
                port=port,
                baudrate=MAG_DECK_BAUDRATE
            )
            self.simulating = False
        except SerialException:
            # if another process is using the port, pyserial raises an
            # exception that describes a "readiness to read" which is confusing
            error_msg = 'Unable to access Serial port to Mag-Deck. This is '
            error_msg += 'because another process is currently using it, or '
            error_msg += 'the Serial port is disabled on this device (OS)'
            raise SerialException(error_msg)

    def connect(self, port=None) -> str:
        if environ.get('ENABLE_VIRTUAL_SMOOTHIE', '').lower() == 'true':
            self.simulating = True
            return
        try:
            self.disconnect()
            self._connect_to_port(port)
            self._wait_for_ack()    # verify the device is there
        except (SerialException, SerialNoResponse) as e:
            return str(e)
        return ''

    def disconnect(self):
        if self.is_connected():
            self._connection.close()
        self._connection = None
        self.simulating = True

    def is_connected(self) -> bool:
        if not self._connection:
            return False
        return self._connection.is_open

    @property
    def port(self) -> str:
        if not self._connection:
            return None
        return self._connection.port

    def home(self) -> str:
        self.run_flag.wait()

        try:
            self._send_command(GCODES['HOME'])
        except (MagDeckError, SerialException, SerialNoResponse) as e:
            return str(e)
        return ''
