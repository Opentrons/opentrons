import logging
from queue import Queue
from typing import Callable, Optional, Mapping, Tuple

log = logging.getLogger(__name__)

GCODES = {
    'OPEN_LID': 'M126',
    'CLOSE_LID': 'M127',
    'GET_LID_STATUS': 'M119',
    'SET_LID_TEMP': 'M140',
    'GET_LID_TEMP': 'M141',
    'EDIT_PID_PARAMS': 'M301',
    'SET_PLATE_TEMP': 'M104',
    'GET_PLATE_TEMP': 'M105',
    'SET_RAMP_RATE': 'M566',
    'DEACTIVATE_ALL': 'M18',
    'DEACTIVATE_LID': 'M108',
    'DEACTIVATE_BLOCK': 'M14',
    'DEVICE_INFO': 'M115'
}
LID_TARGET_DEFAULT = 105.0    # Degree celsius (floats)
LID_TARGET_MIN = 37.0
LID_TARGET_MAX = 110.0
BLOCK_TARGET_MIN = 0.0
BLOCK_TARGET_MAX = 99.0
TEMP_UPDATE_RETRIES = 50
TEMP_BUFFER_MAX_LEN = 10


TC_BAUDRATE = 115200
TC_BOOTLOADER_BAUDRATE = 1200
# TODO (Laura 20190327) increased the thermocycler command timeout
# temporarily until we can change the firmware to asynchronously handle
# the lid being open and closed
SERIAL_ACK = '\r\n'
TC_COMMAND_TERMINATOR = SERIAL_ACK
TC_ACK = 'ok' + SERIAL_ACK + 'ok' + SERIAL_ACK
ERROR_KEYWORD = 'error'
DEFAULT_TC_TIMEOUT = 40
DEFAULT_COMMAND_RETRIES = 3
DEFAULT_STABILIZE_DELAY = 0.1
DEFAULT_POLLER_WAIT_SECONDS = 0.1
POLLING_FREQUENCY_MS = 1000
HOLD_TIME_FUZZY_SECONDS = POLLING_FREQUENCY_MS / 1000 * 5
TEMP_THRESHOLD = 0.3


class ThermocyclerError(Exception):
    pass


class Thermocycler:
    def __init__(self):
        pass

    async def connect(self, port: str) -> 'Thermocycler':
        return self

    async def disconnect(self) -> 'Thermocycler':
        return self

    async def deactivate_all(self):
        pass

    async def deactivate_lid(self) -> None:
        pass

    async def deactivate_block(self):
        pass

    async def is_connected(self) -> bool:
        pass

    async def open(self):
        pass

    async def close(self):
        pass

    def hold_time_probably_set(self, new_hold_time: Optional[float]) -> bool:
        """
        Since we can only get hold time *remaining* from TC, by the time we
        read hold_time after a set_temperature, the hold_time in TC could have
        started counting down. So instead of checking for equality, we will
        have to check if the hold_time returned from TC is within a few seconds
        of the new hold time. The number of seconds is determined by status
        polling frequency.
        """
        if new_hold_time is None:
            return True
        if self._hold_time is None:
            return False
        lower_bound = max(0.0, new_hold_time - HOLD_TIME_FUZZY_SECONDS)
        return lower_bound <= self._hold_time <= new_hold_time

    async def set_temperature(self,
                              temp: float,
                              hold_time: float = None,
                              ramp_rate: float = None,
                              volume: float = None) -> None:
        pass

    async def set_lid_temperature(self, temp: float) -> None:
        pass

    @property
    def temperature(self) -> float:
        pass

    @property
    def target(self) -> float:
        pass

    @property
    def hold_time(self) -> float:
        pass

    @property
    def ramp_rate(self) -> float:
        pass

    @property
    def lid_temp_status(self) -> str:
        pass

    @property
    def status(self) -> str:
        pass

    @property
    def port(self) -> Optional[str]:
        pass

    @property
    def lid_status(self) -> str:
        pass

    @property
    def lid_temp(self) -> float:
        pass

    @property
    def lid_target(self) -> float:
        pass

    async def get_device_info(self) -> Mapping[str, str]:
        pass
