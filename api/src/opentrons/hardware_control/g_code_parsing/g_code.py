from __future__ import annotations

import re
from typing import List

from .errors import UnparsableGCodeError
from opentrons.drivers.smoothie_drivers.driver_3_0 import GCODE as SMOOTHIE_GCODE
from opentrons.hardware_control.g_code_parsing.utils import reverse_enum
from opentrons.hardware_control.emulation.parser import Parser
from opentrons.hardware_control.g_code_parsing.g_code_functionality_defs.\
    g_code_functionality_def_base import Explanation
from .g_code_functionality_defs.smoothie import (
    CurrentPositionCodeFunctionalityDef, DwellGCodeFunctionalityDef,
    HomeGCodeFunctionalityDef, LimitSwitchStatusGCodeFunctionalityDef,
    MoveGCodeFunctionalityDef, SetCurrentGCodeFunctionalityDef,
    SetSpeedGCodeFunctionalityDef, WaitGCodeFunctionalityDef,
    ProbeGCodeFunctionalityDef, AbsoluteCoordinateModeGCodeFunctionalityDef,
    RelativeCoordinateModeGCodeFunctionalityDef, ResetFromErrorGCodeFunctionalityDef,
    PushSpeedGCodeFunctionalityDef, PopSpeedGCodeFunctionalityDef,
    StepsPerMMGCodeFunctionalityDef, SetMaxSpeedGCodeFunctionalityDef,
    AccelerationGCodeFunctionalityDef, DisengageMotorGCodeFunctionalityDef,
    HomingStatusGCodeFunctionalityDef, MicrosteppingCEnableGCodeFunctionalityDef,
    MicrosteppingCDisableGCodeFunctionalityDef,
    MicrosteppingBEnableGCodeFunctionalityDef,
    MicrosteppingBDisableGCodeFunctionalityDef, SetPipetteRetractGCodeFunctionalityDef,
    SetPipetteDebounceGCodeFunctionalityDef, SetPipetteHomeGCodeFunctionalityDef,
    SetPipetteMaxTravelGCodeFunctionalityDef, ReadInstrumentModelGCodeFunctionalityDef,
    ReadInstrumentIDGCodeFunctionalityDef, WriteInstrumentModelGCodeFunctionalityDef,
    WriteInstrumentIDGCodeFunctionalityDef
)


class GCode:
    """
    Middleware class to provide functionality to define G-Codes as well as
    convert them to human-readable JSON form
    """

    G_CODE_EXPLANATION_MAPPING = {
        # Weird Enum thing stopping me from using values from
        # enum for MOVE and SET_SPEED see g_code.py get_gcode_function for explanation
        'MOVE': MoveGCodeFunctionalityDef,
        'SET_SPEED': SetSpeedGCodeFunctionalityDef,
        SMOOTHIE_GCODE.WAIT.name: WaitGCodeFunctionalityDef,
        SMOOTHIE_GCODE.HOME.name: HomeGCodeFunctionalityDef,
        SMOOTHIE_GCODE.SET_CURRENT.name: SetCurrentGCodeFunctionalityDef,
        SMOOTHIE_GCODE.DWELL.name: DwellGCodeFunctionalityDef,
        SMOOTHIE_GCODE.CURRENT_POSITION.name: CurrentPositionCodeFunctionalityDef,
        SMOOTHIE_GCODE.LIMIT_SWITCH_STATUS.name: LimitSwitchStatusGCodeFunctionalityDef,
        SMOOTHIE_GCODE.PROBE.name: ProbeGCodeFunctionalityDef,
        SMOOTHIE_GCODE.ABSOLUTE_COORDS.name:
            AbsoluteCoordinateModeGCodeFunctionalityDef,
        SMOOTHIE_GCODE.RELATIVE_COORDS.name:
            RelativeCoordinateModeGCodeFunctionalityDef,
        SMOOTHIE_GCODE.RESET_FROM_ERROR.name: ResetFromErrorGCodeFunctionalityDef,
        SMOOTHIE_GCODE.PUSH_SPEED.name: PushSpeedGCodeFunctionalityDef,
        SMOOTHIE_GCODE.POP_SPEED.name: PopSpeedGCodeFunctionalityDef,
        SMOOTHIE_GCODE.STEPS_PER_MM.name: StepsPerMMGCodeFunctionalityDef,
        SMOOTHIE_GCODE.SET_MAX_SPEED.name: SetMaxSpeedGCodeFunctionalityDef,
        SMOOTHIE_GCODE.ACCELERATION.name: AccelerationGCodeFunctionalityDef,
        SMOOTHIE_GCODE.DISENGAGE_MOTOR.name: DisengageMotorGCodeFunctionalityDef,
        SMOOTHIE_GCODE.HOMING_STATUS.name: HomingStatusGCodeFunctionalityDef,
        SMOOTHIE_GCODE.MICROSTEPPING_B_DISABLE.name:
            MicrosteppingBDisableGCodeFunctionalityDef,
        SMOOTHIE_GCODE.MICROSTEPPING_B_ENABLE.name:
            MicrosteppingBEnableGCodeFunctionalityDef,
        SMOOTHIE_GCODE.MICROSTEPPING_C_DISABLE.name:
            MicrosteppingCDisableGCodeFunctionalityDef,
        SMOOTHIE_GCODE.MICROSTEPPING_C_ENABLE.name:
            MicrosteppingCEnableGCodeFunctionalityDef,
        SMOOTHIE_GCODE.PIPETTE_HOME.name: SetPipetteHomeGCodeFunctionalityDef,
        SMOOTHIE_GCODE.PIPETTE_RETRACT.name: SetPipetteRetractGCodeFunctionalityDef,
        SMOOTHIE_GCODE.PIPETTE_DEBOUNCE.name: SetPipetteDebounceGCodeFunctionalityDef,
        SMOOTHIE_GCODE.PIPETTE_MAX_TRAVEL.name:
            SetPipetteMaxTravelGCodeFunctionalityDef,
        SMOOTHIE_GCODE.READ_INSTRUMENT_MODEL.name:
            ReadInstrumentModelGCodeFunctionalityDef,
        SMOOTHIE_GCODE.READ_INSTRUMENT_ID.name: ReadInstrumentIDGCodeFunctionalityDef,
        SMOOTHIE_GCODE.WRITE_INSTRUMENT_ID.name: WriteInstrumentIDGCodeFunctionalityDef,
        SMOOTHIE_GCODE.WRITE_INSTRUMENT_MODEL.name:
            WriteInstrumentModelGCodeFunctionalityDef,
    }

    # Smoothie G-Code Parsing Characters
    SET_SPEED_CHARACTER = 'F'
    MOVE_CHARACTERS = ['X', 'Y', 'Z', 'A', 'B', 'C']
    SET_SPEED_NAME = 'SET_SPEED'
    MOVE_NAME = 'MOVE'

    SMOOTHIE_IDENT = 'smoothie'
    SMOOTHIE_GCODE_LOOKUP = reverse_enum(SMOOTHIE_GCODE)

    DEVICE_GCODE_LOOKUP = {
        SMOOTHIE_IDENT: SMOOTHIE_GCODE_LOOKUP
    }

    SPECIAL_HANDLING_REQUIRED_G_CODES = [
        SMOOTHIE_GCODE.WRITE_INSTRUMENT_ID,
        SMOOTHIE_GCODE.WRITE_INSTRUMENT_MODEL,
    ]

    @classmethod
    def from_raw_code(cls, raw_code: str, device: str, response: str) -> List[GCode]:
        g_code_list = []
        for g_code in Parser().parse(raw_code):
            if g_code.gcode not in cls.SPECIAL_HANDLING_REQUIRED_G_CODES:
                g_code_list.append(cls(device, g_code.gcode, g_code.params, response))
            else:
                left_or_right = g_code.body.strip()[0]
                if left_or_right not in ['R', 'L']:
                    raise UnparsableGCodeError(raw_code)
                params = {left_or_right: g_code.body.strip()[1:]}

                g_code_list.append(cls(device, g_code.gcode, params, response))

        return g_code_list

    def __init__(
            self,
            device_name: str,
            g_code: str,
            g_code_args: dict,
            response: str
    ) -> None:
        self._device_name = device_name
        self._g_code = g_code
        self._g_code_args = g_code_args
        self._response = self._cleanup_response(response)

    @staticmethod
    def _cleanup_response(response):
        pre_space_cleanup = response.replace('ok', ' ')\
            .replace('\r', ' ')\
            .replace('\n', ' ')
        return re.sub(' +', ' ', pre_space_cleanup).strip()

    @property
    def device_name(self) -> str:
        """Name of the device that the G-Code was ran against"""
        return self._device_name

    @property
    def g_code(self) -> str:
        """G-Code command. For instance, G0"""
        return self._g_code

    @property
    def g_code_args(self) -> dict:
        """
        Dictionary representation of arg portion passed to G-Code Command.
        For instance, the line G0 X100 Y200 would be:
        {
            "X": 100,
            "Y": 200
        }
        """
        return self._g_code_args

    @property
    def g_code_body(self) -> str:
        """
        String representation of arg portion passed to G-Code Command.
        For instance, the line G0 X100 Y200 would be:
        "X100 Y200"
        """
        return ' '.join(
            str(k) + str(v if v is not None else '')
            for k, v
            in self.g_code_args.items()
        )

    @property
    def g_code_line(self) -> str:
        """
        The entire string representation of the G-Code Command.
        For instance, "G0 X100 Y200"
        """
        return f'{self.g_code} {self.g_code_body}'.strip()

    def get_gcode_function(self) -> str:
        """
        Returns the function that the G-Code performs.
        For instance, G28.2 X is the HOME command.
        :raises: UnparsableGCodeError: If G-Code command is not defined
            in the respective driver
        """
        # Parsing for G0 command that can either be MOVE or SET_SPEED
        if self._device_name == self.SMOOTHIE_IDENT and self.g_code == 'G0':
            contains_set_speed_character = self.SET_SPEED_CHARACTER in self.g_code_body
            contains_move_characters = any([
                move_char in self.g_code_body
                for move_char in self.MOVE_CHARACTERS
            ])

            # For the following if/else I was going to grab the enum names
            # from SMOOTHIE_GCODE but due to the way that enums work, if I
            # have 2 enum entries with the same value the second value will
            # act as an alias to the first.
            # Since the value for SET_SPEED and MOVE are both G0 and MOVE is defined
            # first, calling SMOOTHIE_GCODE.SET_SPEED.name returns MOVE.
            # Super annoying but it's how it works.
            # Super annoying, so I am just going to hard code the value for now.

            # For corroborating documentation see:
            # https://docs.python.org/3/library/enum.html#duplicating-enum-members-and-values

            if contains_set_speed_character and not contains_move_characters:
                g_code_function = 'SET_SPEED'
            else:
                g_code_function = 'MOVE'

            return g_code_function

        device = self.DEVICE_GCODE_LOOKUP[self.device_name]
        try:
            g_code_function = device[self.g_code]
        except KeyError:
            raise UnparsableGCodeError(f'{self.g_code} {self.g_code_body}')

        return g_code_function

    def get_explanation(self) -> Explanation:
        g_code_function = self.get_gcode_function()
        try:
            explanation_class = self.G_CODE_EXPLANATION_MAPPING[g_code_function]
        except KeyError:
            return Explanation(
                self.g_code,
                self.get_gcode_function(),
                self.g_code_args,
                f'No explanation defined for {self.get_gcode_function()}',
                self.response
            )
        except Exception:
            raise
        else:
            return explanation_class.generate_explanation(
                self.g_code,
                self.get_gcode_function(),
                self.g_code_args,
                self.response
            )

    @property
    def response(self):
        return self._response
