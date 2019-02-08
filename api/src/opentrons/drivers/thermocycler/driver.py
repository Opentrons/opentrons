import logging
from os import environ
from threading import Event
from time import sleep
from typing import Optional
from serial.serialutil import SerialException
from opentrons.drivers import serial_communication
from opentrons.drivers.serial_communication import SerialNoResponse


log = logging.getLogger(__name__)

GCODES = {
    'OPEN_LID': 'M126',
    'CLOSE_LID': 'M127',
    'GET_LID_STATUS': 'M119',
    'SET_LID_TEMP': 'M140',
    'DEACTIVATE_LID_HEATING': 'M108',
    'EDIT_PID_PARAMS': 'M301',
    'SET_PLATE_TEMP': 'M104',
    'SET_RAMP_RATE': 'M566',
    'PAUSE': '',
    'DEACTIVATE': 'M18'
}

TC_BAUDRATE = 115200

TC_COMMAND_TERMINATOR = '\r\n\r\n'
TC_ACK = 'ok\r\nok\r\n'
ERROR_KEYWORD = 'error'
DEFAULT_TC_TIMEOUT = 1
DEFAULT_COMMAND_RETRIES = 3
DEFAULT_STABILIZE_DELAY = 0.1


class ThermocyclerError(Exception):
    pass


class ParseError(Exception):
    pass


class Thermocycler:
    def __init__(self, config={}):  # Is config needed?
        self.run_flag = Event()
        self.run_flag.set()

        self._connection = None
        self._config = config

        self._update_thread = None

    def connect(self, port: str) -> 'Thermocycler':
        if environ.get('ENABLE_VIRTUAL_SMOOTHIE', '').lower() != 'true':
            try:
                self.disconnect()
                self._connection = self._connect_to_port(port)
                self._wait_for_ack()
            except (SerialException, SerialNoResponse) as e:
                raise e
        return self

    def disconnect(self) -> 'Thermocycler':
        if self.is_connected():
            self._connection.close()
        self._connection = None
        return self

    def is_connected(self) -> bool:
        if not self._connection:
            return False
        return self._connection.is_open

    @property
    def port(self) -> Optional[str]:
        if not self._connection:
            return None
        return self._connection.port

    def _connect_to_port(self, port: str):
        try:
            return serial_communication.connect(port=port,
                                                baudrate=TC_BAUDRATE)
        except SerialException:
            raise SerialException("Thermocycler device not found")

    def _wait_for_ack(self):
        """
        This method writes a sequence of newline characters, which will
        guarantee the device responds with 'ok\r\nok\r\n' within 1 second
        """
        self._send_command('\r\n', timeout=DEFAULT_TC_TIMEOUT)

    def _send_command(self, command, timeout=DEFAULT_TC_TIMEOUT):
        command_line = command + ' ' + TC_COMMAND_TERMINATOR
        ret_code = self._recursive_write_and_return(
            command_line, timeout, DEFAULT_COMMAND_RETRIES)
        if(ERROR_KEYWORD in ret_code.lower()):
            log.error('Received error message from Thermocycler: {}'.format(
                    ret_code))
            raise ThermocyclerError(ret_code)
        return ret_code.strip()

    def _recursive_write_and_return(self, cmd, timeout, retries):
        try:
            return serial_communication.write_and_return(
                cmd,
                TC_ACK,
                self._connection,
                timeout)
        except SerialNoResponse as e:
            retries -= 1
            if retries <= 0:
                raise e
            sleep(DEFAULT_STABILIZE_DELAY)
            if self._connection:
                self._connection.close()
                self._connection.open()
            return self._recursive_write_and_return(
                cmd, timeout, retries)
