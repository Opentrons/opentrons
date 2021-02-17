import logging
from typing import Optional
from .base import CommandProcessor

logger = logging.getLogger(__name__)

GCODE_HOME = "G28.2"
GCODE_MOVE = "G0"
GCODE_PROBE = "G38.2"
GCODE_GET_PROBED_DISTANCE = "M836"
GCODE_GET_POSITION = "M114.2"
GCODE_DEVICE_INFO = "M115"
GCODE_DFU = "dfu"

SERIAL = "fake_serial"
MODEL = "magdeck_emulator"
VERSION = 1


class MagDeck(CommandProcessor):
    """"""
    def handle(self, cmd: str, payload: str) -> Optional[str]:
        """"""
        logger.info(f"Got command {cmd}")
        if cmd == GCODE_HOME:
            pass
        elif cmd == GCODE_MOVE:
            pass
        elif cmd == GCODE_PROBE:
            pass
        elif cmd == GCODE_GET_PROBED_DISTANCE:
            height = 321
            return f"height:{height}"
        elif cmd == GCODE_GET_POSITION:
            pos = 3.2
            return f"Z:{pos}"
        elif cmd == GCODE_DEVICE_INFO:
            return f"serial:{SERIAL} model:{MODEL} version:{VERSION}"
        elif cmd == GCODE_DFU:
            pass
        return None
