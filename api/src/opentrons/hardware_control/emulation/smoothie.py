import logging
from typing import Optional, List

from opentrons.drivers.smoothie_drivers.driver_3_0 import GCODES

from .abstract_emulator import AbstractEmulator

logger = logging.getLogger(__name__)

GCODE_HOME = GCODES['HOME']
GCODE_MOVE = GCODES['MOVE']
GCODE_DWELL = GCODES['DWELL']
GCODE_CURRENT_POSITION = GCODES['CURRENT_POSITION']
GCODE_LIMIT_SWITCH_STATUS = GCODES['LIMIT_SWITCH_STATUS']
GCODE_PROBE = GCODES['PROBE']
GCODE_ABSOLUTE_COORDS = GCODES['ABSOLUTE_COORDS']
GCODE_RELATIVE_COORDS = GCODES['RELATIVE_COORDS']
GCODE_RESET_FROM_ERROR = GCODES['RESET_FROM_ERROR']
GCODE_PUSH_SPEED = GCODES['PUSH_SPEED']
GCODE_POP_SPEED = GCODES['POP_SPEED']
GCODE_SET_SPEED = GCODES['SET_SPEED']
GCODE_STEPS_PER_MM = GCODES['STEPS_PER_MM']
GCODE_READ_INSTRUMENT_ID = GCODES['READ_INSTRUMENT_ID']
GCODE_WRITE_INSTRUMENT_ID = GCODES['WRITE_INSTRUMENT_ID']
GCODE_READ_INSTRUMENT_MODEL = GCODES['READ_INSTRUMENT_MODEL']
GCODE_WRITE_INSTRUMENT_MODEL = GCODES['WRITE_INSTRUMENT_MODEL']
GCODE_SET_MAX_SPEED = GCODES['SET_MAX_SPEED']
GCODE_SET_CURRENT = GCODES['SET_CURRENT']
GCODE_DISENGAGE_MOTOR = GCODES['DISENGAGE_MOTOR']
GCODE_HOMING_STATUS = GCODES['HOMING_STATUS']
GCODE_ACCELERATION = GCODES['ACCELERATION']
GCODE_WAIT = GCODES['WAIT']
GCODE_retract = 'M365.3'
GCODE_debounce = 'M365.2'
GCODE_max_travel = 'M365.1'
GCODE_home = 'M365.0'
GCODE_version = 'version'

v = """Build version: EMULATOR, Build date: CURRENT, MCU: NONE, System Clock: NONE"""


class SmoothieEmulator(AbstractEmulator):
    """Smoothie emulator"""

    def __init__(self) -> None:
        self.x = self.y = self.z = self.a = self.b = self.c = 0.00

    def handle(self, words: List[str]) -> Optional[str]:
        """Handle a command."""
        cmd = words[0]
        logger.info(f"Got command {cmd}")
        if GCODE_HOMING_STATUS == cmd:
            return "X:0 Y:0 Z:0 A:0 B:0 C:0"
        elif GCODE_CURRENT_POSITION == cmd:
            return f"{cmd}\r\n\r\nok MCS: X:{self.x} Y:{self.y} " \
                   f"Z:{self.z} A:{self.a} B:{self.b} C:{self.c}"
        elif GCODE_version == cmd:
            return v
        return None
