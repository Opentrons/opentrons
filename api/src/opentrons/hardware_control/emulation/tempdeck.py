"""An emulation of the opentrons temperature module.

The purpose is to provide a fake backend that responds to GCODE commands.
"""

import logging
from typing import Optional

from opentrons.drivers.temp_deck.driver import GCODES
from opentrons.hardware_control.emulation import util
from opentrons.hardware_control.emulation.parser import Parser, Command

from .abstract_emulator import AbstractEmulator


logger = logging.getLogger(__name__)

GCODE_GET_TEMP = GCODES['GET_TEMP']
GCODE_SET_TEMP = GCODES['SET_TEMP']
GCODE_DEVICE_INFO = GCODES['DEVICE_INFO']
GCODE_DISENGAGE = GCODES['DISENGAGE']
GCODE_PROGRAMMING_MODE = GCODES['PROGRAMMING_MODE']

SERIAL = "temperature_emulator"
MODEL = "temp_deck_v20"
VERSION = "v2.0.1"


class TempDeckEmulator(AbstractEmulator):
    """TempDeck emulator"""

    def __init__(self, parser: Parser) -> None:
        self.target_temp = util.OptionalValue[float]()
        self.current_temp = 0.0
        self._parser = parser

    def handle(self, line: str) -> Optional[str]:
        """Handle a line"""
        results = (self._handle(c) for c in self._parser.parse(line))
        joined = ' '.join(r for r in results if r)
        return None if not joined else joined

    def _handle(self, command: Command) -> Optional[str]:
        """Handle a command."""
        logger.info(f"Got command {command}")
        if command.gcode == GCODE_GET_TEMP:
            return f"T:{self.target_temp} C:{self.current_temp}"
        elif command.gcode == GCODE_SET_TEMP:
            temperature = command.params['S']
            assert isinstance(temperature, float),\
                f"invalid temperature '{temperature}'"
            self.target_temp.val = temperature
            self.current_temp = self.target_temp.val
        elif command.gcode == GCODE_DISENGAGE:
            self.target_temp.val = None
            self.current_temp = util.TEMPERATURE_ROOM
        elif command.gcode == GCODE_DEVICE_INFO:
            return f"serial:{SERIAL} model:{MODEL} version:{VERSION}"
        elif command.gcode == GCODE_PROGRAMMING_MODE:
            pass
        return None
