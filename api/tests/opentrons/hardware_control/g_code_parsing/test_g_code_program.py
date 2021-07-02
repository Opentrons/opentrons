import pytest
from opentrons.hardware_control.g_code_parsing.g_code import GCode
from opentrons.drivers.smoothie_drivers.driver_3_0 import GCODE as SMOOTHIE_GCODE

# Using 1000.1 for the date float because it really doesn't matter for this test
STATIC_FLOAT = 1000.1

TEST_PARAMS = [
    ##########
    # Test 0 #
    ##########
    (
        # Input G-Code
        GCode(
            STATIC_FLOAT,
            GCode.SMOOTHIE_IDENT,
            SMOOTHIE_GCODE.MOVE,
            {
                'X': 10,
                'Y': 11,
                'Z': 12,
                'A': None,
                'B': 13,
                'C': 14,
                'F': 2.0004
            }
        ),
        # Expected Dict Output
        {
            "Code": "G0",
            "Command Name": "MOVE",
            "Provided Arguments": {
                "X": 10,
                "Y": 11,
                "Z": 12,
                "A": None,
                "B": 13,
                "C": 14,
                "F": 2.0004
            },
            "Command Explanation":
                "MOVE:\n\t"
                "The gantry to 10 on the X-Axis\n\t"
                "The gantry to 11 on the Y-Axis\n\t"
                "The left pipette arm height to 12\n\t"
                "The left pipette suction to 13\n\t"
                "The right pipette suction to 14\n\t"
                "At a speed of 2.0004"
        }
    ),

    ##########
    # Test 1 #
    ##########
    (

        # Input G-Code
        GCode(
            STATIC_FLOAT,
            GCode.SMOOTHIE_IDENT,
            SMOOTHIE_GCODE.WAIT,
            {}
        ),
        # Expected Dict Output
        {
            "Code": "M400",
            "Command Name": "WAIT",
            "Provided Arguments": {},
            "Command Explanation": "WAITING"
        }

    ),

    ##########
    # Test 2 #
    ##########
    (
        # Input G-Code
        GCode(
            STATIC_FLOAT,
            GCode.SMOOTHIE_IDENT,
            SMOOTHIE_GCODE.SET_SPEED,
            {
                'F': 5.0004
            }
        ),
        # Expected Dict Output
        {
            "Code": "G0",
            "Command Name": "SET_SPEED",
            "Provided Arguments": {
                'F': 5.0004
            },
            "Command Explanation": "SETTING SPEED:\n\tSetting speed to 5.0004"
        }
    ),

    ##########
    # Test 3 #
    ##########
    (
        # Input G-Code
        GCode(
            STATIC_FLOAT,
            GCode.SMOOTHIE_IDENT,
            SMOOTHIE_GCODE.HOME,
            {
                'X': None,
                'Y': None,
                'Z': None,
                'B': None,
                'C': None,
            }
        ),
        # Expected Dict Output
        {
            "Code": "G28.2",
            "Command Name": "HOME",
            "Provided Arguments": {
                'X': None,
                'Y': None,
                'Z': None,
                'B': None,
                'C': None,
            },
            "Command Explanation": "HOME:\n\tThe following axes X, Y, Z, B, C"
        }
    ),

    ##########
    # Test 4 #
    ##########
    (
        # Input G-Code
        GCode(
            STATIC_FLOAT,
            GCode.SMOOTHIE_IDENT,
            SMOOTHIE_GCODE.SET_CURRENT,
            {
                'X': 1.1,
                'Y': 2.2,
                'Z': 3.3,
                'A': None,
                'B': 0.4,
                'C': 0.5,
            }
        ),
        # Expected Dict Output
        {
            "Code": "M907",
            "Command Name": "SET_CURRENT",
            "Provided Arguments": {
                'X': 1.1,
                'Y': 2.2,
                'Z': 3.3,
                'A': None,
                'B': 0.4,
                'C': 0.5,
            },
            "Command Explanation":
                "SETTING CURRENT:\n\t"
                'The current (in amps) for the X-Axis Motor to 1.1\n\t'
                'The current (in amps) for the Y-Axis Motor to 2.2\n\t'
                'The current (in amps) for the Z-Axis Motor to 3.3\n\t'
                'The current (in amps) for the B-Axis Motor to 0.4\n\t'
                'The current (in amps) for the C-Axis Motor to 0.5'
        }
    ),
]


@pytest.mark.parametrize(
    "g_code,expected_value", TEST_PARAMS)
def test_g_code_function_def_generation(g_code, expected_value) -> None:
    assert g_code.get_explanation_dict() == expected_value
