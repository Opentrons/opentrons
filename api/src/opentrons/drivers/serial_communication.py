import serial  # type: ignore
from serial.tools import list_ports  # type: ignore
import contextlib
import logging

log = logging.getLogger(__name__)

RECOVERY_TIMEOUT = 10
DEFAULT_SERIAL_TIMEOUT = 5
DEFAULT_WRITE_TIMEOUT = 30


class SerialNoResponse(Exception):
    pass


def get_ports_by_name(device_name):
    """Returns all serial devices with a given name"""
    filtered_devices = filter(
        lambda device: device_name in device[1],
        list_ports.comports()
    )
    device_ports = [device[0] for device in filtered_devices]
    return device_ports


@contextlib.contextmanager
def serial_with_temp_timeout(serial_connection, timeout):
    """Implements a temporary timeout for a serial connection"""
    saved_timeout = serial_connection.timeout
    if timeout is not None:
        serial_connection.timeout = timeout
    try:
        yield serial_connection
    finally:
        serial_connection.timeout = saved_timeout


def _parse_serial_response(response, ack):
    if ack in response:
        parsed_response = response.split(ack)[0]
        return parsed_response.strip()
    else:
        return None


def clear_buffer(serial_connection):
    serial_connection.reset_input_buffer()


def _write_to_device_and_return(cmd, ack, device_connection, tag=None):
    """Writes to a serial device.
    - Formats command
    - Wait for ack return
    - return parsed response"""

    if not tag:
        tag = device_connection.port

    encoded_write = cmd.encode()
    encoded_ack = ack.encode()
    log.debug(f'{tag}: Write -> {encoded_write}')
    device_connection.write(encoded_write)
    response = device_connection.read_until(encoded_ack)
    log.debug(f'{tag}: Read <- {response}')
    if encoded_ack not in response:
        log.warning(f'{tag}: timed out after {device_connection.timeout}')
        raise SerialNoResponse(
            'No response from serial port after {} second(s)'.format(
                device_connection.timeout))
    clean_response = _parse_serial_response(response, encoded_ack)
    if clean_response:
        return clean_response.decode()
    return ''


def _connect(port_name, baudrate):
    ser = serial.serial_for_url(
        url=port_name,
        baudrate=baudrate,
        timeout=DEFAULT_SERIAL_TIMEOUT
    )
    log.debug(ser)
    return ser


def write_and_return(
        command, ack, serial_connection,
        timeout=DEFAULT_WRITE_TIMEOUT, tag=None):
    """Write a command and return the response"""
    clear_buffer(serial_connection)
    with serial_with_temp_timeout(
            serial_connection, timeout) as device_connection:
        response = _write_to_device_and_return(
            command, ack, device_connection, tag)
    return response


def connect(device_name=None, port=None, baudrate=115200):
    """
    Creates a serial connection
    :param device_name: defaults to 'Smoothieboard'
    :param baudrate: integer frequency for serial communication
    :return: serial.Serial connection
    """
    if not port:
        port = get_ports_by_name(device_name=device_name)[0]
    log.debug("Device name: {}, Port: {}".format(device_name, port))
    return _connect(port_name=port, baudrate=baudrate)
