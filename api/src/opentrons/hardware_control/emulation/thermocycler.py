"""An emulation of the opentrons thermocycler module.

The purpose is to provide a fake backend that responds to GCODE commands.
"""

import logging
from typing import Optional
from opentrons.drivers.thermocycler.driver import GCODES
from opentrons.drivers.types import ThermocyclerLidStatus
from opentrons.hardware_control.emulation.parser import Parser, Command

from .abstract_emulator import AbstractEmulator
from . import util

logger = logging.getLogger(__name__)

GCODE_OPEN_LID = GCODES['OPEN_LID']
GCODE_CLOSE_LID = GCODES['CLOSE_LID']
GCODE_GET_LID_STATUS = GCODES['GET_LID_STATUS']
GCODE_SET_LID_TEMP = GCODES['SET_LID_TEMP']
GCODE_GET_LID_TEMP = GCODES['GET_LID_TEMP']
GCODE_EDIT_PID_PARAMS = GCODES['EDIT_PID_PARAMS']
GCODE_SET_PLATE_TEMP = GCODES['SET_PLATE_TEMP']
GCODE_GET_PLATE_TEMP = GCODES['GET_PLATE_TEMP']
GCODE_SET_RAMP_RATE = GCODES['SET_RAMP_RATE']
GCODE_DEACTIVATE_ALL = GCODES['DEACTIVATE_ALL']
GCODE_DEACTIVATE_LID = GCODES['DEACTIVATE_LID']
GCODE_DEACTIVATE_BLOCK = GCODES['DEACTIVATE_BLOCK']
GCODE_DEVICE_INFO = GCODES['DEVICE_INFO']

SERIAL = "thermocycler_emulator"
MODEL = "v02"
VERSION = "v1.1.0"


class ThermocyclerEmulator(AbstractEmulator):
    """Thermocycler emulator"""

    def __init__(self, parser: Parser) -> None:
        self.lid_target_temp = util.OptionalValue[float]()
        self.lid_current_temp: float = util.TEMPERATURE_ROOM
        self.lid_status = ThermocyclerLidStatus.CLOSED
        self.lid_at_target: Optional[bool] = None
        self.plate_total_hold_time = util.OptionalValue[float]()
        self.plate_time_remaining = util.OptionalValue[float]()
        self.plate_target_temp = util.OptionalValue[float]()
        self.plate_current_temp: float = util.TEMPERATURE_ROOM
        self.plate_volume = util.OptionalValue[float]()
        self.plate_at_target = util.OptionalValue[float]()
        self.plate_ramp_rate = util.OptionalValue[float]()
        self._parser = parser

    def handle(self, line: str) -> Optional[str]:
        """Handle a line"""
        results = (self._handle(c) for c in self._parser.parse(line))
        joined = ' '.join(r for r in results if r)
        return None if not joined else joined

    def _handle(self, command: Command) -> Optional[str]:  # noqa: C901
        """
        Handle a command.

        TODO: AL 20210218 create dispatch map and remove 'noqa(C901)'
        """
        logger.info(f"Got command {command}")
        if command.gcode == GCODE_OPEN_LID:
            self.lid_status = ThermocyclerLidStatus.OPEN
        elif command.gcode == GCODE_CLOSE_LID:
            self.lid_status = ThermocyclerLidStatus.CLOSED
        elif command.gcode == GCODE_GET_LID_STATUS:
            return f"Lid:{self.lid_status}"
        elif command.gcode == GCODE_SET_LID_TEMP:
            temperature = command.params['S']
            assert isinstance(temperature, float),\
                f"invalid temperature '{temperature}'"
            self.lid_target_temp.val = temperature
            self.lid_current_temp = self.lid_target_temp.val
        elif command.gcode == GCODE_GET_LID_TEMP:
            return f"T:{self.lid_target_temp} C:{self.lid_current_temp} " \
                   f"H:none Total_H:none At_target?:0"
        elif command.gcode == GCODE_EDIT_PID_PARAMS:
            pass
        elif command.gcode == GCODE_SET_PLATE_TEMP:
            for prefix, value in command.params.items():
                assert isinstance(value, float), f"invalid value '{value}'"
                if prefix == 'S':
                    self.plate_target_temp.val = value
                    self.plate_current_temp = self.plate_target_temp.val
                elif prefix == 'V':
                    self.plate_volume.val = value
                elif prefix == 'H':
                    self.plate_total_hold_time.val = value
                    self.plate_time_remaining.val = value
        elif command.gcode == GCODE_GET_PLATE_TEMP:
            return f"T:{self.plate_target_temp} " \
                   f"C:{self.plate_current_temp} " \
                   f"H:{self.plate_time_remaining} " \
                   f"Total_H:{self.plate_total_hold_time} " \
                   f"At_target?:{self.plate_at_target}"
        elif command.gcode == GCODE_SET_RAMP_RATE:
            self.plate_ramp_rate.val = command.params['S']
        elif command.gcode == GCODE_DEACTIVATE_ALL:
            pass
        elif command.gcode == GCODE_DEACTIVATE_LID:
            pass
        elif command.gcode == GCODE_DEACTIVATE_BLOCK:
            pass
        elif command.gcode == GCODE_DEVICE_INFO:
            return f"serial:{SERIAL} model:{MODEL} version:{VERSION}"
        return None

    @staticmethod
    def get_terminator() -> bytes:
        return b'\r\n'
