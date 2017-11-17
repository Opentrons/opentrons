import serial
from serial.tools import list_ports
import contextlib
import os

DRIVER_ACK = b'ok\r\nok\r\n'
RECOVERY_TIMEOUT = 10
DEFAULT_SERIAL_TIMEOUT = 5
DEFAULT_WRITE_TIMEOUT = 30

# Note: FT232R is the board id for communication over usb on UNIX systems.
# This is set for serial communication in the Dockerfile
smoothie_id = os.environ.get('OT_SMOOTHIE_ID', 'FT232R')

ERROR_KEYWORD = b'error'
ALARM_KEYWORD = b'ALARM'


def get_ports(device_name):
    '''Returns all serial devices with a given name'''
    filtered_devices = filter(
        lambda device: device_name in device[1],
        list_ports.comports()
    )
    device_ports = [device[0] for device in filtered_devices]
    return device_ports


@contextlib.contextmanager
def serial_with_temp_timeout(serial_connection, timeout):
    '''Implements a temporary timeout for a serial connection'''
    saved_timeout = serial_connection.timeout
    if timeout is not None:
        serial_connection.timeout = timeout
    yield serial_connection
    serial_connection.timeout = saved_timeout


def _parse_smoothie_response(response):
    if ERROR_KEYWORD in response or ALARM_KEYWORD in response:
        print("[SMOOTHIE ISSUE]: ", response)

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
    command = cmd + '\r\n'
    device_connection.write(command.encode())

    response = device_connection.read_until(DRIVER_ACK)

    clean_response = _parse_smoothie_response(response)
    if clean_response:
        clean_response = clean_response.decode()
    return clean_response


def _connect(port_name, baudrate):
    return serial.Serial(
        port=port_name,
        baudrate=baudrate,
        timeout=DEFAULT_SERIAL_TIMEOUT
    )


def _attempt_command_recovery(command, serial_conn):
    '''Recovery after following a failed write_and_return() atempt'''
    with serial_with_temp_timeout(serial_conn, RECOVERY_TIMEOUT) as device:
        response = _write_to_device_and_return(command, device)
    if response is None:
        raise RuntimeError(
            "Recovery attempted - no valid smoothie response "
            "for command: {} in {} seconds".format(command, RECOVERY_TIMEOUT))
    return response


def write_and_return(
        command, serial_connection, timeout=DEFAULT_WRITE_TIMEOUT):
    '''Write a command and return the response'''
    clear_buffer(serial_connection)
    with serial_with_temp_timeout(
            serial_connection, timeout) as device_connection:
        response = _write_to_device_and_return(command, device_connection)
    return response


def connect(device_name=smoothie_id, baudrate=115200):
    '''
    Creates a serial connection
    :param device_name: defaults to 'Smoothieboard'
    :param baudrate: integer frequency for serial communication
    :return: serial.Serial connection
    '''
    smoothie_port = get_ports(device_name=device_name)[0]
    return _connect(port_name=smoothie_port, baudrate=baudrate)
