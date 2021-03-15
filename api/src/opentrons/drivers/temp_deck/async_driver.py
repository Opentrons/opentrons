import logging
from typing import Optional, Mapping

"""
- Driver is responsible for providing an interface for the temp-deck
- Driver is the only system component that knows about the temp-deck's GCODES
  or how the temp-deck communications

- Driver is NOT responsible interpreting the temperatures or states in any way
  or knowing anything about what the device is being used for
"""

log = logging.getLogger(__name__)

ERROR_KEYWORD = 'error'
ALARM_KEYWORD = 'alarm'

DEFAULT_TEMP_DECK_TIMEOUT = 1

DEFAULT_STABILIZE_DELAY = 0.1
DEFAULT_COMMAND_RETRIES = 3

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

TEMP_DECK_MODELS = {
    'temperatureModuleV1': 'temp_deck_v1.1',
    'temperatureModuleV2': 'temp_deck_v20'
}


class TempDeckError(Exception):
    pass


class TempDeck:
    def __init__(self):
        pass

    async def connect(self, port=None) -> None:
        pass

    async def disconnect(self) -> None:
        pass

    async def is_connected(self) -> bool:
        pass

    @property
    def port(self) -> Optional[str]:
        pass

    async def deactivate(self) -> None:
        pass

    async def set_temperature(self, celsius: float) -> None:
        pass

    async def start_set_temperature(self, celsius: float) -> None:
        pass

    async def update_temperature(self, default: Optional[float] = None) -> None:
        pass

    @property
    def target(self) -> Optional[int]:
        pass

    @property
    def temperature(self) -> int:
        pass

    @property
    def status(self) -> str:
        pass

    async def get_device_info(self) -> Mapping[str, str]:
        """
        Queries Temp-Deck for its build version, model, and serial number

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
        pass
