import logging
from typing import Optional, List

from opentrons.drivers.temp_deck.driver import GCODES

from .abstract_emulator import AbstractEmulator

logger = logging.getLogger(__name__)

GCODE_GET_TEMP = GCODES['GET_TEMP']
GCODE_SET_TEMP = GCODES['SET_TEMP']
GCODE_DEVICE_INFO = GCODES['DEVICE_INFO']
GCODE_DISENGAGE = GCODES['DISENGAGE']
GCODE_DFU = GCODES['PROGRAMMING_MODE']

SERIAL = "fake_serial"
MODEL = "temp_emulator"
VERSION = 1


class TempDeckEmulator(AbstractEmulator):
    """TempDeck emulator"""

    def __init__(self) -> None:
        self.target_temp = 0
        self.current_temp = 0

    def handle(self, words: List[str]) -> Optional[str]:
        """Handle a command."""
        cmd = words[0]
        logger.info(f"Got command {cmd}")
        if cmd == GCODE_GET_TEMP:
            return f"T:{self.target_temp} C:{self.current_temp}"
        elif cmd == GCODE_SET_TEMP:
            pass
        elif cmd == GCODE_DISENGAGE:
            pass
        elif cmd == GCODE_DEVICE_INFO:
            return f"serial:{SERIAL} model:{MODEL} version:{VERSION}"
        elif cmd == GCODE_DFU:
            pass
        return None
