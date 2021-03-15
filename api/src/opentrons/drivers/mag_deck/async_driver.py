import logging
from typing import Dict

"""
- This driver is responsible for providing an interface for the mag deck
- The driver is the only system component that knows about the mag-deck's
  GCODES or how the mag-deck communicates

- The driver is NOT responsible for interpreting deck states in any way
  or knowing anything about what the device is being used for
"""

log = logging.getLogger(__name__)

ERROR_KEYWORD = 'error'
ALARM_KEYWORD = 'alarm'

DEFAULT_MAG_DECK_TIMEOUT = 10  # Quite large to account for probe time

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


class MagDeckError(Exception):
    pass


class MagDeck:
    def __init__(self):
        pass

    async def connect(self, port=None) -> None:
        """
        :param port: '/dev/ot_module_magdeck[#]'
        NOTE: Using the symlink above to connect makes sure that the robot
        connects/reconnects to the module even after a device
        reset/reconnection
        """
        pass

    async def disconnect(self, port=None) -> None:
        pass

    async def is_connected(self) -> bool:
        pass

    @property
    def port(self) -> str:
        pass

    async def home(self) -> None:
        """Homes the magnet"""
        pass

    async def probe_plate(self) -> None:
        """
        Probes for the deck plate and calculates the plate distance
        from home.
        To be used for calibrating MagDeck
        """
        pass

    async def get_plate_height(self) -> float:
        """
        Default plate_height for the device is 30;
        calculated as MAX_TRAVEL_DISTANCE(45mm) - 15mm
        """
        pass

    async def get_mag_position(self) -> float:
        """
        Default mag_position for the device is 0.0
        i.e. it boots with the current position as 0.0
        """
        pass

    async def move(self, position_mm) -> None:
        """
        Move the magnets along Z axis where the home position is 0.0;
        position_mm-> a point along Z. Does not self-check if the position
        is outside of the deck's linear range
        """
        pass

    async def get_device_info(self) -> Dict[str, str]:
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
        pass

    async def enter_programming_mode(self) -> None:
        """
        Enters and stays in DFU mode for 8 seconds.
        The module resets upon exiting the mode
        which causes the robot to lose serial connection to it.
        The connection can be restored by performing a .disconnect()
        followed by a .connect() to the same symlink node
        """
        pass
