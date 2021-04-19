import logging
from typing import Optional, List
from opentrons.drivers.mag_deck.driver import GCODES
from .abstract_emulator import AbstractEmulator

logger = logging.getLogger(__name__)

GCODE_HOME = GCODES['HOME']
GCODE_MOVE = GCODES['MOVE']
GCODE_PROBE = GCODES['PROBE_PLATE']
GCODE_GET_PROBED_DISTANCE = GCODES['GET_PLATE_HEIGHT']
GCODE_GET_POSITION = GCODES['GET_CURRENT_POSITION']
GCODE_DEVICE_INFO = GCODES['DEVICE_INFO']
GCODE_DFU = GCODES['PROGRAMMING_MODE']

SERIAL = "fake_serial"
MODEL = "magdeck_emulator"
VERSION = 1


class MagDeckEmulator(AbstractEmulator):
    """Magdeck emulator"""

    def __init__(self) -> None:
        self.height = 0
        self.position = 0

    def handle(self, words: List[str]) -> Optional[str]:
        """Handle a command."""
        cmd = words[0]
        logger.info(f"Got command {cmd}")
        if cmd == GCODE_HOME:
            pass
        elif cmd == GCODE_MOVE:
            pass
        elif cmd == GCODE_PROBE:
            pass
        elif cmd == GCODE_GET_PROBED_DISTANCE:
            return f"height:{self.height}"
        elif cmd == GCODE_GET_POSITION:
            return f"Z:{self.position}"
        elif cmd == GCODE_DEVICE_INFO:
            return f"serial:{SERIAL} model:{MODEL} version:{VERSION}"
        elif cmd == GCODE_DFU:
            pass
        return None
