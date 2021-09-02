from enum import Enum
from typing import Dict
from string import Template
from distutils.util import strtobool
from opentrons.drivers.utils import parse_key_values
from g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    GCodeFunctionalityDefBase,
)


class GetPlateTempGCodeFunctionalityDef(GCodeFunctionalityDefBase):

    VALID_KEYS = ["T", "C", "H", "TOTAL_H", "AT_TARGET"]

    class ResponseMessages(Enum):
        T = Template("\n\tTarget temperature is: ${val}C")
        C = Template("\n\tCurrent temperature is: ${val}C")
        H = Template("\n\tRemaining hold time is: ${val}ms")
        TOTAL_H = Template("\n\tTotal hold time is: ${val}ms")

        T_NEG = "\n\tTarget temperature not set"
        H_NEG = "\n\tHold time not set"

        # TOTAL_H_NEG is blank because H_NEG's message is sufficent explanation for
        # the both of them
        TOTAL_H_NEG = ""

        AT_TARGET_TRUE = "\n\tAt target temperature"
        AT_TARGET_FALSE = "\n\tNot at target temperature"
        AT_TARGET_UNPARSABLE = "\n\tTarget temperature is unparsable: "

    @classmethod
    def _generate_command_explanation(cls, g_code_args: Dict[str, str]) -> str:
        return "Getting temperature values for thermocycler"

    @classmethod
    def _parse_at_target(cls, key, value):
        # For some reason AT_TARGET can sometimes return 0 or 1 or
        # true or false. Using strtobool as a blanket statement to catch
        # anything that might actually mean True or False.
        # If not, lets still print it so we can see what it is
        try:
            at_target_temp = strtobool(value)
        except ValueError:
            return cls.ResponseMessages.AT_TARGET_UNPARSABLE.value + value

        if at_target_temp:
            message = cls.ResponseMessages.AT_TARGET_TRUE.value
        else:
            message = cls.ResponseMessages.AT_TARGET_FALSE.value

        return message

    @classmethod
    def _generate_response_explanation(cls, response: str) -> str:
        message = "Temperature values for thermocycler are as follows:"
        parsed_response_vals = parse_key_values(response)
        target_temp_set = parsed_response_vals["T"] != "none"

        for key, value in parsed_response_vals.items():
            key = key.upper()  # Makes enum values cleaner

            # The key will actually be AT_TARGET?
            # Need to remove the question mark
            if "AT_TARGET" in key:
                key = "AT_TARGET"

            # If target temp is not set then there is no point to display
            # these values
            if not target_temp_set and key in ["H", "TOTAL_H", "AT_TARGET"]:
                continue

            if key in cls.VALID_KEYS:
                if key == "AT_TARGET":
                    message += cls._parse_at_target(key, value)
                    continue

                # The value "none" is used to denote "not set"
                if value == "none":
                    message += cls.ResponseMessages[key + "_NEG"].value
                    continue

                template = cls.ResponseMessages[key].value
                message += template.substitute(val=value)

        return message
