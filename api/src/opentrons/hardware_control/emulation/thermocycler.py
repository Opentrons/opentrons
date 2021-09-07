"""An emulation of the opentrons thermocycler module.

The purpose is to provide a fake backend that responds to GCODE commands.
"""

import logging
from typing import Optional
from opentrons.drivers.thermocycler.driver import GCODE
from opentrons.drivers.types import ThermocyclerLidStatus
from opentrons.hardware_control.emulation.parser import Parser, Command

from .abstract_emulator import AbstractEmulator
from .simulations import Temperature, TemperatureWithHold
from . import util

logger = logging.getLogger(__name__)


SERIAL = "thermocycler_emulator"
MODEL = "v02"
VERSION = "v1.1.0"


class ThermocyclerEmulator(AbstractEmulator):
    """Thermocycler emulator"""

    def __init__(self, parser: Parser) -> None:
        self.reset()
        self._parser = parser

    def handle(self, line: str) -> Optional[str]:
        """Handle a line"""
        results = (self._handle(c) for c in self._parser.parse(line))
        joined = " ".join(r for r in results if r)
        return None if not joined else joined

    def reset(self):
        self._lid_temperate = Temperature(per_tick=2, current=util.TEMPERATURE_ROOM)
        self._plate_temperate = TemperatureWithHold(
            per_tick=2, current=util.TEMPERATURE_ROOM
        )
        self.lid_status = ThermocyclerLidStatus.OPEN
        self.plate_volume = util.OptionalValue[float]()
        self.plate_ramp_rate = util.OptionalValue[float]()

    def _handle(self, command: Command) -> Optional[str]:  # noqa: C901
        """
        Handle a command.

        TODO: AL 20210218 create dispatch map and remove 'noqa(C901)'
        """
        logger.info(f"Got command {command}")
        if command.gcode == GCODE.OPEN_LID:
            self.lid_status = ThermocyclerLidStatus.OPEN
        elif command.gcode == GCODE.CLOSE_LID:
            self.lid_status = ThermocyclerLidStatus.CLOSED
        elif command.gcode == GCODE.GET_LID_STATUS:
            return f"Lid:{self.lid_status}"
        elif command.gcode == GCODE.SET_LID_TEMP:
            temperature = command.params["S"]
            assert isinstance(
                temperature, float
            ), f"invalid temperature '{temperature}'"
            self._lid_temperate.set_target(temperature)
        elif command.gcode == GCODE.GET_LID_TEMP:
            res = (
                f"T:{util.OptionalValue(self._lid_temperate.target)} "
                f"C:{self._lid_temperate.current} "
                f"H:none Total_H:none"
            )
            self._lid_temperate.tick()
            return res
        elif command.gcode == GCODE.EDIT_PID_PARAMS:
            pass
        elif command.gcode == GCODE.SET_PLATE_TEMP:
            for prefix, value in command.params.items():
                assert isinstance(value, float), f"invalid value '{value}'"
                if prefix == "S":
                    self._plate_temperate.set_target(value)
                elif prefix == "V":
                    self.plate_volume.val = value
                elif prefix == "H":
                    self._plate_temperate.set_hold(value)
        elif command.gcode == GCODE.GET_PLATE_TEMP:
            plate_target = util.OptionalValue(self._plate_temperate.target)
            plate_current = self._plate_temperate.current
            plate_time_remaining = util.OptionalValue(
                self._plate_temperate.time_remaining
            )
            plate_total_hold_time = util.OptionalValue(self._plate_temperate.total_hold)

            res = (
                f"T:{plate_target} "
                f"C:{plate_current} "
                f"H:{plate_time_remaining} "
                f"Total_H:{plate_total_hold_time} "
            )
            self._plate_temperate.tick()
            return res
        elif command.gcode == GCODE.SET_RAMP_RATE:
            self.plate_ramp_rate.val = command.params["S"]
        elif command.gcode == GCODE.DEACTIVATE_ALL:
            self._plate_temperate.deactivate(temperature=util.TEMPERATURE_ROOM)
            self._lid_temperate.deactivate(temperature=util.TEMPERATURE_ROOM)
        elif command.gcode == GCODE.DEACTIVATE_LID:
            self._lid_temperate.deactivate(temperature=util.TEMPERATURE_ROOM)
        elif command.gcode == GCODE.DEACTIVATE_BLOCK:
            self._plate_temperate.deactivate(temperature=util.TEMPERATURE_ROOM)
        elif command.gcode == GCODE.DEVICE_INFO:
            return f"serial:{SERIAL} model:{MODEL} version:{VERSION}"
        return None

    @staticmethod
    def get_terminator() -> bytes:
        return b"\r\n"
