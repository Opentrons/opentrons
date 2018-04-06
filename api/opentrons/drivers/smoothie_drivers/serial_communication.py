import serial
from serial.tools import list_ports
import contextlib
import logging

log = logging.getLogger(__name__)

DRIVER_ACK = b'ok\r\nok\r\n'
RECOVERY_TIMEOUT = 10
DEFAULT_SERIAL_TIMEOUT = 5
DEFAULT_WRITE_TIMEOUT = 30


def get_ports_by_name(device_name):
    '''Returns all serial devices with a given name'''
    filtered_devices = filter(
        lambda device: device_name in device[1],
        list_ports.comports()
    )
    device_ports = [device[0] for device in filtered_devices]
    return device_ports


def get_port_by_VID(vid):
    '''Returns first serial device with a given VID'''
    for d in list_ports.comports():
        if d.vid == vid:
            return d[0]


@contextlib.contextmanager
def serial_with_temp_timeout(serial_connection, timeout):
    '''Implements a temporary timeout for a serial connection'''
    saved_timeout = serial_connection.timeout
    if timeout is not None:
        serial_connection.timeout = timeout
    yield serial_connection
    serial_connection.timeout = saved_timeout


def _parse_smoothie_response(response):
    if DRIVER_ACK in response:
        parsed_response = response.split(DRIVER_ACK)[0]
        return parsed_response
    else:
        return None


def clear_buffer(serial_connection):
    serial_connection.reset_input_buffer()


def _write_to_device_and_return(cmd, device_connection):
    '''Writes to a serial device.
    - Formats command
    - Wait for ack return
    - return parsed response'''
    command = cmd + '\r\n\r\n'
    device_connection.write(command.encode())

    response = device_connection.read_until(DRIVER_ACK)

    clean_response = _parse_smoothie_response(response)
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


def _attempt_command_recovery(command, serial_conn):
    '''Recovery after following a failed write_and_return() atempt'''
    with serial_with_temp_timeout(serial_conn, RECOVERY_TIMEOUT) as device:
        response = _write_to_device_and_return(command, device)
    if response is None:
        log.debug("No valid response during _attempt_command_recovery")
        raise RuntimeError(
            "Recovery attempted - no valid smoothie response "
            "for command: {} in {} seconds".format(command, RECOVERY_TIMEOUT))
    return response


def write_and_return(
        command, serial_connection, timeout=DEFAULT_WRITE_TIMEOUT):
    '''Write a command and return the response'''
    log.info('Write -> {}'.format(command))
    clear_buffer(serial_connection)
    with serial_with_temp_timeout(
            serial_connection, timeout) as device_connection:
        response = _write_to_device_and_return(command, device_connection)
    log.info('Read <- {}'.format(response))
    return response


def connect(device_name, baudrate=115200):
    '''
    Creates a serial connection
    :param device_name: defaults to 'Smoothieboard'
    :param baudrate: integer frequency for serial communication
    :return: serial.Serial connection
    '''
    smoothie_port = get_ports_by_name(device_name=device_name)[0]
    log.debug("Device name: {}, Port: {}".format(device_name, smoothie_port))
    return _connect(port_name=smoothie_port, baudrate=baudrate)
