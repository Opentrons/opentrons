"""An emulation of the opentrons temperature module.

The purpose is to provide a fake backend that responds to GCODE commands.
"""

import logging
from typing import Optional

from opentrons.drivers.temp_deck.driver import GCODE
from opentrons.hardware_control.emulation import util
from opentrons.hardware_control.emulation.parser import Parser, Command
from opentrons.hardware_control.emulation.settings import TempDeckSettings

from .abstract_emulator import AbstractEmulator
from .simulations import Temperature


logger = logging.getLogger(__name__)


class TempDeckEmulator(AbstractEmulator):
    """TempDeck emulator"""

    _temperature: Temperature

    def __init__(self, parser: Parser, settings: TempDeckSettings) -> None:
        self._settings = settings
        self._parser = parser
        self.reset()

    def handle(self, line: str) -> Optional[str]:
        """Handle a line"""
        results = (self._handle(c) for c in self._parser.parse(line))
        joined = " ".join(r for r in results if r)
        return None if not joined else joined

    def reset(self) -> None:
        self._temperature = Temperature(
            per_tick=self._settings.temperature.degrees_per_tick,
            current=self._settings.temperature.starting,
        )

    def _handle(self, command: Command) -> Optional[str]:
        """Handle a command."""
        logger.info(f"Got command {command}")
        if command.gcode == GCODE.GET_TEMP:
            res = (
                f"T:{util.OptionalValue(self._temperature.target)} "
                f"C:{self._temperature.current}"
            )
            self._temperature.tick()
            return res
        elif command.gcode == GCODE.SET_TEMP:
            temperature = command.params["S"]
            assert isinstance(
                temperature, float
            ), f"invalid temperature '{temperature}'"
            self._temperature.set_target(temperature)
        elif command.gcode == GCODE.DISENGAGE:
            self._temperature.deactivate(util.TEMPERATURE_ROOM)
        elif command.gcode == GCODE.DEVICE_INFO:
            return (
                f"serial:{self._settings.serial_number} "
                f"model:{self._settings.model} "
                f"version:{self._settings.version}"
            )
        elif command.gcode == GCODE.PROGRAMMING_MODE:
            pass
        return None
