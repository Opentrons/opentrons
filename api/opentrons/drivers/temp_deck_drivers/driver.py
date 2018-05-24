from os import environ
import logging
from threading import Event
from time import sleep

from serial.serialutil import SerialException

from opentrons.drivers import serial_communication

'''
- Driver is responsible for providing an interface for the temp-deck
- Driver is the only system component that knows about the temp-deck's GCODES
  or how the temp-deck communications

- Driver is NOT responsible interpreting the temperatures or states in any way
  or knowing anything about what the device is being used for
'''

log = logging.getLogger(__name__)

ERROR_KEYWORD = 'error'
ALARM_KEYWORD = 'alarm'

DEFAULT_TEMP_DECK_TIMEOUT = 1

DEFAULT_STABILIZE_DELAY = 0.1
DEFAULT_COMMAND_RETRIES = 3

TEMP_DECK_BOOTLOADER_TIMEOUT = 3

GCODES = {
    'GET_TEMP': 'M105',
    'SET_TEMP': 'M104',
    'DEVICE_INFO': 'M115',
    'DISENGAGE': 'M18',
    'PROGRAMMING_MODE': 'dfu'
}

TEMP_DECK_BAUDRATE = 115200

TEMP_DECK_COMMAND_TERMINATOR = '\r\n\r\n'
TEMP_DECK_ACK = 'ok\r\nok\r\n'


class TempDeckError(Exception):
    pass


class ParseError(Exception):
    pass


def _parse_string_value_from_substring(substring):
    '''
    Returns the ascii value in the expected string "N:aa11bb22", where "N" is
    the key, and "aa11bb22" is string value to be returned
    '''
    try:
        value = substring.split(':')[1]
        return str(value)
    except (ValueError, IndexError, TypeError, AttributeError) as e:
        log.exception('Unexpected arg to _parse_string_value_from_substring:')
        raise ParseError(
            'Unexpected arg to _parse_string_value_from_substring: {}'.format(
                substring))


def _parse_number_from_substring(substring):
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
        return int(value)
    except (ValueError, IndexError, TypeError, AttributeError) as e:
        log.exception('Unexpected argument to _parse_number_from_substring:')
        raise ParseError(
            'Unexpected argument to _parse_number_from_substring: {}'.format(
                substring))


def _parse_key_from_substring(substring):
    '''
    Returns the axis in the expected string "N:12.3", where "N" is the
    key, and "12.3" is a floating point value
    '''
    try:
        return substring.split(':')[0]
    except (ValueError, IndexError, TypeError, AttributeError) as e:
        log.exception('Unexpected argument to _parse_key_from_substring:')
        raise ParseError(
            'Unexpected argument to _parse_key_from_substring: {}'.format(
                substring))


def _parse_temperature_response(temperature_string):
    '''
    Example input: "T:none C:25"
    Example input: "T:none C:25"
    '''
    if not temperature_string or \
            not isinstance(temperature_string, str):
        raise ParseError(
            'Unexpected argument to _parse_temperature_response: {}'.format(
                temperature_string))
    parsed_values = temperature_string.strip().split(' ')
    if len(parsed_values) < 2:
        msg = 'Unexpected response in _parse_temperature_response: {}'.format(
            temperature_string)
        log.error(msg)
        raise ParseError(msg)

    data = {
        _parse_key_from_substring(s): _parse_number_from_substring(s)
        for s in parsed_values[:2]
    }
    return data


def _parse_device_information(device_info_string):
    '''
        Parse the temp-deck's device information response.

        Example response from temp-deck: "serial:aa11 model:bb22 version:cc33"
    '''
    if not device_info_string or \
            not isinstance(device_info_string, str):
        raise ParseError(
            'Unexpected argument to _parse_device_information: {}'.format(
                device_info_string))
    parsed_values = device_info_string.strip().split(' ')
    if len(parsed_values) < 3:
        msg = 'Unexpected response in _parse_device_information: {}'.format(
            device_info_string)
        log.error(msg)
        raise ParseError(msg)
    res = {
        _parse_key_from_substring(s): _parse_string_value_from_substring(s)
        for s in parsed_values[:3]
    }
    return res


class TempDeck:
    def __init__(self, config={}):
        self.run_flag = Event()
        self.run_flag.set()

        self.simulating = True
        self._connection = None
        self._config = config

        self._temperature = {'current': 25, 'target': None}

    def connect(self, port=None):
        if environ.get('ENABLE_VIRTUAL_SMOOTHIE', '').lower() == 'true':
            self.simulating = True
            return
        self.disconnect()
        self._connect_to_port(port)
        self._setup()

    def disconnect(self):
        if self.is_connected():
            self._connection.close()
        self._connection = None
        self.simulating = True

    def is_connected(self):
        if not self._connection:
            return False
        return self._connection.is_open

    @property
    def port(self):
        if not self._connection:
            return None
        return self._connection.port

    def disengage(self):
        self.run_flag.wait()
        self._send_command(GCODES['DISENGAGE'])

    def set_temperature(self, celsius):
        self.run_flag.wait()
        self._send_command('{0} S{1}'.format(GCODES['SET_TEMP'], int(celsius)))

    def update_temperature(self, default=None):
        if default is None:
            default = self._temperature.copy()
        updated_temperature = default
        if not self.simulating:
            res = self._send_command(GCODES['GET_TEMP'])
            res = _parse_temperature_response(res)
            updated_temperature.update({
                'current': res.get('C'),
                'target': res.get('T')
            })
        self._temperature.update(updated_temperature)

    @property
    def target(self):
        return self._temperature.get('target')

    @property
    def temperature(self):
        return self._temperature.get('current')

    def get_device_info(self):
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
        if self.simulating:
            return {
                'serial': '1aa11bb22',
                'model': '1aa11bb22',
                'version': '1aa11bb22'
            }
        device_info = self._send_command(GCODES['DEVICE_INFO'])
        device_info = _parse_device_information(device_info)
        return device_info

    def pause(self):
        if not self.simulating:
            self.run_flag.clear()

    def resume(self):
        if not self.simulating:
            self.run_flag.set()

    def enter_programming_mode(self):
        self._send_command(GCODES['PROGRAMMING_MODE'])

    def _connect_to_port(self, port=None):
        try:
            temp_deck = environ.get('OT_TEMP_DECK_ID', None)
            self._connection = serial_communication.connect(
                device_name=temp_deck,
                port=port,
                baudrate=TEMP_DECK_BAUDRATE
            )
            self.simulating = False
        except SerialException:
            # if another process is using the port, pyserial raises an
            # exception that describes a "readiness to read" which is confusing
            error_msg = 'Unable to access Serial port to Temp-Deck. This is '
            error_msg += 'because another process is currently using it, or '
            error_msg += 'the Serial port is disabled on this device (OS)'
            raise SerialException(error_msg)

    def _setup(self):
        log.debug("_setup")
        self._wait_for_ack()

    def _wait_for_ack(self):
        '''
        This methods writes a sequence of newline characters, which will
        guarantee temp-deck responds with 'ok\r\nok\r\n' within 1 seconds
        '''
        self._send_command('\r\n', timeout=DEFAULT_TEMP_DECK_TIMEOUT)

    # Potential place for command optimization (buffering, flushing, etc)
    def _send_command(self, command, timeout=DEFAULT_TEMP_DECK_TIMEOUT):
        """

        """
        if self.simulating:
            return

        command_line = command + ' ' + TEMP_DECK_COMMAND_TERMINATOR
        ret_code = self._recursive_write_and_return(
            command_line, timeout, DEFAULT_COMMAND_RETRIES)

        # Smoothieware returns error state if a switch was hit while moving
        if (ERROR_KEYWORD in ret_code.lower()) or \
                (ALARM_KEYWORD in ret_code.lower()):
            raise TempDeckError(ret_code)

        return ret_code.strip()

    def _recursive_write_and_return(self, cmd, timeout, retries):
        try:
            return serial_communication.write_and_return(
                cmd,
                TEMP_DECK_ACK,
                self._connection,
                timeout)
        except serial_communication.SerialNoResponse as e:
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
