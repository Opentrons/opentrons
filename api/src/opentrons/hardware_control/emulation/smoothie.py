"""An emulation of the Smoothie.

The purpose is to provide a fake backend that responds to the GCODE sent by the
Opentrons smoothie driver.
"""
import logging
import re
from typing import Optional, Dict

from opentrons import _find_smoothie_file
from opentrons.drivers import utils
from opentrons.drivers.smoothie_drivers.constants import GCODE, HOMED_POSITION
from opentrons.hardware_control.emulation.parser import Command, Parser

from .abstract_emulator import AbstractEmulator
from .settings import SmoothieSettings

logger = logging.getLogger(__name__)


class SmoothieEmulator(AbstractEmulator):
    """Smoothie emulator"""

    WRITE_INSTRUMENT_RE = re.compile(r"(?P<mount>[LR])\s*(?P<value>[a-f0-9]+)")
    INSTRUMENT_AND_MODEL_STRING_LENGTH = 64

    _version_string: str
    _pos: Dict[str, float]
    _home_status: Dict[str, bool]
    _speed: float
    _pipette_model: Dict[str, str]
    _pipette_id: Dict[str, str]

    def __init__(self, parser: Parser, settings: SmoothieSettings) -> None:
        """Constructor.

        Args:
            parser: GCODE Parser.
            settings: emulator settings.
        """
        self._parser = parser
        self._settings = settings
        self._gcode_to_function_mapping = {
            GCODE.HOMING_STATUS.value: self._get_homing_status,
            GCODE.CURRENT_POSITION.value: self._get_current_position,
            GCODE.VERSION.value: self._get_version,
            GCODE.READ_INSTRUMENT_ID.value: self._get_pipette_id,
            GCODE.READ_INSTRUMENT_MODEL.value: self._get_pipette_model,
            GCODE.WRITE_INSTRUMENT_ID.value: self._set_pipette_id,
            GCODE.WRITE_INSTRUMENT_MODEL.value: self._set_pipette_model,
            GCODE.MOVE.value: self._move_gantry,
            GCODE.HOME.value: self._home_gantry,
        }
        self.reset()

    def handle(self, line: str) -> Optional[str]:
        """Handle a line"""
        results = (self._handle(c) for c in self._parser.parse(line))
        joined = " ".join(r for r in results if r)
        return None if not joined else joined

    def reset(self) -> None:
        _, fw_version = _find_smoothie_file()
        self._version_string = (
            f"Build version: {fw_version}, Build date: CURRENT, "
            f"MCU: NONE, System Clock: NONE"
        )

        self._pos = {"A": 0.0, "B": 0.0, "C": 0.0, "X": 0.0, "Y": 0.0, "Z": 0.0}
        self._home_status: Dict[str, bool] = {
            "X": False,
            "Y": False,
            "Z": False,
            "A": False,
            "B": False,
            "C": False,
        }
        self._speed = 0.0

        self._pipette_model = {
            "L": utils.string_to_hex(
                self._settings.left.model, self.INSTRUMENT_AND_MODEL_STRING_LENGTH
            ),
            "R": utils.string_to_hex(
                self._settings.right.model, self.INSTRUMENT_AND_MODEL_STRING_LENGTH
            ),
        }

        self._pipette_id = {
            "L": utils.string_to_hex(
                self._settings.left.id, self.INSTRUMENT_AND_MODEL_STRING_LENGTH
            ),
            "R": utils.string_to_hex(
                self._settings.right.id, self.INSTRUMENT_AND_MODEL_STRING_LENGTH
            ),
        }

    def get_current_position(self) -> Dict[str, float]:
        return self._pos

    def _get_homing_status(self, command: Command) -> str:
        """Get the current homing status of the emulated gantry"""
        return " ".join(f"{k}:{int(v)}" for k, v in self._home_status.items())

    def _get_current_position(self, command: Command) -> str:
        """Get the current position of the emulated gantry"""
        pos_string = " ".join(f"{k}:{v}" for k, v in self._pos.items())
        return f"{command.gcode}\r\n\r\nok MCS: {pos_string}"

    def _get_version(self, command: Command) -> str:
        """Get the current firmware version"""
        return self._version_string

    def _get_pipette_id(self, command: Command) -> Optional[str]:
        """Get the current id of the specified pipette"""
        pipette_postion = None

        if "L" in command.params:
            pipette_postion = f"L:{self._pipette_id['L']}"
        elif "R" in command.params:
            pipette_postion = f"R:{self._pipette_id['R']}"

        return pipette_postion

    def _get_pipette_model(self, command: Command) -> Optional[str]:
        """Get the current model of the specified pipette"""
        pipette_model = None

        if "L" in command.params:
            pipette_model = f"L:{self._pipette_model['L']}"
        elif "R" in command.params:
            pipette_model = f"R:{self._pipette_model['R']}"

        return pipette_model

    def _set_pipette_id(self, command: Command) -> None:
        """Sets the id for the pipette"""
        self._pipette_id.update(self._mount_strings(command))

    def _set_pipette_model(self, command: Command) -> None:
        """Sets the model for the pipette"""
        self._pipette_model.update(self._mount_strings(command))

    def _move_gantry(self, command: Command) -> None:
        """Moves the gantry to the position provided in the command"""
        for key, value in command.params.items():
            assert isinstance(value, float), f"invalid value '{value}'"
            if "F" == key:
                self._speed = value
            else:
                self._pos[key] = value

    def _home_gantry(self, command: Command) -> None:
        """Returns gantry to home position"""
        for axis in command.params.keys():
            self._pos[axis] = HOMED_POSITION[axis]
            self._home_status[axis] = True

    def _handle(self, command: Command) -> Optional[str]:
        """Handle a command."""
        logger.info(f"Got command {command}")
        func_to_run = self._gcode_to_function_mapping.get(command.gcode)
        return None if func_to_run is None else func_to_run(command)

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
        pars = (
            i.groupdict()
            for i in SmoothieEmulator.WRITE_INSTRUMENT_RE.finditer(command.body)
        )
        result = {
            p["mount"]: p["value"]
            + "0"
            * (SmoothieEmulator.INSTRUMENT_AND_MODEL_STRING_LENGTH - len(p["value"]))
            for p in pars
        }

        assert result, f"missing mount values '{command.body}'"
        return result
