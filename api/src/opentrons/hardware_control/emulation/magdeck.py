"""An emulation of the opentrons magnetic module.

The purpose is to provide a fake backend that responds to GCODE commands.
"""

import logging
from typing import Optional
from opentrons.drivers.mag_deck.driver import GCODES
from opentrons.hardware_control.emulation.parser import Parser, Command
from .abstract_emulator import AbstractEmulator

logger = logging.getLogger(__name__)

GCODE_HOME = GCODES['HOME']
GCODE_MOVE = GCODES['MOVE']
GCODE_PROBE_PLATE = GCODES['PROBE_PLATE']
GCODE_GET_PLATE_HEIGHT = GCODES['GET_PLATE_HEIGHT']
GCODE_GET_CURRENT_POSITION = GCODES['GET_CURRENT_POSITION']
GCODE_DEVICE_INFO = GCODES['DEVICE_INFO']
GCODE_PROGRAMMING_MODE = GCODES['PROGRAMMING_MODE']

SERIAL = "magnetic_emulator"
MODEL = "mag_deck_v20"
VERSION = "2.0.0"


class MagDeckEmulator(AbstractEmulator):
    """Magdeck emulator"""

    def __init__(self, parser: Parser) -> None:
        self.height: float = 0
        self.position: float = 0
        self._parser = parser

    def handle(self, line: str) -> Optional[str]:
        """Handle a line"""
        results = (self._handle(c) for c in self._parser.parse(line))
        joined = ' '.join(r for r in results if r)
        return None if not joined else joined

    def _handle(self, command: Command) -> Optional[str]:
        """Handle a command."""
        logger.info(f"Got command {command}")
        if command.gcode == GCODE_HOME:
            self.height = 0
        elif command.gcode == GCODE_MOVE:
            position = command.params['Z']
            assert isinstance(position, float), f"invalid position '{position}'"
            self.position = position
        elif command.gcode == GCODE_PROBE_PLATE:
            self.height = 45
        elif command.gcode == GCODE_GET_PLATE_HEIGHT:
            return f"height:{self.height}"
        elif command.gcode == GCODE_GET_CURRENT_POSITION:
            return f"Z:{self.position}"
        elif command.gcode == GCODE_DEVICE_INFO:
            return f"serial:{SERIAL} model:{MODEL} version:{VERSION}"
        elif command.gcode == GCODE_PROGRAMMING_MODE:
            pass
        return None
