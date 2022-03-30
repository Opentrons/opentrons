"""An emulation of the opentrons thermocycler module.

The purpose is to provide a fake backend that responds to GCODE commands.
"""

import logging
from typing import Optional
from opentrons.drivers.thermocycler.driver import GCODE
from opentrons.drivers.types import ThermocyclerLidStatus
from opentrons.hardware_control.emulation.parser import Parser, Command
from opentrons.hardware_control.emulation.settings import ThermocyclerSettings

from .abstract_emulator import AbstractEmulator
from .simulations import Temperature, TemperatureWithHold
from . import util

logger = logging.getLogger(__name__)


class ThermocyclerEmulator(AbstractEmulator):
    """Thermocycler emulator"""

    _lid_temperature: Temperature
    _plate_temperature: TemperatureWithHold
    lid_status: ThermocyclerLidStatus
    plate_volume: util.OptionalValue[float]
    plate_ramp_rate: util.OptionalValue[float]

    def __init__(self, parser: Parser, settings: ThermocyclerSettings) -> None:
        self._parser = parser
        self._settings = settings
        self.reset()

    def handle(self, line: str) -> Optional[str]:
        """Handle a line"""
        results = (self._handle(c) for c in self._parser.parse(line))
        joined = " ".join(r for r in results if r)
        return None if not joined else joined

    def reset(self) -> None:
        self._lid_temperature = Temperature(
            per_tick=self._settings.lid_temperature.degrees_per_tick,
            current=self._settings.lid_temperature.starting,
        )
        self._plate_temperature = TemperatureWithHold(
            per_tick=self._settings.plate_temperature.degrees_per_tick,
            current=self._settings.plate_temperature.starting,
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
            self._lid_temperature.set_target(temperature)
        elif command.gcode == GCODE.GET_LID_TEMP:
            res = (
                f"T:{util.OptionalValue(self._lid_temperature.target)} "
                f"C:{self._lid_temperature.current} "
                f"H:none Total_H:none"
            )
            self._lid_temperature.tick()
            return res
        elif command.gcode == GCODE.EDIT_PID_PARAMS:
            pass
        elif command.gcode == GCODE.SET_PLATE_TEMP:
            for prefix, value in command.params.items():
                assert isinstance(value, float), f"invalid value '{value}'"
                if prefix == "S":
                    self._plate_temperature.set_target(value)
                elif prefix == "V":
                    self.plate_volume.val = value
                elif prefix == "H":
                    self._plate_temperature.set_hold(value)
        elif command.gcode == GCODE.GET_PLATE_TEMP:
            plate_target = util.OptionalValue(self._plate_temperature.target)
            plate_current = self._plate_temperature.current
            plate_time_remaining = util.OptionalValue(
                self._plate_temperature.time_remaining
            )
            plate_total_hold_time = util.OptionalValue(
                self._plate_temperature.total_hold
            )

            res = (
                f"T:{plate_target} "
                f"C:{plate_current} "
                f"H:{plate_time_remaining} "
                f"Total_H:{plate_total_hold_time} "
            )
            self._plate_temperature.tick()
            return res
        elif command.gcode == GCODE.SET_RAMP_RATE:
            self.plate_ramp_rate.val = command.params["S"]
        elif command.gcode == GCODE.DEACTIVATE_ALL:
            self._plate_temperature.deactivate(temperature=util.TEMPERATURE_ROOM)
            self._lid_temperature.deactivate(temperature=util.TEMPERATURE_ROOM)
        elif command.gcode == GCODE.DEACTIVATE_LID:
            self._lid_temperature.deactivate(temperature=util.TEMPERATURE_ROOM)
        elif command.gcode == GCODE.DEACTIVATE_BLOCK:
            self._plate_temperature.deactivate(temperature=util.TEMPERATURE_ROOM)
        elif command.gcode == GCODE.DEVICE_INFO:
            return (
                f"serial:{self._settings.serial_number} "
                f"model:{self._settings.model} "
                f"version:{self._settings.version}"
            )
        return None

    @staticmethod
    def get_terminator() -> bytes:
        return b"\r\n"
