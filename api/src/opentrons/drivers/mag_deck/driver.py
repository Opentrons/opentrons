from os import environ
import logging
from threading import Event, Lock
from time import sleep
from typing import Dict, Optional, Mapping, Tuple

from opentrons.drivers.utils import ParseError
from serial.serialutil import SerialException  # type: ignore

from opentrons.drivers import serial_communication, utils
from opentrons.drivers.serial_communication import SerialNoResponse

"""
- This driver is responsibe for providing an interface for the mag deck
- The driver is the only system component that knows about the mag-deck's
  GCODES or how the mag-deck communicates

- The driver is NOT responsible for interpreting deck states in any way
  or knowing anything about what the device is being used for
"""

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

MAG_DECK_MODELS = {
    'magneticModuleV1': 'mag_deck_v1.1',
    'magneticModuleV2': 'mag_deck_v20'
}

# Number of digits after the decimal point for millimeter values
# being sent to/from magnetic module
GCODE_ROUNDING_PRECISION = 3

mag_locks: Dict[str, Tuple[Lock, 'MagDeck']] = {}


class MagDeckError(Exception):
    pass


def _parse_distance_response(distance_string) -> float:
    """
    Parse responses of 'GET_PLATE_HEIGHT' & 'GET_CURRENT_POSITION'
    Example response of-
    GET_PLATE_HEIGHT: "height:12.34"
    GET_CURRENT_POSITION: "Z:12.34"
    """
    data = utils.parse_key_values(distance_string)
    val = data.get('Z', data.get('height'))
    if val is None:
        raise utils.ParseError(
            error_message='Unexpected argument to _parse_distance_response',
            parse_source=distance_string
        )

    return utils.parse_number(val, GCODE_ROUNDING_PRECISION)


class SimulatingDriver:
    def __init__(self, sim_model: str = None):
        self._port = None
        self._height = 0.0
        self._model = MAG_DECK_MODELS[sim_model] if sim_model\
            else 'mag_deck_v1.1'

    def probe_plate(self):
        pass

    def home(self):
        pass

    def move(self, location: float):
        self._height = location

    def get_device_info(self) -> Mapping[str, str]:
        return {'serial': 'dummySerialMD',
                'model': self._model,
                'version': 'dummyVersionMD'}

    def connect(self, port: str):
        pass

    def disconnect(self, port: str = None):
        pass

    def enter_programming_mode(self):
        pass

    @property
    def plate_height(self) -> float:
        return self._height

    @property
    def mag_position(self) -> float:
        return self._height

    def is_connected(self) -> bool:
        return True


class MagDeck:
    def __init__(self, config={}):
        self.run_flag = Event()
        self.run_flag.set()

        self._connection = None
        self._config = config

        self._plate_height: Optional[float] = None
        self._mag_position: Optional[float] = None
        self._port: Optional[str] = None
        self._lock: Optional[Lock] = None

    def connect(self, port=None) -> str:
        """
        :param port: '/dev/ot_module_magdeck[#]'
        NOTE: Using the symlink above to connect makes sure that the robot
        connects/reconnects to the module even after a device
        reset/reconnection
        """
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
            self._connection.close()  # type: ignore
            del mag_locks[port]
        elif self.is_connected():
            self._connection.close()  # type: ignore
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
        """
        Homes the magnet
        """
        self.run_flag.wait()
        try:
            self._send_command(GCODES['HOME'])
        except (MagDeckError, SerialException, SerialNoResponse) as e:
            return str(e)
        return ''

    def probe_plate(self) -> str:
        """
        Probes for the deck plate and calculates the plate distance
        from home.
        To be used for calibrating MagDeck
        """
        self.run_flag.wait()
        try:
            self._send_command(GCODES['PROBE_PLATE'])
        except (MagDeckError, SerialException, SerialNoResponse) as e:
            return str(e)
        return ''

    @property
    def plate_height(self) -> float:
        """
        Default plate_height for the device is 30;
        calculated as MAX_TRAVEL_DISTANCE(45mm) - 15mm
        """
        self._update_plate_height()
        assert self._plate_height is not None, 'not connected'
        return self._plate_height

    @property
    def mag_position(self) -> float:
        """
        Default mag_position for the device is 0.0
        i.e. it boots with the current position as 0.0
        """
        self._update_mag_position()
        assert self._mag_position is not None, 'not connected'
        return self._mag_position

    def move(self, position_mm) -> str:
        """
        Move the magnets along Z axis where the home position is 0.0;
        position_mm-> a point along Z. Does not self-check if the position
        is outside of the deck's linear range
        """
        self.run_flag.wait()
        try:
            position_mm = round(
                float(position_mm), GCODE_ROUNDING_PRECISION)
            self._send_command(
                '{0} Z{1}'.format(GCODES['MOVE'], position_mm))
        except (MagDeckError, SerialException, SerialNoResponse) as e:
            return str(e)
        return ''

    def get_device_info(self) -> Dict[str, str]:
        """
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
        """
        return self._recursive_get_info(DEFAULT_COMMAND_RETRIES)

    def enter_programming_mode(self) -> str:
        """
        Enters and stays in DFU mode for 8 seconds.
        The module resets upon exiting the mode
        which causes the robot to lose serial connection to it.
        The connection can be restored by performing a .disconnect()
        followed by a .connect() to the same symlink node
        """
        try:
            self._send_command(GCODES['PROGRAMMING_MODE'])
        except (MagDeckError, SerialException, SerialNoResponse) as e:
            return str(e)
        if self._port:
            del mag_locks[self._port]
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
        """
        This methods writes a sequence of newline characters, which will
        guarantee mag-deck responds with 'ok\r\nok\r\n' within 1 seconds
        """
        self._send_command('\r\n', timeout=DEFAULT_MAG_DECK_TIMEOUT)

    # Potential place for command optimization (buffering, flushing, etc)
    def _send_command(self, command, timeout=DEFAULT_MAG_DECK_TIMEOUT):
        command_line = command + ' ' + MAG_DECK_COMMAND_TERMINATOR
        assert self._lock, 'need a lock'
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
            self._connection = serial_communication.connect(
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

    def _recursive_get_info(self, retries) -> Dict[str, str]:
        try:
            device_info = self._send_command(GCODES['DEVICE_INFO'])
            return utils.parse_device_information(device_info)
        except ParseError as e:
            retries -= 1
            if retries <= 0:
                raise MagDeckError(e)
            sleep(DEFAULT_STABILIZE_DELAY)
            return self._recursive_get_info(retries)
