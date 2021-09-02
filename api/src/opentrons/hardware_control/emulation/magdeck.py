"""An emulation of the opentrons magnetic module.

The purpose is to provide a fake backend that responds to GCODE commands.
"""

import logging
from typing import Optional
from opentrons.drivers.mag_deck.driver import GCODE
from opentrons.hardware_control.emulation.parser import Parser, Command
from .abstract_emulator import AbstractEmulator

logger = logging.getLogger(__name__)


SERIAL = "magnetic_emulator"
MODEL = "mag_deck_v20"
VERSION = "2.0.0"


class MagDeckEmulator(AbstractEmulator):
    """Magdeck emulator"""

    def __init__(self, parser: Parser) -> None:
        self.reset()
        self._parser = parser

    def handle(self, line: str) -> Optional[str]:
        """Handle a line"""
        results = (self._handle(c) for c in self._parser.parse(line))
        joined = " ".join(r for r in results if r)
        return None if not joined else joined

    def reset(self):
        self.height: float = 0
        self.position: float = 0

    def _handle(self, command: Command) -> Optional[str]:
        """Handle a command."""
        logger.info(f"Got command {command}")
        if command.gcode == GCODE.HOME:
            self.height = 0
        elif command.gcode == GCODE.MOVE:
            position = command.params["Z"]
            assert isinstance(position, float), f"invalid position '{position}'"
            self.position = position
        elif command.gcode == GCODE.PROBE_PLATE:
            self.height = 45
        elif command.gcode == GCODE.GET_PLATE_HEIGHT:
            return f"height:{self.height}"
        elif command.gcode == GCODE.GET_CURRENT_POSITION:
            return f"Z:{self.position}"
        elif command.gcode == GCODE.DEVICE_INFO:
            return f"serial:{SERIAL} model:{MODEL} version:{VERSION}"
        elif command.gcode == GCODE.PROGRAMMING_MODE:
            pass
        return None
