import logging
from typing import Optional, List
import enum
from opentrons.drivers.thermocycler.driver import GCODES
from .abstract_emulator import AbstractEmulator

logger = logging.getLogger(__name__)

GCODE_OPEN_LID = GCODES['OPEN_LID']
GCODE_CLOSE_LID = GCODES['CLOSE_LID']
GCODE_GET_LID_STATUS = GCODES['GET_LID_STATUS']
GCODE_SET_LID_TEMP = GCODES['SET_LID_TEMP']
GCODE_GET_LID_TEMP = GCODES['GET_LID_TEMP']
GCODE_EDIT_PID_PARAMS = GCODES['EDIT_PID_PARAMS']
GCODE_SET_PLATE_TEMP = GCODES['SET_PLATE_TEMP']
GCODE_GET_PLATE_TEMP = GCODES['GET_PLATE_TEMP']
GCODE_SET_RAMP_RATE = GCODES['SET_RAMP_RATE']
GCODE_DEACTIVATE_ALL = GCODES['DEACTIVATE_ALL']
GCODE_DEACTIVATE_LID = GCODES['DEACTIVATE_LID']
GCODE_DEACTIVATE_BLOCK = GCODES['DEACTIVATE_BLOCK']
GCODE_DEVICE_INFO = GCODES['DEVICE_INFO']

SERIAL = "fake_serial"
MODEL = "thermocycler_emulator"
VERSION = 1


class LidStatus(str, enum.Enum):
    IN_BETWEEN = 'in_between'
    CLOSED = 'closed'
    OPEN = 'open'
    UNKNOWN = 'unknown'
    MAX = 'max'


class ThermocyclerEmulator(AbstractEmulator):
    """Thermocycler emulator"""

    def __init__(self) -> None:
        self.target_temp = 0
        self.current_temp = 0
        self.lid_status = LidStatus.CLOSED
        self.at_target = None
        self.total_hold_time = None
        self.time_remaining = None

    def handle(self, words: List[str]) -> Optional[str]:  # noqa: C901
        """
        Handle a command.

        TODO: AL 20210218 create dispatch map and remove 'noqa(C901)'
        """
        cmd = words[0]
        logger.info(f"Got command {cmd}")
        if cmd == GCODE_OPEN_LID:
            pass
        elif cmd == GCODE_CLOSE_LID:
            pass
        elif cmd == GCODE_GET_LID_STATUS:
            return f"Lid:{self.lid_status}"
        elif cmd == GCODE_SET_LID_TEMP:
            pass
        elif cmd == GCODE_GET_LID_TEMP:
            return f"T:{self.target_temp} C:{self.current_temp} " \
                   f"H:none Total_H:none At_target?:0"
        elif cmd == GCODE_EDIT_PID_PARAMS:
            pass
        elif cmd == GCODE_SET_PLATE_TEMP:
            pass
        elif cmd == GCODE_GET_PLATE_TEMP:
            return f"T:{self.target_temp} C:{self.current_temp} " \
                   f"H:{self.time_remaining} Total_H:{self.total_hold_time} " \
                   f"At_target?:{self.at_target}"
        elif cmd == GCODE_SET_RAMP_RATE:
            pass
        elif cmd == GCODE_DEACTIVATE_ALL:
            pass
        elif cmd == GCODE_DEACTIVATE_LID:
            pass
        elif cmd == GCODE_DEACTIVATE_BLOCK:
            pass
        elif cmd == GCODE_DEVICE_INFO:
            return f"serial:{SERIAL} model:{MODEL} version:{VERSION}"
        return None

    @staticmethod
    def get_terminator() -> bytes:
        return b'\r\n'
