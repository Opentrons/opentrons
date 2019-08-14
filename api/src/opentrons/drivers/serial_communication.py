<<<<<<< HEAD
import serial  # type: ignore
from serial.tools import list_ports  # type: ignore
=======
>>>>>>> refactor(api): Pull shared funcs and constants out of smoothie
import contextlib
import logging

import serial
from .utils import parse_serial_response, SerialNoResponse, get_ports_by_name

log = logging.getLogger(__name__)

RECOVERY_TIMEOUT = 10
DEFAULT_SERIAL_TIMEOUT = 5
DEFAULT_WRITE_TIMEOUT = 30


@contextlib.contextmanager
def serial_with_temp_timeout(serial_connection, timeout):
    '''Implements a temporary timeout for a serial connection'''
    saved_timeout = serial_connection.timeout
    if timeout is not None:
        serial_connection.timeout = timeout
    yield serial_connection
    serial_connection.timeout = saved_timeout


def clear_buffer(serial_connection):
    serial_connection.reset_input_buffer()


def _write_to_device_and_return(cmd, ack, device_connection, tag=None):
    '''Writes to a serial device.
    - Formats command
    - Wait for ack return
    - return parsed response'''

    if not tag:
        tag = device_connection.port

    encoded_write = cmd.encode()
    encoded_ack = ack.encode()
    log.debug(f'{tag}: Write -> {encoded_write}')
    device_connection.write(encoded_write)
    response = device_connection.read_until(encoded_ack)
    log.debug(f'{tag}: Read <- {response}')
    if encoded_ack not in response:
        raise SerialNoResponse(
            'No response from serial port after {} second(s)'.format(
                device_connection.timeout))
    clean_response = parse_serial_response(response, encoded_ack)
    if clean_response:
        return clean_response.decode()
    return ''


def _connect(port_name, baudrate):
    ser = serial.Serial(
        port=port_name,
        baudrate=baudrate,
        timeout=DEFAULT_SERIAL_TIMEOUT
    )
    log.debug(ser)
    return ser


def _attempt_command_recovery(command, ack, serial_conn, tag=None):
    '''Recovery after following a failed write_and_return() atempt'''
    if not tag:
        tag = serial_conn.port
    with serial_with_temp_timeout(serial_conn, RECOVERY_TIMEOUT) as device:
        response = _write_to_device_and_return(command, ack, device, tag=tag)
    if response is None:
        log.debug(f"{tag}: No valid response during _attempt_command_recovery")
        raise RuntimeError(
            "Recovery attempted - no valid serial response "
            "for command: {} in {} seconds".format(
                command.encode(), RECOVERY_TIMEOUT))
    return response


def write_and_return(
        command, ack, serial_connection,
        timeout=DEFAULT_WRITE_TIMEOUT, tag=None):
    '''Write a command and return the response'''
    clear_buffer(serial_connection)
    with serial_with_temp_timeout(
            serial_connection, timeout) as device_connection:
        response = _write_to_device_and_return(
            command, ack, device_connection, tag)
    return response


def connect(device_name=None, port=None, baudrate=115200):
    '''
    Creates a serial connection
    :param device_name: defaults to 'Smoothieboard'
    :param baudrate: integer frequency for serial communication
    :return: serial.Serial connection
    '''
    if not port:
        port = get_ports_by_name(device_name=device_name)[0]
    log.debug("Device name: {}, Port: {}".format(device_name, port))
    return _connect(port_name=port, baudrate=baudrate)
