import pytest
from opentrons.hardware_control.g_code_parsing.g_code_functionality_defs.g_code_functionality_def_base import (  # noqa: E501
    Explanation,
)
from opentrons.hardware_control.g_code_parsing.g_code import GCode
from opentrons.hardware_control.g_code_parsing.errors import UnparsableGCodeError
from typing import List, Dict


def smoothie_g_codes() -> List[GCode]:
    raw_codes = [
        # FORMAT
        # [GCODE, RESPONSE]
        # Home
        ["G28.2 ABCXYZ", "ok\r\nok\r\n"],  # Test 0
        ["G28.2 X", "ok\r\nok\r\n"],  # Test 1
        ["G28.2 Y", "ok\r\nok\r\n"],  # Test 2
        ["G28.2 Z", "ok\r\nok\r\n"],  # Test 3
        ["G28.2 A", "ok\r\nok\r\n"],  # Test 4
        ["G28.2 B", "ok\r\nok\r\n"],  # Test 5
        ["G28.2 C", "ok\r\nok\r\n"],  # Test 6
        # Move
        ["G0 X113.38 Y11.24", "ok\r\nok\r\n"],  # Test 7
        ["G0 A132.6", "ok\r\nok\r\n"],  # Test 8
        ["G0 C-8.5", "ok\r\nok\r\n"],  # Test 9
        # Set Speed
        ["G0 F5.0004", "ok\r\nok\r\n"],  # Test 10
        # Wait
        ["M400", "ok\r\nok\r\n"],  # Test 11
        # Set Current
        ["M907 A0.1 B0.3 C0.05 X0.3 Y0.3 Z0.1", ""],  # Test 12
        # Dwell
        ["G4 P555", "ok\r\nok\r\n"],  # Test 13
        # Get Current Position
        [  # Test 14
            "M114.2",
            "M114.2\r\n\r\nok MCS: A:218.0 B:0.0 C:0.0 X:418.0 Y:-3.0 Z:218.0",
        ],
        # Get Limit Switch Status
        ["M119", "Lid:closed"],  # Test 15
        # Probe
        [  # Test 16
            "G38.2 F420Y-40.0",
            "G38.2 F420Y-40.0\r\n\r\n[PRB:296.825,292.663,218.000:1]\nok\r\nok\r\n",
        ],
        # Absolute Mode
        ["G90", ""],  # Test 17
        # Relative Mode
        ["G91", ""],  # Test 18
        # Reset from Error
        ["M999", "ok\r\nok\r\n"],  # Test 19
        # Push Speed
        # TODO: Get Example
        ["M120", ""],  # Test 20
        # Pop Speed
        # TODO: Get Example
        ["M121", ""],  # Test 21
        # Steps per mm
        [  # Test 22
            "M92 X80.0 Y80.0 Z400 A400",
            "X:80.000000 Y:80.000000 Z:400.000000 A:400.000000 B:955.000000 "
            "C:768.000000 \r\nok\r\nok\r\n",
        ],
        [  # Test 23
            "M92 B768",
            "X:80.000000 Y:80.000000 Z:400.000000 A:400.000000 B:768.000000 "
            "C:768.000000",
        ],
        # Read Instrument ID
        [  # Test 24
            "M369 L",
            "M369 L\r\n\r\nL: 5032305356323032303230303730313031"
            "000000000000000000000000000000 \r\nok\r\nok\r\n",
        ],
        # Write Instrument ID
        [  # Test 25
            "M370 L5032305356323032303230303730313031000000000000000000000000000000",
            "",
        ],
        # Read Instrument Model
        [  # Test 26
            "M371 L",
            "M371 L\r\n\r\nL: 7032305f6d756c74695f76322e3"
            "0000000000000000000000000000000000000 \r\nok\r\nok\r\n",
        ],
        # Write Instrument Model
        [  # Test 27
            "M372 L7032305f6d756c74695f76322e30000000000000000000000000000000000000",
            "",
        ],
        # Set Max Speed
        ["M203.1 A125 B40 C40 X600 Y400 Z125\r\n\r\n", ""],  # Test 28
        # Disengage Motor
        ["M18 ZBCA", ""],  # Test 29
        # Homing Status
        ["G28.6", "G28.6 X:0 Y:0 Z:0 A:0 B:0 C:0"],  # Test 30
        # Acceleration
        ["M204 S10000 A1500 B200 C200 X3000 Y2000 Z1500 \r\n\r\n", ""],  # Test 31
        # Pipette Home
        ["M365.0 A172.15", ""],  # Test 32
        # Pipette Max Travel
        ["M365.1 A60", ""],  # Test 33
        # Pipette Debounce
        ["M365.2 B60", ""],  # Test 34
        # Pipette Retract
        ["M365.3 A20", ""],  # Test 35
        # Microstepping B Enable
        ["M52", ""],  # Test 36
        # Microstepping B Disable
        ["M53", ""],  # Test 37
        # Microstepping C Enable
        ["M54", ""],  # Test 38
        # Microstepping C Disable
        ["M55", ""],  # Test 39
        # Read Instrument ID no space
        [  # Test 40
            "M369 L",
            "M369 L\r\n\r\nL:5032305356323032303230303730313031"
            "000000000000000000000000000000 \r\nok\r\nok\r\n",
        ],
        # Read Instrument Model no space
        [  # Test 41
            "M371 L",
            "M371 L\r\n\r\nL:7032305f6d756c74695f76322e3"
            "0000000000000000000000000000000000000 \r\nok\r\nok\r\n",
        ],
    ]
    g_code_list = [
        GCode.from_raw_code(code, "smoothie", response) for code, response in raw_codes
    ]

    for g_code in g_code_list:
        if len(g_code) > 1:
            g_codes = ", ".join([code.g_code for code in g_code])
            raise Exception(
                "Hey, you forgot to put a comma between the G-Codes for " f"{g_codes}"
            )

    return [code[0] for code in g_code_list]


def magdeck_g_codes() -> List[GCode]:
    raw_codes = [
        # Test 42
        ["G28.2", "ok\r\nok\r\n"],
        # Test 43
        ["G0 Z10.12", "ok\r\nok\r\n"],
        # Test 44
        ["M114.2", "Z:12.34\r\nok\r\nok\r\n"],
        # Test 45
        ["G38.2", "ok\r\nok\r\n"],
        # Test 46
        ["M836", "height:12.34\r\nok\r\nok\r\n"],
        # Test 47
        [
            "M115",
            "serial:MDV0118052801 model:mag_deck_v1 "
            "version:edge-11aa22b\r\nok\r\nok\r\n",
        ],
    ]
    g_code_list = [
        GCode.from_raw_code(code, "magdeck", response) for code, response in raw_codes
    ]

    for g_code in g_code_list:
        if len(g_code) > 1:
            g_codes = ", ".join(code.g_code for code in g_code)
            raise Exception(
                "Hey, you forgot to put a comma between the G-Codes for " f"{g_codes}"
            )

    return [code[0] for code in g_code_list]


def tempdeck_g_codes() -> List[GCode]:
    raw_codes = [
        # Test 48
        ["M18", "ok\r\nok\r\n"],
        # Test 49
        ["M104 S99.6 P0.4 I0.2 D0.3", "ok\r\nok\r\n"],
        # Test 50
        ["M104 S102.5", "\r\nok\r\nok\r\n"],
        # Test 51
        ["M105", "T:86.500 C:66.223\r\nok\r\nok\r\n"],
        # Test 52
        ["M105", "T:none C:45.32\r\nok\r\nok\r\n"],
        # Test 53
        [
            "M115",
            "serial:TDV0118052801 model:temp_deck_v1 "
            "version:edge-11aa22b\r\nok\r\nok\r\n",
        ],
    ]
    g_code_list = [
        GCode.from_raw_code(code, "tempdeck", response) for code, response in raw_codes
    ]

    for g_code in g_code_list:
        if len(g_code) > 1:
            tempdeck_g_codes = ", ".join([code.g_code for code in g_code])
            raise Exception(
                "Hey, you forgot to put a comma between the G-Codes for "
                f"{tempdeck_g_codes}"
            )

    return [code[0] for code in g_code_list]


def thermocycler_g_codes() -> List[GCode]:
    raw_codes = [
        # Test 54
        ["M119", "Lid:open\r\nok\r\nok\r\n"],
        # Test 55
        ["M119", "Lid:closed\r\nok\r\nok\r\n"],
        # Test 56
        [
            "M115",
            "serial:TCV0220191127A01 model:v02 "
            "version:v1.0.0-13-ge948da5\r\nok\r\nok\r\n",
        ],
        # Test 57
        ["M105", "T:none C:22.173 H:none Total_H:none At_target?:0\r\nok\r\nok\r\n"],
        # Test 58
        [
            "M105",
            "T:89.9 C:22.173 H:360.3 Total_H:400.5 At_target?:false\r\nok\r\nok\r\n",
        ],
        # Test 59
        ["M105", "T:70.9 C:70.9 H:0.0 Total_H:55.5 At_target?:true\r\nok\r\nok\r\n"],
        # Test 60
        ["M105", "T:55.6 C:46.6 H:45.3 Total_H:150.5 At_target?:ugh\r\nok\r\nok\r\n"],
        # Test 61
        ["M105", "T:40.000 C:23.823\r\nok\r\nok\r\n"],
        # Test 62
        ["M104 S40.0", "ok\r\nok\r\n"],
        # Test 63
        ["M126", "ok\r\nok\r\n"],
        # Test 64
        ["M127", "ok\r\nok\r\n"],
        # Test 65
        ["M140 S85.7", "ok\r\nok\r\n"],
        # Test 66
        ["M141", "T:none C:21.974\r\nok\r\nok\r\n"],
        # Test 67
        ["M141", "T:40.0 C:23.700\r\nok\r\nok\r\n"],
        # Test 68
        ["M566", "ok\r\nok\r\n"],
        # Test 69
        ["M566", "ERROR:BUSY\r\nok\r\n"],
        # Test 70
        ["M108", "ok\r\nok\r\n"],
        # Test 71
        ["M14", "ok\r\nok\r\n"],
        # Test 72
        ["M18", "ok\r\nok\r\n"],
        # Test 73
        ["M301 P0.2 I0.3 D0.4", "ERROR:BUSY\r\nok\r\n"],
        # Test 74
        ["M301 P0.2 I0.3 D0.4", "ok\r\nok\r\n"],
    ]
    g_code_list = [
        GCode.from_raw_code(code, "thermocycler", response)
        for code, response in raw_codes
    ]

    for g_code in g_code_list:
        if len(g_code) > 1:
            g_codes = ", ".join([code.g_code for code in g_code])
            raise Exception(
                "Hey, you forgot to put a comma between the G-Codes for " f"{g_codes}"
            )

    return [code[0] for code in g_code_list]


def all_g_codes() -> List[GCode]:
    g_codes = []
    g_codes.extend(smoothie_g_codes())
    g_codes.extend(magdeck_g_codes())
    g_codes.extend(tempdeck_g_codes())
    g_codes.extend(thermocycler_g_codes())

    return g_codes


def expected_function_name_values() -> List[str]:
    return [
        #  Smoothie
        "HOME",  # Test 0
        "HOME",  # Test 1
        "HOME",  # Test 2
        "HOME",  # Test 3
        "HOME",  # Test 4
        "HOME",  # Test 5
        "HOME",  # Test 6
        "MOVE",  # Test 7
        "MOVE",  # Test 8
        "MOVE",  # Test 9
        "SET_SPEED",  # Test 10
        "WAIT",  # Test 11
        "SET_CURRENT",  # Test 12
        "DWELL",  # Test 13
        "CURRENT_POSITION",  # Test 14
        "LIMIT_SWITCH_STATUS",  # Test 15
        "PROBE",  # Test 16
        "ABSOLUTE_COORDS",  # Test 17
        "RELATIVE_COORDS",  # Test 18
        "RESET_FROM_ERROR",  # Test 19
        "PUSH_SPEED",  # Test 20
        "POP_SPEED",  # Test 21
        "STEPS_PER_MM",  # Test 22
        "STEPS_PER_MM",  # Test 23
        "READ_INSTRUMENT_ID",  # Test 24
        "WRITE_INSTRUMENT_ID",  # Test 25
        "READ_INSTRUMENT_MODEL",  # Test 26
        "WRITE_INSTRUMENT_MODEL",  # Test 27
        "SET_MAX_SPEED",  # Test 28
        "DISENGAGE_MOTOR",  # Test 29
        "HOMING_STATUS",  # Test 30
        "ACCELERATION",  # Test 31
        "PIPETTE_HOME",  # Test 32
        "PIPETTE_MAX_TRAVEL",  # Test 33
        "PIPETTE_DEBOUNCE",  # Test 34
        "PIPETTE_RETRACT",  # Test 35
        "MICROSTEPPING_B_ENABLE",  # Test 36
        "MICROSTEPPING_B_DISABLE",  # Test 37
        "MICROSTEPPING_C_ENABLE",  # Test 38
        "MICROSTEPPING_C_DISABLE",  # Test 39
        "READ_INSTRUMENT_ID",  # Test 40
        "READ_INSTRUMENT_MODEL",  # Test 41
        # Magdeck
        "HOME",  # Test 42
        "MOVE",  # Test 43
        "GET_CURRENT_POSITION",  # Test 44
        "PROBE_PLATE",  # Test 45
        "GET_PLATE_HEIGHT",  # Test 46
        "DEVICE_INFO",  # Test 47
        # Tempdeck
        "DISENGAGE",  # Test 48
        "SET_TEMP",  # Test 49
        "SET_TEMP",  # Test 50
        "GET_TEMP",  # Test 51
        "GET_TEMP",  # Test 52
        "DEVICE_INFO",  # Test 53
        # Thermocycler
        "GET_LID_STATUS",  # Test 54
        "GET_LID_STATUS",  # Test 55
        "DEVICE_INFO",  # Test 56
        "GET_PLATE_TEMP",  # Test 57
        "GET_PLATE_TEMP",  # Test 58
        "GET_PLATE_TEMP",  # Test 59
        "GET_PLATE_TEMP",  # Test 60
        "GET_PLATE_TEMP",  # Test 61
        "SET_PLATE_TEMP",  # Test 62
        "OPEN_LID",  # Test 63
        "CLOSE_LID",  # Test 64
        "SET_LID_TEMP",  # Test 65
        "GET_LID_TEMP",  # Test 66
        "GET_LID_TEMP",  # Test 67
        "SET_RAMP_RATE",  # Test 68
        "SET_RAMP_RATE",  # Test 69
        "DEACTIVATE_LID",  # Test 70
        "DEACTIVATE_BLOCK",  # Test 71
        "DEACTIVATE_ALL",  # Test 72
        "EDIT_PID_PARAMS",  # Test 73
        "EDIT_PID_PARAMS",  # Test 74
    ]


def expected_arg_values() -> List[Dict[str, int]]:
    return [
        #  Smoothie
        # Test 0
        {"A": None, "B": None, "C": None, "X": None, "Y": None, "Z": None},
        # Test 1
        {"X": None},
        # Test 2
        {"Y": None},
        # Test 3
        {"Z": None},
        # Test 4
        {"A": None},
        # Test 5
        {"B": None},
        # Test 6
        {"C": None},
        # Test 7
        {"X": 113.38, "Y": 11.24},
        # Test 8
        {"A": 132.6},
        # Test 9
        {"C": -8.5},
        # Test 10
        {"F": 5.0004},
        # Test 11
        {},
        # Test 12
        {"A": 0.1, "B": 0.3, "C": 0.05, "X": 0.3, "Y": 0.3, "Z": 0.1},
        # Test 13
        {"P": 555},
        # Test 14
        {},
        # Test 15
        {},
        # Test 16
        {"F": 420, "Y": -40.0},
        # Test 17
        {},
        # Test 18
        {},
        # Test 19
        {},
        # Test 20
        {},
        # Test 21
        {},
        # Test 22
        {"X": 80.0, "Y": 80.0, "Z": 400, "A": 400},
        # Test 23
        {"B": 768.0},
        # # TODO: Need to figure out to do with 24, 25, 26, and 27
        # Test 24
        {"L": None},
        # Test 25
        {"L": "5032305356323032303230303730313031000000000000000000000000000000"},
        # Test 26
        {"L": None},
        # Test 27
        {"L": "7032305f6d756c74695f76322e30000000000000000000000000000000000000"},
        # Test 28
        {"A": 125.0, "B": 40.0, "C": 40.0, "X": 600.0, "Y": 400.0, "Z": 125.0},
        # Test 29
        {"Z": None, "B": None, "C": None, "A": None},
        # Test 30
        {},
        # Test 31
        {
            "S": 10000.0,
            "A": 1500.0,
            "B": 200.0,
            "C": 200.0,
            "X": 3000.0,
            "Y": 2000.0,
            "Z": 1500.0,
        },
        # Test 32
        {"A": 172.15},
        # Test 33
        {"A": 60.0},
        # Test 34
        {
            "B": 60.0,
        },
        # Test 35
        {"A": 20.0},
        # Test 36
        {},
        # Test 37
        {},
        # Test 38
        {},
        # Test 39
        {},
        # Test 40
        {"L": None},
        # Test 41
        {"L": None},
        # Magdeck
        # Test 42
        {},
        # Test 43
        {"Z": 10.12},
        # Test 44
        {},
        # Test 45
        {},
        # Test 46
        {},
        # Test 47
        {},
        # Tempdeck
        # Test 48
        {},
        # Test 49
        {"S": 99.6, "P": 0.4, "I": 0.2, "D": 0.3},
        # Test 50
        {"S": 102.5},
        # Test 51
        {},
        # Test 52
        {},
        # Test 53
        {},
        # Thermocycler
        # Test 54
        {},
        # Test 55
        {},
        # Test 56
        {},
        # Test 57
        {},
        # Test 58
        {},
        # Test 59
        {},
        # Test 60
        {},
        # Test 61
        {},
        # Test 62
        {"S": 40.0},
        # Test 63
        {},
        # Test 64
        {},
        # Test 65
        {"S": 85.7},
        # Test 66
        {},
        # Test 67
        {},
        # Test 68
        {},
        # Test 69
        {},
        # Test 70
        {},
        # Test 71
        {},
        # Test 72
        {},
        # Test 73
        {"P": 0.2, "I": 0.3, "D": 0.4},
        # Test 74
        {"P": 0.2, "I": 0.3, "D": 0.4},
    ]


def explanations() -> List[Explanation]:
    return [
        #  Smoothie
        Explanation(  # Test 0
            code="G28.2",
            command_name="HOME",
            response="",
            provided_args={
                "A": None,
                "B": None,
                "C": None,
                "X": None,
                "Y": None,
                "Z": None,
            },
            command_explanation="Homing the following axes: X, Y, Z, A, B, C",
        ),
        Explanation(  # Test 1
            code="G28.2",
            command_name="HOME",
            response="",
            provided_args={"X": None},
            command_explanation="Homing the following axes: X",
        ),
        Explanation(  # Test 2
            code="G28.2",
            command_name="HOME",
            response="",
            provided_args={"Y": None},
            command_explanation="Homing the following axes: Y",
        ),
        Explanation(  # Test 3
            code="G28.2",
            command_name="HOME",
            response="",
            provided_args={"Z": None},
            command_explanation="Homing the following axes: Z",
        ),
        Explanation(  # Test 4
            code="G28.2",
            command_name="HOME",
            response="",
            provided_args={"A": None},
            command_explanation="Homing the following axes: A",
        ),
        Explanation(  # Test 5
            code="G28.2",
            command_name="HOME",
            response="",
            provided_args={"B": None},
            command_explanation="Homing the following axes: B",
        ),
        Explanation(  # Test 6
            code="G28.2",
            command_name="HOME",
            response="",
            provided_args={
                "C": None,
            },
            command_explanation="Homing the following axes: C",
        ),
        Explanation(  # Test 7
            code="G0",
            command_name="MOVE",
            response="",
            provided_args={"X": 113.38, "Y": 11.24},
            command_explanation="Moving the robot as follows:\n\t"
            "The gantry to 113.38 on the X-Axis\n\t"
            "The gantry to 11.24 on the Y-Axis",
        ),
        Explanation(  # Test 8
            code="G0",
            command_name="MOVE",
            response="",
            provided_args={"A": 132.6},
            command_explanation="Moving the robot as follows:\n\t"
            "The right pipette arm height to 132.6",
        ),
        Explanation(  # Test 9
            code="G0",
            command_name="MOVE",
            response="",
            provided_args={"C": -8.5},
            command_explanation="Moving the robot as follows:\n\t"
            "The right pipette suction to -8.5",
        ),
        Explanation(  # Test 10
            code="G0",
            command_name="SET_SPEED",
            response="",
            provided_args={"F": 5.0004},
            command_explanation="Setting speed to 5.0004",
        ),
        Explanation(  # Test 11
            code="M400",
            command_name="WAIT",
            response="",
            provided_args={},
            command_explanation="Waiting for motors to stop moving",
        ),
        Explanation(  # Test 12
            code="M907",
            command_name="SET_CURRENT",
            response="",
            provided_args={"X": 0.3, "Y": 0.3, "Z": 0.1, "A": 0.1, "B": 0.3, "C": 0.05},
            command_explanation="Setting the current (in amps) to:\n\t"
            "X-Axis Motor: 0.3\n\t"
            "Y-Axis Motor: 0.3\n\t"
            "Z-Axis Motor: 0.1\n\t"
            "A-Axis Motor: 0.1\n\t"
            "B-Axis Motor: 0.3\n\t"
            "C-Axis Motor: 0.05",
        ),
        Explanation(  # Test 13
            code="G4",
            command_name="DWELL",
            response="",
            provided_args={"P": 555.0},
            command_explanation="Pausing movement for 555.0ms",
        ),
        Explanation(  # Test 14
            code="M114.2",
            command_name="CURRENT_POSITION",
            response="The current position of the robot is:"
            "\n\tA Axis: 218.0"
            "\n\tB Axis: 0.0"
            "\n\tC Axis: 0.0"
            "\n\tX Axis: 418.0"
            "\n\tY Axis: -3.0"
            "\n\tZ Axis: 218.0",
            provided_args={},
            command_explanation="Getting current position for all axes",
        ),
        Explanation(  # Test 15
            code="M119",
            command_name="LIMIT_SWITCH_STATUS",
            response="Lid:closed",
            provided_args={},
            command_explanation="Getting the limit switch status",
        ),
        Explanation(  # Test 16
            code="G38.2",
            command_name="PROBE",
            response="Probed to :"
            "\n\tX Axis: 296.825"
            "\n\tY Axis: 292.663"
            "\n\tZ Axis: 218.000",
            provided_args={"F": 420, "Y": -40.0},
            command_explanation="Probing -40.0 on the Y axis, at a speed of 420.0",
        ),
        Explanation(  # Test 17
            code="G90",
            command_name="ABSOLUTE_COORDS",
            response="",
            provided_args={},
            command_explanation="Switching to Absolute Coordinate Mode",
        ),
        Explanation(  # Test 18
            code="G91",
            command_name="RELATIVE_COORDS",
            response="",
            provided_args={},
            command_explanation="Switching to Relative Coordinate Mode",
        ),
        Explanation(  # Test 19
            code="M999",
            command_name="RESET_FROM_ERROR",
            response="",
            provided_args={},
            command_explanation="Resetting OT-2 from error state",
        ),
        Explanation(  # Test 20
            code="M120",
            command_name="PUSH_SPEED",
            response="",
            provided_args={},
            command_explanation="Saving current speed so temporary" " speed can be set",
        ),
        Explanation(  # Test 21
            code="M121",
            command_name="POP_SPEED",
            response="",
            provided_args={},
            command_explanation="Loading previously saved speed",
        ),
        Explanation(  # Test 22
            code="M92",
            command_name="STEPS_PER_MM",
            response="Current set steps per mm:"
            "\n\tX Axis: 80.000000"
            "\n\tY Axis: 80.000000"
            "\n\tZ Axis: 400.000000"
            "\n\tA Axis: 400.000000"
            "\n\tB Axis: 955.000000"
            "\n\tC Axis: 768.000000",
            provided_args={"X": 80.0, "Y": 80.0, "Z": 400.0, "A": 400.0},
            command_explanation="Setting the following axes steps per"
            " mm:"
            "\n\tX-Axis: 80.0 steps per mm"
            "\n\tY-Axis: 80.0 steps per mm"
            "\n\tZ-Axis: 400.0 steps per mm"
            "\n\tA-Axis: 400.0 steps per mm",
        ),
        Explanation(  # Test 23
            code="M92",
            command_name="STEPS_PER_MM",
            response="Current set steps per mm:"
            "\n\tX Axis: 80.000000"
            "\n\tY Axis: 80.000000"
            "\n\tZ Axis: 400.000000"
            "\n\tA Axis: 400.000000"
            "\n\tB Axis: 768.000000"
            "\n\tC Axis: 768.000000",
            provided_args={"B": 768.0},
            command_explanation="Setting the following axes steps per"
            " mm:"
            "\n\tB-Axis: 768.0 steps per mm",
        ),
        # Test 24
        Explanation(
            code="M369",
            command_name="READ_INSTRUMENT_ID",
            response="Read Instrument ID: P20SV202020070101",
            provided_args={"L": None},
            command_explanation="Reading instrument ID for Left pipette",
        ),
        # Test 25
        Explanation(
            code="M370",
            command_name="WRITE_INSTRUMENT_ID",
            response="",
            provided_args={
                "L": "5032305356323032303230303730313031"
                "000000000000000000000000000000"
            },
            command_explanation="Writing instrument ID 50323053563230323032303037303130"
            "31000000000000000000000000000000 for Left pipette",
        ),
        # Test 26
        Explanation(
            code="M371",
            command_name="READ_INSTRUMENT_MODEL",
            response="Read Instrument Model: p20_multi_v2.0",
            provided_args={"L": None},
            command_explanation="Reading instrument model for Left pipette",
        ),
        # Test 27
        Explanation(
            code="M372",
            command_name="WRITE_INSTRUMENT_MODEL",
            response="",
            provided_args={
                "L": "7032305f6d756c74695f76322e"
                "30000000000000000000000000000000000000"
            },
            command_explanation="Writing instrument model 7032305f6d756c74695f76322e3"
            "0000000000000000000000000000000000000 for Left pipette",
        ),
        Explanation(  # Test 28
            code="M203.1",
            command_name="SET_MAX_SPEED",
            response="",
            provided_args={
                "A": 125.0,
                "B": 40.0,
                "C": 40.0,
                "X": 600.0,
                "Y": 400.0,
                "Z": 125.0,
            },
            command_explanation="Setting the max speed for the following axes:"
            "\n\tX-Axis: 600.0"
            "\n\tY-Axis: 400.0"
            "\n\tZ-Axis: 125.0"
            "\n\tA-Axis: 125.0"
            "\n\tB-Axis: 40.0"
            "\n\tC-Axis: 40.0",
        ),
        Explanation(  # Test 29
            code="M18",
            command_name="DISENGAGE_MOTOR",
            response="",
            provided_args={"Z": None, "B": None, "C": None, "A": None},
            command_explanation="Disengaging motor for the following axes: Z, A, B, C",
        ),
        Explanation(  # Test 30
            code="G28.6",
            command_name="HOMING_STATUS",
            response="The homing status of the robot is:"
            "\n\tA Axis: 0"
            "\n\tB Axis: 0"
            "\n\tC Axis: 0"
            "\n\tX Axis: 0"
            "\n\tY Axis: 0"
            "\n\tZ Axis: 0",
            provided_args={},
            command_explanation="Getting homing status for all axes",
        ),
        Explanation(  # Test 31
            code="M204",
            command_name="ACCELERATION",
            response="",
            provided_args={
                "S": 10000.0,
                "A": 1500.0,
                "B": 200.0,
                "C": 200.0,
                "X": 3000.0,
                "Y": 2000.0,
                "Z": 1500.0,
            },
            command_explanation="Setting acceleration for the following axes:"
            "\n\tDefault: 10000.0"
            "\n\tX-Axis: 3000.0"
            "\n\tY-Axis: 2000.0"
            "\n\tLeft Pipette Arm: 1500.0"
            "\n\tRight Pipette Arm: 1500.0"
            "\n\tLeft Pipette Suction: 200.0"
            "\n\tRight Pipette Suction: 200.0",
        ),
        Explanation(  # Test 32
            code="M365.0",
            command_name="PIPETTE_HOME",
            response="",
            provided_args={"A": 172.15},
            command_explanation="Setting the pipette home height for the following "
            "axes:"
            "\n\tA-Axis: 172.15",
        ),
        Explanation(  # Test 33
            code="M365.1",
            command_name="PIPETTE_MAX_TRAVEL",
            response="",
            provided_args={"A": 60.0},
            command_explanation="Setting the pipette max travel height for the "
            "following axes:"
            "\n\tA-Axis: 60.0",
        ),
        Explanation(  # Test 34
            code="M365.2",
            command_name="PIPETTE_DEBOUNCE",
            response="",
            provided_args={"B": 60.0},
            command_explanation="Setting the pipette endstop debounce time for the "
            "following axes:"
            "\n\tB-Axis: 60.0",
        ),
        Explanation(  # Test 35
            code="M365.3",
            command_name="PIPETTE_RETRACT",
            response="",
            provided_args={"A": 20.0},
            command_explanation="Setting the pipette endstop retract distance for the "
            "following axes:"
            "\n\tA-Axis: 20.0",
        ),
        Explanation(  # Test 36
            code="M52",
            command_name="MICROSTEPPING_B_ENABLE",
            response="",
            provided_args={},
            command_explanation="Enabling microstepping on B-Axis",
        ),
        Explanation(  # Test 37
            code="M53",
            command_name="MICROSTEPPING_B_DISABLE",
            response="",
            provided_args={},
            command_explanation="Disabling microstepping on B-Axis",
        ),
        Explanation(  # Test 38
            code="M54",
            command_name="MICROSTEPPING_C_ENABLE",
            response="",
            provided_args={},
            command_explanation="Enabling microstepping on C-Axis",
        ),
        Explanation(  # Test 39
            code="M55",
            command_name="MICROSTEPPING_C_DISABLE",
            response="",
            provided_args={},
            command_explanation="Disabling microstepping on C-Axis",
        ),
        # Test 40
        Explanation(
            code="M369",
            command_name="READ_INSTRUMENT_ID",
            response="Read Instrument ID: P20SV202020070101",
            provided_args={"L": None},
            command_explanation="Reading instrument ID for Left pipette",
        ),
        # Test 41
        Explanation(
            code="M371",
            command_name="READ_INSTRUMENT_MODEL",
            response="Read Instrument Model: p20_multi_v2.0",
            provided_args={"L": None},
            command_explanation="Reading instrument model for Left pipette",
        ),
        # Magdeck
        # Test 42
        Explanation(
            code="G28.2",
            command_name="HOME",
            response="",
            provided_args={},
            command_explanation="Homing the magdeck",
        ),
        # Test 43
        Explanation(
            code="G0",
            command_name="MOVE",
            response="",
            provided_args={"Z": 10.12},
            command_explanation="Setting magnet height to 10.12mm",
        ),
        # Test 44
        Explanation(
            code="M114.2",
            command_name="GET_CURRENT_POSITION",
            response="Current height of magnets are 12.34mm",
            provided_args={},
            command_explanation="Reading current position of magnets",
        ),
        # Test 45
        Explanation(
            code="G38.2",
            command_name="PROBE_PLATE",
            response="",
            provided_args={},
            command_explanation="Magdeck probing attached labware to get height in mm",
        ),
        # Test 46
        Explanation(
            code="M836",
            command_name="GET_PLATE_HEIGHT",
            response="Magdeck calculated labware height at 12.34mm",
            provided_args={},
            command_explanation="Calculating magdeck labware height",
        ),
        # Test 47
        Explanation(
            code="M115",
            command_name="DEVICE_INFO",
            response="Magdeck info:"
            "\n\tSerial Number: MDV0118052801"
            "\n\tModel: mag_deck_v1"
            "\n\tFirmware Version: edge-11aa22b",
            provided_args={},
            command_explanation="Getting magdeck device info",
        ),
        # Tempdeck
        # Test 48
        Explanation(
            code="M18",
            command_name="DISENGAGE",
            response="",
            provided_args={},
            command_explanation="Halting holding temperature. Reducing temperature to "
            "55C if it is greater than 55C",
        ),
        # Test 49
        Explanation(
            code="M104",
            command_name="SET_TEMP",
            response="",
            provided_args={"S": 99.6, "P": 0.4, "I": 0.2, "D": 0.3},
            command_explanation="Setting temperature values to the following:"
            "\n\tTemperature: 99.6C"
            "\n\tKp: 0.4"
            "\n\tKi: 0.2"
            "\n\tKd: 0.3",
        ),
        # Test 50
        Explanation(
            code="M104",
            command_name="SET_TEMP",
            response="",
            provided_args={"S": 102.5},
            command_explanation="Setting temperature values to the following:"
            "\n\tTemperature: 102.5C",
        ),
        # Test 51
        Explanation(
            code="M105",
            command_name="GET_TEMP",
            response="Set temperature is 86.500C. Current temperature is 66.223C",
            provided_args={},
            command_explanation="Getting temperature",
        ),
        # Test 52
        Explanation(
            code="M105",
            command_name="GET_TEMP",
            response="Temp deck is disengaged. Current temperature is 45.32C",
            provided_args={},
            command_explanation="Getting temperature",
        ),
        # Test 53
        Explanation(
            code="M115",
            command_name="DEVICE_INFO",
            response="Tempdeck info:"
            "\n\tSerial Number: TDV0118052801"
            "\n\tModel: temp_deck_v1"
            "\n\tFirmware Version: edge-11aa22b",
            provided_args={},
            command_explanation="Getting tempdeck device info",
        ),
        # Thermocycler
        # Test 54
        Explanation(
            code="M119",
            command_name="GET_LID_STATUS",
            response="Lid Status: Open",
            provided_args={},
            command_explanation="Getting status of thermocycler lid",
        ),
        # Test 55
        Explanation(
            code="M119",
            command_name="GET_LID_STATUS",
            response="Lid Status: Closed",
            provided_args={},
            command_explanation="Getting status of thermocycler lid",
        ),
        # Test 56
        Explanation(
            code="M115",
            command_name="DEVICE_INFO",
            response="Thermocycler info:"
            "\n\tSerial Number: TCV0220191127A01"
            "\n\tModel: v02"
            "\n\tFirmware Version: v1.0.0-13-ge948da5",
            provided_args={},
            command_explanation="Getting thermocycler device info",
        ),
        # Test 57
        Explanation(
            code="M105",
            command_name="GET_PLATE_TEMP",
            response="Temperature values for thermocycler are as follows:"
            "\n\tTarget temperature not set"
            "\n\tCurrent temperature is: 22.173C",
            provided_args={},
            command_explanation="Getting temperature values for thermocycler",
        ),
        # Test 58
        Explanation(
            code="M105",
            command_name="GET_PLATE_TEMP",
            response="Temperature values for thermocycler are as follows:"
            "\n\tTarget temperature is: 89.9C"
            "\n\tCurrent temperature is: 22.173C"
            "\n\tRemaining hold time is: 360.3ms"
            "\n\tTotal hold time is: 400.5ms"
            "\n\tNot at target temperature",
            provided_args={},
            command_explanation="Getting temperature values for thermocycler",
        ),
        # Test 59
        Explanation(
            code="M105",
            command_name="GET_PLATE_TEMP",
            response="Temperature values for thermocycler are as follows:"
            "\n\tTarget temperature is: 70.9C"
            "\n\tCurrent temperature is: 70.9C"
            "\n\tRemaining hold time is: 0.0ms"
            "\n\tTotal hold time is: 55.5ms"
            "\n\tAt target temperature",
            provided_args={},
            command_explanation="Getting temperature values for thermocycler",
        ),
        # Test 60
        Explanation(
            code="M105",
            command_name="GET_PLATE_TEMP",
            response="Temperature values for thermocycler are as follows:"
            "\n\tTarget temperature is: 55.6C"
            "\n\tCurrent temperature is: 46.6C"
            "\n\tRemaining hold time is: 45.3ms"
            "\n\tTotal hold time is: 150.5ms"
            "\n\tTarget temperature is unparsable: ugh",
            provided_args={},
            command_explanation="Getting temperature values for thermocycler",
        ),
        # Test 61
        Explanation(
            code="M105",
            command_name="GET_PLATE_TEMP",
            response="Temperature values for thermocycler are as follows:"
            "\n\tTarget temperature is: 40.000C"
            "\n\tCurrent temperature is: 23.823C",
            provided_args={},
            command_explanation="Getting temperature values for thermocycler",
        ),
        # Test 62
        Explanation(
            code="M104",
            command_name="SET_PLATE_TEMP",
            response="",
            provided_args={"S": 40.0},
            command_explanation="Setting thermocycler plate temp to 40.0C",
        ),
        # Test 63
        Explanation(
            code="M126",
            command_name="OPEN_LID",
            response="",
            provided_args={},
            command_explanation="Opening thermocycler lid",
        ),
        # Test 64
        Explanation(
            code="M127",
            command_name="CLOSE_LID",
            response="",
            provided_args={},
            command_explanation="Closing thermocycler lid",
        ),
        # Test 65
        Explanation(
            code="M140",
            command_name="SET_LID_TEMP",
            response="",
            provided_args={"S": 85.7},
            command_explanation="Setting thermocycler lid temp to 85.7C",
        ),
        # Test 66
        Explanation(
            code="M141",
            command_name="GET_LID_TEMP",
            response="Temperature for thermocycler lid is not set"
            "\nCurrent temperature of lid is 21.974C",
            provided_args={},
            command_explanation="Getting temperature for thermocycler lid",
        ),
        # Test 67
        Explanation(
            code="M141",
            command_name="GET_LID_TEMP",
            response="Set temperature for thermocycler lid is 40.0C"
            "\nCurrent temperature of lid is 23.700C",
            provided_args={},
            command_explanation="Getting temperature for thermocycler lid",
        ),
        # Test 68
        Explanation(
            code="M566",
            command_name="SET_RAMP_RATE",
            response="",
            provided_args={},
            command_explanation="Setting thermocycler ramp rate."
            "\nNote: This is an unimplemented feature, "
            "setting this does nothing",
        ),
        # Test 69
        Explanation(
            code="M566",
            command_name="SET_RAMP_RATE",
            response="",
            provided_args={},
            command_explanation="Setting thermocycler ramp rate."
            "\nNote: This is an unimplemented feature, "
            "setting this does nothing",
        ),
        # Test 70
        Explanation(
            code="M108",
            command_name="DEACTIVATE_LID",
            response="",
            provided_args={},
            command_explanation="Deactivating thermocycler lid",
        ),
        # Test 71
        Explanation(
            code="M14",
            command_name="DEACTIVATE_BLOCK",
            response="",
            provided_args={},
            command_explanation="Deactivating thermocycler block",
        ),
        # Test 72
        Explanation(
            code="M18",
            command_name="DEACTIVATE_ALL",
            response="",
            provided_args={},
            command_explanation="Deactivating thermocycler block and lid",
        ),
        # Test 73
        Explanation(
            code="M301",
            command_name="EDIT_PID_PARAMS",
            response="Cannot set PID values. Thermocycler busy",
            provided_args={"P": 0.2, "I": 0.3, "D": 0.4},
            command_explanation="Editing PID values to the following:"
            "\n\tKp: 0.2"
            "\n\tKi: 0.3"
            "\n\tKd: 0.4",
        ),
        # Test 74
        Explanation(
            code="M301",
            command_name="EDIT_PID_PARAMS",
            response="Edit successful",
            provided_args={"P": 0.2, "I": 0.3, "D": 0.4},
            command_explanation="Editing PID values to the following:"
            "\n\tKp: 0.2"
            "\n\tKi: 0.3"
            "\n\tKd: 0.4",
        ),
    ]


@pytest.mark.parametrize(
    "parsed_value,expected_value",
    list(zip(all_g_codes(), expected_function_name_values())),
)
def test_smoothie_g_code_function_lookup(
    parsed_value: GCode, expected_value: str
) -> None:
    assert parsed_value.get_gcode_function() == expected_value


@pytest.mark.parametrize(
    "parsed_value,expected_value", list(zip(all_g_codes(), expected_arg_values()))
)
def test_g_code_args(parsed_value: GCode, expected_value: dict) -> None:
    assert parsed_value.g_code_args == expected_value


@pytest.mark.parametrize(
    "parsed_value,expected_value", list(zip(all_g_codes(), explanations()))
)
def test_explanation(parsed_value: GCode, expected_value: dict) -> None:
    assert parsed_value.get_explanation() == expected_value


@pytest.mark.parametrize(
    "bad_raw_code",
    [
        "M370 T5032305356323032303230303730313031000000000000000000000000000000",
        "M372 Q7032305f6d756c74695f76322e30000000000000000000000000000000000000",
    ],
)
def test_bad_read_write_g_codes(bad_raw_code):
    with pytest.raises(UnparsableGCodeError):
        GCode.from_raw_code(bad_raw_code, "smoothie", "")


@pytest.mark.parametrize(
    "raw_code",
    [
        "M204 S10000.0 A1500.0 B200.0 C200.0 X3000.0 Y2000.0 Z1500.0",
        "M370 L5032305356323032303230303730313031000000000000000000000000000000",
        "M400",
    ],
)
def test_get_g_code_line(raw_code):
    assert GCode.from_raw_code(raw_code, "smoothie", "")[0].g_code_line == raw_code


@pytest.mark.parametrize(
    "raw_code",
    [
        "M3000 S10000 A1500 B200 C200 X3000 Y2000 Z1500",
        "G5678",
    ],
)
def test_unparsable_g_code_error(raw_code):
    with pytest.raises(UnparsableGCodeError):
        GCode.from_raw_code(raw_code, "smoothie", "")[0].get_gcode_function()
