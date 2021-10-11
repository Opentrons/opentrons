import os
import re
from typing import Dict, Type, Union
from opentrons.drivers.smoothie_drivers.driver_3_0 import GCODE as SMOOTHIE_G_CODE
from opentrons.drivers.mag_deck.driver import GCODE as MAGDECK_G_CODE
from opentrons.drivers.temp_deck.driver import GCODE as TEMPDECK_G_CODE
from opentrons.drivers.thermocycler.driver import GCODE as THERMOCYCLER_G_CODE
from opentrons.drivers.heatershaker.driver import GCODE as HEATER_SHAKER_G_CODE


WRITE_REGEX = re.compile(r"(.*?) \| (.*?) \|(.*?)$")


def reverse_enum(
    enum_to_reverse: Union[
        Type[SMOOTHIE_G_CODE],
        Type[MAGDECK_G_CODE],
        Type[TEMPDECK_G_CODE],
        Type[THERMOCYCLER_G_CODE],
        Type[HEATER_SHAKER_G_CODE],
    ]
) -> Dict:
    """
    Returns dictionary with keys and values switched from passed Enum
    :param enum_to_reverse: The Enum that you want to reverse
    :return: Reversed dictionary
    """
    # I don't know what is going on with mypy, it is complaining
    # about keys not existing as an attribute. I am not calling it
    # as an attribute. I am calling it as a function.
    members = enum_to_reverse.__members__.keys()
    values = [enum_to_reverse[member] for member in members]
    return dict(zip(values, members))


def get_configuration_dir() -> str:
    return os.path.normpath(
        os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", "g_code_test_data"
        )
    )


def get_configuration_file_path() -> str:
    return os.path.join(get_configuration_dir(), "configurations.py")
