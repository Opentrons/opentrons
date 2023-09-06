"""Radwag Commands."""
from enum import Enum

RADWAG_COMMAND_TERMINATOR = "\r\n"


class RadwagCommand(str, Enum):
    """Radwag commands."""

    # info
    GET_SERIAL_NUMBER = "NB"  # Give balance serial number
    GET_BALANCE_TYPE = "BN"  # Give balance type
    GET_MAX_CAPACITY = "FS"  # Give Max capacity
    GET_PROGRAM_VERSION = "RV"  # Give program version

    # zero & tare
    ZERO = "Z"  # Zero balance
    TARE = "T"  # Tare balance
    GET_TARE = "OT"  # Give tare value
    SET_TARE = "UT"  # Set tare  # TODO: add to driver
    SET_AUTOZERO_FUNCTION = "A"  # Set autozero function  # TODO: add to driver

    # reading a measurement
    GET_MEASUREMENT_BASIC_UNIT_STABLE = (
        "S"  # Send stable measurement result in basic measuring unit
    )
    GET_MEASUREMENT_BASIC_UNIT = (
        "SI"  # Immediately send measurement result in basic measuring unit
    )
    GET_MEASUREMENT_CURRENT_UNIT_STABLE = (
        "SU"  # Send stable measurement result in current measuring unit
    )
    GET_MEASUREMENT_CURRENT_UNIT = (
        "SUI"  # Immediately send measurement result in current measuring unit
    )
    ENABLE_CONTINUOUS_TRANS_BASIC_UNIT = (
        "C1"  # Switch on continuous transmission in basic measuring unit
    )
    DISABLE_CONTINUOUS_TRANS_BASIC_UNIT = (
        "C0"  # Switch off continuous transmission in basic measuring unit
    )
    ENABLE_CONTINUOUS_TRANS_CURRENT_UNIT = (
        "CU1"  # Switch on continuous transmission in current measuring unit
    )
    DISABLE_CONTINUOUS_TRANS_CURRENT_UNIT = (
        "CU0"  # Switch off continuous transmission in current measuring unit
    )

    # checkweighing?
    SET_MIN_CHECKWEIGHING_THRESHOLD = "DH"  # Set min checkweighing threshold
    SET_MAX_CHECKWEIGHING_THRESHOLD = "UH"  # Set max checkweighing threshold
    GET_MIN_CHECKWEIGHING_THRESHOLD = "ODH"  # Give value of min checkweighing threshold
    GET_MAX_CHECKWEIGHING_THRESHOLD = "OUH"  # Give value of max checkweighing threshold

    # item counting
    SET_MASS_VALUE_OF_SINGLE_ITEM = "SM"  # Set mass value of a single item
    SET_TARGET_MASS_VALUE = "TV"  # Set target mass value
    SET_REFERENCE_MASS_VALUE = "RM"  # Set reference mass value

    # internal adjustment
    INTERNAL_ADJUST_PERFORMANCE = (
        "IC"  # Internal adjustment performance # TODO: add to driver
    )
    DISABLE_AUTO_INTERNAL_ADJUST = (
        "IC1"  # Disable automatic internal adjustment of the balance
    )
    ENABLE_AUTO_INTERNAL_ADJUST = (
        "IC0"  # Enable automatic internal adjustment of the balance
    )

    # working modes
    GET_AVAILABLE_WORKING_MODES = "OMI"  # Give available working modes
    SET_WORKING_MODE = "OMS"  # Set working mode
    GET_CURRENT_WORKING_MODE = "OMG"  # Give current working mode

    # units
    GET_ACCESSIBLE_UNITS = "UI"  # Give accessible units
    SET_UNIT = "US"  # Set unit  # TODO: add to driver
    GET_CURRENT_UNIT = "UG"  # Give current unit

    # ambient conditions
    SET_AMBIENT_CONDITIONS_STATE = "EV"  # Set ambient conditions state
    GET_CURRENT_AMBIENT_CONDITIONS = "EVG"  # Give currently set ambient conditions

    # filter
    SET_FILTER = "FIS"  # Set filter
    GET_FILTER = "FIG"  # Give current filter

    # value release
    VALUE_RELEASE = "SS"  # Value release
    SET_VALUE_RELEASE = "ARS"  # Set value release
    GET_CURRENT_VALUE_RELEASE = "ARG"  # Give current value release

    # other
    ACTIVATE_SOUND_SIGNAL = "BP"  # Activate sound signal  # TODO: add to driver
    LOCK_KEYPAD = "K1"  # Lock balance keypad # TODO: add to driver
    UNLOCK_KEYPAD = "K0"  # Unlock balance keypad  # TODO: add to driver
    SEND_ALL_IMPLEMENTED_COMMANDS = "PC"  # Send all implemented commands
    SET_LAST_DIGIT = "LDS"  # Set last digit
    COOPERATION_WITH_PUE_7_1_PUE_10_TERMINAL = (
        "NT"  # Cooperation with PUE 7.1 PUE 10 terminal
    )
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"


def radwag_command_format(command: str) -> str:
    """Radwag command format."""
    return f"{command}{RADWAG_COMMAND_TERMINATOR}"


class RadwagWorkingMode(Enum):
    """Radwag Working Modes."""

    weighing = 1
    parts_counting = 2
    percent_weighing = 3
    dosing = 4
    formulas = 5
    animal_weighing = 6
    density_of_solid_bodies = 8
    density_of_liquids = 9
    peak_hold = 10
    totalizing = 11
    checkweighing = 12
    statistics = 13


class RadwagFilter(Enum):
    """Radwag filter types."""

    very_fast = 1
    fast = 2
    average = 3
    slow = 4
    very_slow = 5


class RadwagValueRelease(Enum):
    """Radwag value release states."""

    fast = 1
    fast_reliable = 2
    reliable = 3


class RadwagAmbiant(Enum):
    """Radwag ambiant enviornment states."""

    unstable = 0
    stable = 1
