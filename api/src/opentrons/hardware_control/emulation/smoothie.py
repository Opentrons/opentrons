"""An emulation of the Smoothie.

The purpose is to provide a fake backend that responds to the GCODE sent by the
Opentrons smoothie driver.
"""
import logging
import re
from typing import Optional, Dict

from opentrons import _find_smoothie_file
from opentrons.drivers import utils
from opentrons.drivers.smoothie_drivers import HOMED_POSITION
from opentrons.drivers.smoothie_drivers.driver_3_0 import GCODE
from opentrons.hardware_control.emulation.parser import Command, Parser

from .abstract_emulator import AbstractEmulator
from .settings import SmoothieSettings

logger = logging.getLogger(__name__)


class SmoothieEmulator(AbstractEmulator):
    """Smoothie emulator"""

    WRITE_INSTRUMENT_RE = re.compile(r"(?P<mount>[LR])\s*(?P<value>[a-f0-9]+)")

    def __init__(self, parser: Parser, settings: SmoothieSettings) -> None:
        """Constructor"""
        _, fw_version = _find_smoothie_file()
        self._version_string = \
            f"Build version: {fw_version}, Build date: CURRENT, " \
            f"MCU: NONE, System Clock: NONE"

        self._pos = {
            'A': 0.0,
            'B': 0.0,
            'C': 0.0,
            'X': 0.0,
            'Y': 0.0,
            'Z': 0.0
        }
        self._home_status: Dict[str, bool] = {
            'X': False,
            'Y': False,
            'Z': False,
            'A': False,
            'B': False,
            'C': False,
        }
        self._speed = 0.0
        self._pipette_model = {
            "L": utils.string_to_hex(settings.left.model, 64),
            "R": utils.string_to_hex(settings.right.model, 64)
        }
        self._pipette_id = {
            "L": utils.string_to_hex(settings.left.id, 64),
            "R": utils.string_to_hex(settings.right.id, 64),
        }
        self._parser = parser

    def handle(self, line: str) -> Optional[str]:
        """Handle a line"""
        results = (self._handle(c) for c in self._parser.parse(line))
        joined = ' '.join(r for r in results if r)
        return None if not joined else joined

    def __get_homing_status(self) -> str:
        """Get the current homing status of the emulated gantry"""
        return " ".join(f"{k}:{int(v)}" for k, v in self._home_status.items())

    def __get_current_position(self, command_g_code) -> str:
        """Get the current position of the emulated gantry"""
        pos_string = " ".join(f"{k}:{v}" for k, v in self._pos.items())
        return f"{command_g_code}\r\n\r\nok MCS: {pos_string}"

    def __get_version(self) -> str:
        """Get the current firmware version"""
        return self._version_string

    def __get_pipette_id(self, command_params) -> Optional[str]:
        """Get the current id of the specified pipette"""
        pipette_postion = None

        if "L" in command_params:
            pipette_postion = f"L:{self._pipette_id['L']}"
        elif "R" in command_params:
            pipette_postion = f"R:{self._pipette_id['R']}"

        return pipette_postion

    def __get_pipette_model(self, command_params) -> Optional[str]:
        """Get the current model of the specified pipette"""
        pipette_model = None

        if "L" in command_params:
            pipette_model = f"L:{self._pipette_model['L']}"
        elif "R" in command_params:
            pipette_model = f"R:{self._pipette_model['R']}"

        return pipette_model

    def __set_pipette_id(self, command):
        """Sets the id for the pipette"""
        self._pipette_id.update(self._mount_strings(command))

    def __set_pipette_model(self, command):
        """Sets the model for the pipette"""
        self._pipette_model.update(self._mount_strings(command))

    def __move_gantry(self, command):
        """Moves the gantry to the position provided in the command"""
        for key, value in command.params.items():
            assert isinstance(value, float), f"invalid value '{value}'"
            if 'F' == key:
                self._speed = value
            else:
                self._pos[key] = value

    def __home_gantry(self, command):
        """Returns gantry to home position"""
        for axis in command.params.keys():
            self._pos[axis] = HOMED_POSITION[axis]
            self._home_status[axis] = True

    def _handle(self, command: Command) -> Optional[str]:  # noqa: C901
        """Handle a command."""
        logger.info(f"Got command {command}")

        command_return = None

        if command.gcode == GCODE.HOMING_STATUS:
            command_return = self.__get_homing_status()
        elif command.gcode == GCODE.CURRENT_POSITION:
            command_return = self.__get_current_position(command.gcode)
        elif command.gcode == GCODE.VERSION:
            command_return = self.__get_version()
        elif command.gcode == GCODE.READ_INSTRUMENT_ID:
            command_return = self.__get_pipette_id(command.params)
        elif command.gcode == GCODE.READ_INSTRUMENT_MODEL:
            command_return = self.__get_pipette_model(command.params)
        elif command.gcode == GCODE.WRITE_INSTRUMENT_ID:
            self.__set_pipette_id(command)
        elif command.gcode == GCODE.WRITE_INSTRUMENT_MODEL:
            self.__set_pipette_model(command)
        elif command.gcode == GCODE.MOVE:
            self.__move_gantry(command)
        elif command.gcode == GCODE.HOME:
            self.__home_gantry(command)

        return command_return

    @staticmethod
    def _mount_strings(command: Command) -> Dict[str, str]:
        """
        Parse the body of the command for the mount strings.

        Write instrument id and model use the format:
            MOUNT VALUE
        where MOUNT is either L or R and VALUE is a string of ascii codes.

        Args:
            command: Command

        Returns:
            A dict of L and/or R to the string value following it.
        """
        pars = (i.groupdict() for i in
                SmoothieEmulator.WRITE_INSTRUMENT_RE.finditer(command.body))
        result = {p['mount']: p['value'] for p in pars}
        assert result, f"missing mount values '{command.body}'"
        return result
