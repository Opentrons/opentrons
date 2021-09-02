from __future__ import annotations

import re
from typing import List
from errors import UnparsableGCodeError
from opentrons.drivers.smoothie_drivers.driver_3_0 import GCODE as SMOOTHIE_G_CODE
from opentrons.drivers.mag_deck.driver import GCODE as MAGDECK_G_CODE
from opentrons.drivers.temp_deck.driver import GCODE as TEMPDECK_G_CODE
from opentrons.drivers.thermocycler.driver import GCODE as THERMOCYCLER_G_CODE
from utils import reverse_enum
from opentrons.hardware_control.emulation.parser import Parser
from g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    Explanation,
)
from g_code_functionality_defs import smoothie, magdeck, tempdeck, thermocycler


class GCode:
    """
    Middleware class to provide functionality to define G-Codes as well as
    convert them to human-readable JSON form
    """

    SMOOTHIE_G_CODE_EXPLANATION_MAPPING = {
        # Weird Enum thing stopping me from using values from
        # enum for MOVE and SET_SPEED see g_code.py get_gcode_function for explanation
        "MOVE": smoothie.MoveGCodeFunctionalityDef,
        "SET_SPEED": smoothie.SetSpeedGCodeFunctionalityDef,
        SMOOTHIE_G_CODE.WAIT.name: smoothie.WaitGCodeFunctionalityDef,
        SMOOTHIE_G_CODE.HOME.name: smoothie.HomeGCodeFunctionalityDef,
        SMOOTHIE_G_CODE.SET_CURRENT.name: smoothie.SetCurrentGCodeFunctionalityDef,
        SMOOTHIE_G_CODE.DWELL.name: smoothie.DwellGCodeFunctionalityDef,
        SMOOTHIE_G_CODE.CURRENT_POSITION.name: smoothie.CurrentPositionGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.LIMIT_SWITCH_STATUS.name: smoothie.LimitSwitchStatusGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.PROBE.name: smoothie.ProbeGCodeFunctionalityDef,
        SMOOTHIE_G_CODE.ABSOLUTE_COORDS.name: smoothie.AbsoluteCoordinateModeGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.RELATIVE_COORDS.name: smoothie.RelativeCoordinateModeGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.RESET_FROM_ERROR.name: smoothie.ResetFromErrorGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.PUSH_SPEED.name: smoothie.PushSpeedGCodeFunctionalityDef,
        SMOOTHIE_G_CODE.POP_SPEED.name: smoothie.PopSpeedGCodeFunctionalityDef,
        SMOOTHIE_G_CODE.STEPS_PER_MM.name: smoothie.StepsPerMMGCodeFunctionalityDef,
        SMOOTHIE_G_CODE.SET_MAX_SPEED.name: smoothie.SetMaxSpeedGCodeFunctionalityDef,
        SMOOTHIE_G_CODE.ACCELERATION.name: smoothie.AccelerationGCodeFunctionalityDef,
        SMOOTHIE_G_CODE.DISENGAGE_MOTOR.name: smoothie.DisengageMotorGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.HOMING_STATUS.name: smoothie.HomingStatusGCodeFunctionalityDef,
        SMOOTHIE_G_CODE.MICROSTEPPING_B_DISABLE.name: smoothie.MicrosteppingBDisableGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.MICROSTEPPING_B_ENABLE.name: smoothie.MicrosteppingBEnableGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.MICROSTEPPING_C_DISABLE.name: smoothie.MicrosteppingCDisableGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.MICROSTEPPING_C_ENABLE.name: smoothie.MicrosteppingCEnableGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.PIPETTE_HOME.name: smoothie.SetPipetteHomeGCodeFunctionalityDef,
        SMOOTHIE_G_CODE.PIPETTE_RETRACT.name: smoothie.SetPipetteRetractGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.PIPETTE_DEBOUNCE.name: smoothie.SetPipetteDebounceGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.PIPETTE_MAX_TRAVEL.name: smoothie.SetPipetteMaxTravelGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.READ_INSTRUMENT_MODEL.name: smoothie.ReadInstrumentModelGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.READ_INSTRUMENT_ID.name: smoothie.ReadInstrumentIDGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.WRITE_INSTRUMENT_ID.name: smoothie.WriteInstrumentIDGCodeFunctionalityDef,  # noqa: E501
        SMOOTHIE_G_CODE.WRITE_INSTRUMENT_MODEL.name: smoothie.WriteInstrumentModelGCodeFunctionalityDef,  # noqa: E501
    }

    MAGDECK_G_CODE_EXPLANATION_MAPPING = {
        MAGDECK_G_CODE.HOME.name: magdeck.HomeGCodeFunctionalityDef,
        MAGDECK_G_CODE.MOVE.name: magdeck.MoveGCodeFunctionalityDef,
        MAGDECK_G_CODE.GET_CURRENT_POSITION.name: magdeck.CurrentPositionGCodeFunctionalityDef,  # noqa: E501
        MAGDECK_G_CODE.PROBE_PLATE.name: magdeck.ProbeGCodeFunctionalityDef,
        MAGDECK_G_CODE.GET_PLATE_HEIGHT.name: magdeck.GetPlateHeightGCodeFunctionalityDef,  # noqa: E501
        MAGDECK_G_CODE.DEVICE_INFO.name: magdeck.DeviceInfoGCodeFunctionalityDef,
    }

    TEMPDECK_G_CODE_EXPLANATION_MAPPING = {
        TEMPDECK_G_CODE.DISENGAGE.name: tempdeck.DisengageGCodeFunctionalityDef,
        TEMPDECK_G_CODE.SET_TEMP.name: tempdeck.SetTempGCodeFunctionalityDef,
        TEMPDECK_G_CODE.GET_TEMP.name: tempdeck.GetTempGCodeFunctionalityDef,
        TEMPDECK_G_CODE.DEVICE_INFO.name: tempdeck.DeviceInfoGCodeFunctionalityDef,
    }

    THERMOCYCLER_G_CODE_EXPLANATION_MAPPING = {
        THERMOCYCLER_G_CODE.CLOSE_LID.name: thermocycler.CloseLidGCodeFunctionalityDef,
        THERMOCYCLER_G_CODE.DEVICE_INFO.name: thermocycler.DeviceInfoGCodeFunctionalityDef,  # noqa: E501
        THERMOCYCLER_G_CODE.GET_PLATE_TEMP.name: thermocycler.GetPlateTempGCodeFunctionalityDef,  # noqa: E501
        THERMOCYCLER_G_CODE.GET_LID_STATUS.name: thermocycler.LidStatusGCodeFunctionalityDef,  # noqa: E501
        THERMOCYCLER_G_CODE.OPEN_LID.name: thermocycler.OpenLidGCodeFunctionalityDef,
        THERMOCYCLER_G_CODE.SET_PLATE_TEMP.name: thermocycler.SetPlateTempGCodeFunctionalityDef,  # noqa: E501
        THERMOCYCLER_G_CODE.SET_LID_TEMP.name: thermocycler.SetLidTempGCodeFunctionalityDef,  # noqa: E501
        THERMOCYCLER_G_CODE.GET_LID_TEMP.name: thermocycler.GetLidTempGCodeFunctionalityDef,  # noqa: E501
        THERMOCYCLER_G_CODE.SET_RAMP_RATE.name: thermocycler.SetRampRateGCodeFunctionalityDef,  # noqa: E501
        THERMOCYCLER_G_CODE.DEACTIVATE_LID.name: thermocycler.DeactivateLidGCodeFunctionalityDef,  # noqa: E501
        THERMOCYCLER_G_CODE.DEACTIVATE_BLOCK.name: thermocycler.DeactivateBlockGCodeFunctionalityDef,  # noqa: E501
        THERMOCYCLER_G_CODE.DEACTIVATE_ALL.name: thermocycler.DeactivateAllGCodeFunctionalityDef,  # noqa: E501
        THERMOCYCLER_G_CODE.EDIT_PID_PARAMS.name: thermocycler.EditPIDParamsGCodeFunctionalityDef,  # noqa: E501
    }

    # Smoothie G-Code Parsing Characters
    SET_SPEED_CHARACTER = "F"
    MOVE_CHARACTERS = ["X", "Y", "Z", "A", "B", "C"]
    SET_SPEED_NAME = "SET_SPEED"
    MOVE_NAME = "MOVE"

    SMOOTHIE_IDENT = "smoothie"
    SMOOTHIE_G_CODE_LOOKUP = reverse_enum(SMOOTHIE_G_CODE)

    MAGDECK_IDENT = "magdeck"
    MAGDECK_G_CODE_LOOKUP = reverse_enum(MAGDECK_G_CODE)

    TEMPDECK_IDENT = "tempdeck"
    TEMPDECK_G_CODE_LOOKUP = reverse_enum(TEMPDECK_G_CODE)

    THERMOCYCLER_IDENT = "thermocycler"
    THERMOCYCLER_G_CODE_LOOKUP = reverse_enum(THERMOCYCLER_G_CODE)

    DEVICE_GCODE_LOOKUP = {
        SMOOTHIE_IDENT: SMOOTHIE_G_CODE_LOOKUP,
        MAGDECK_IDENT: MAGDECK_G_CODE_LOOKUP,
        TEMPDECK_IDENT: TEMPDECK_G_CODE_LOOKUP,
        THERMOCYCLER_IDENT: THERMOCYCLER_G_CODE_LOOKUP,
    }

    SPECIAL_HANDLING_REQUIRED_G_CODES = [
        SMOOTHIE_G_CODE.WRITE_INSTRUMENT_ID,
        SMOOTHIE_G_CODE.WRITE_INSTRUMENT_MODEL,
    ]

    EXPLANATION_LOOKUP = {
        SMOOTHIE_IDENT: SMOOTHIE_G_CODE_EXPLANATION_MAPPING,
        MAGDECK_IDENT: MAGDECK_G_CODE_EXPLANATION_MAPPING,
        TEMPDECK_IDENT: TEMPDECK_G_CODE_EXPLANATION_MAPPING,
        THERMOCYCLER_IDENT: THERMOCYCLER_G_CODE_EXPLANATION_MAPPING,
    }

    # These are a list of codes that are called using polling.
    # We want to filter these codes out because they are not
    # actually called by users.
    POLLING_CODES = [
        TEMPDECK_G_CODE.GET_TEMP.value,
        THERMOCYCLER_G_CODE.GET_LID_TEMP.value,
        THERMOCYCLER_G_CODE.GET_PLATE_TEMP.value,
        THERMOCYCLER_G_CODE.GET_LID_STATUS.value,
    ]

    @classmethod
    def from_raw_code(cls, raw_code: str, device: str, response: str) -> List[GCode]:
        g_code_list = []
        for g_code in Parser().parse(raw_code):
            if g_code.gcode not in cls.SPECIAL_HANDLING_REQUIRED_G_CODES:
                g_code_list.append(cls(device, g_code.gcode, g_code.params, response))
            else:
                # This case is the exception compared to all of the others for the
                # smoothie G-Codes. We have 4 G-Codes that have to do with loading
                # and reading instrument (pipette) IDs and models, listed as follows:
                # M369: Read Instrument ID
                # M370: Write Instrument ID
                # M371: Read Instrument Model
                # M372: Write Instrument Model
                # The "Write" codes do not parse in the same fashion as all of the other
                # codes. Instead of being floats, their parameters are actually hex
                # strings. Because of this we have to parse them differently.
                # From the body of the G-Code, we pull the L or R for left or right
                # pipette. Everything else in the string is the hex code
                left_or_right = g_code.body.strip()[0]
                if left_or_right not in ["R", "L"]:
                    raise UnparsableGCodeError(raw_code)
                params = {left_or_right: g_code.body.strip()[1:]}

                g_code_list.append(cls(device, g_code.gcode, params, response))

        return g_code_list

    def __init__(
        self, device_name: str, g_code: str, g_code_args: dict, response: str
    ) -> None:
        self._device_name = device_name
        self._g_code = g_code
        self._g_code_args = g_code_args
        self._response = self._cleanup_response(response)

    @staticmethod
    def _cleanup_response(response):
        pre_space_cleanup = (
            response.replace("ok", " ").replace("\r", " ").replace("\n", " ")
        )
        return re.sub(" +", " ", pre_space_cleanup).strip()

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
        return " ".join(
            str(k) + str(v if v is not None else "")
            for k, v in self.g_code_args.items()
        )

    @property
    def g_code_line(self) -> str:
        """
        The entire string representation of the G-Code Command.
        For instance, "G0 X100 Y200"
        """
        return f"{self.g_code} {self.g_code_body}".strip()

    def is_polling_command(self) -> bool:
        return self.g_code in self.POLLING_CODES

    @property
    def response(self):
        """Unparsed G-Code Response"""
        return self._response

    def get_gcode_function(self) -> str:
        """
        Returns the function that the G-Code performs.
        For instance, G28.2 X is the HOME command.
        :raises: UnparsableGCodeError: If G-Code command is not defined
            in the respective driver
        """
        # Parsing for G0 command that can either be MOVE or SET_SPEED
        if self._device_name == self.SMOOTHIE_IDENT and self.g_code == "G0":
            contains_set_speed_character = self.SET_SPEED_CHARACTER in self.g_code_body
            contains_move_characters = any(
                [move_char in self.g_code_body for move_char in self.MOVE_CHARACTERS]
            )

            # For the following if/else I was going to grab the enum names
            # from SMOOTHIE_G_CODE but due to the way that enums work, if I
            # have 2 enum entries with the same value the second value will
            # act as an alias to the first.
            # Since the value for SET_SPEED and MOVE are both G0 and MOVE is defined
            # first, calling SMOOTHIE_G_CODE.SET_SPEED.name returns MOVE.
            # Super annoying but it's how it works.
            # Super annoying, so I am just going to hard code the value for now.

            # For corroborating documentation see:
            # https://docs.python.org/3/library/enum.html#duplicating-enum-members-and-values

            if contains_set_speed_character and not contains_move_characters:
                g_code_function = "SET_SPEED"
            else:
                g_code_function = "MOVE"

            return g_code_function

        device = self.DEVICE_GCODE_LOOKUP[self.device_name]
        try:
            g_code_function = device[self.g_code]
        except KeyError:
            raise UnparsableGCodeError(f"{self.g_code} {self.g_code_body}")

        return g_code_function

    def get_explanation(self) -> Explanation:
        g_code_function = self.get_gcode_function()
        try:
            explanation_class = self.EXPLANATION_LOOKUP[self.device_name][
                g_code_function
            ]

        except KeyError:
            return Explanation(
                self.g_code,
                self.get_gcode_function(),
                self.g_code_args,
                f"No explanation defined for {self.get_gcode_function()}",
                self.response,
            )
        except Exception:
            raise
        else:
            return explanation_class.generate_explanation(
                self.g_code, self.get_gcode_function(), self.g_code_args, self.response
            )
