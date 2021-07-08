import pytest
from opentrons.hardware_control.g_code_parsing.g_code_functionality_defs.\
    g_code_functionality_def_base import Explanation
from opentrons.hardware_control.g_code_parsing.g_code import GCode
from typing import List, Dict


def gcodes() -> List[GCode]:
    raw_codes = [
        # Home
        'G28.2 ABCXYZ',  # Test 0
        'G28.2 X',  # Test 1
        'G28.2 Y',  # Test 2
        'G28.2 Z',  # Test 3
        'G28.2 A',  # Test 4
        'G28.2 B',  # Test 5
        'G28.2 C',  # Test 6

        # Move
        'G0 X113.38 Y11.24',  # Test 7
        'G0 A132.6',  # Test 8
        'G0 C-8.5',  # Test 9

        # Set Speed
        'G0 F5.0004',  # Test 10

        # Wait
        'M400',  # Test 11

        # Set Current
        'M907 A0.1 B0.3 C0.05 X0.3 Y0.3 Z0.1',  # Test 12

        # Dwell
        'G4 P555',  # Test 13

        # Get Current Position
        'M114.2',  # Test 14

        # Get Limit Switch Status
        'M119',  # Test 15

        # Probe
        'G38.2 A',  # Test 16
        'G38.2 ABC',  # Test 17

        # Absolute Mode
        'G90',  # Test 18

        # Relative Mode
        'G91',  # Test 19

        # Reset from Error
        'M999',  # Test 20

        # Push Speed
        'M120',  # Test 21

        # Pop Speed
        'M121',  # Test 22

        # Steps per mm
        'M92 X200 Y1000 Z100 A10 B10 C10',  # Test 23
        'M92 X100',  # Test 24
        'M92 A400',  # Test 25
    ]

    g_code_list = [
        GCode.from_raw_code(code, 555.1, 'smoothie')
        for code in raw_codes
    ]

    for g_code in g_code_list:
        if len(g_code) > 1:
            g_codes = ', '.join([code.g_code for code in g_code])
            raise Exception('Hey, you forgot to put a comma between the G-Codes for '
                            f'{g_codes}')

    return [code[0] for code in g_code_list]


def expected_function_name_values() -> List[str]:
    return [
        'HOME',  # Test 0
        'HOME',  # Test 1
        'HOME',  # Test 2
        'HOME',  # Test 3
        'HOME',  # Test 4
        'HOME',  # Test 5
        'HOME',  # Test 6
        'MOVE',  # Test 7
        'MOVE',  # Test 8
        'MOVE',  # Test 9
        'SET_SPEED',  # Test 10
        'WAIT',  # Test 11
        'SET_CURRENT',  # Test 12
        'DWELL',  # Test 13
        'CURRENT_POSITION',  # Test 14
        'LIMIT_SWITCH_STATUS',  # Test 15
        'PROBE',  # Test 16
        'PROBE',  # Test 17
        'ABSOLUTE_COORDS',  # Test 18
        'RELATIVE_COORDS',  # Test 19
        'RESET_FROM_ERROR',  # Test 20
        'PUSH_SPEED',  # Test 21
        'POP_SPEED',  # Test 22
        'STEPS_PER_MM',  # Test 23
        'STEPS_PER_MM',  # Test 24
        'STEPS_PER_MM',  # Test 25
    ]


def expected_arg_values() -> List[Dict[str, int]]:
    return [

        # Test 0
        {'A': None, 'B': None, 'C': None, 'X': None, 'Y': None, 'Z': None},

        # Test 1
        {'X': None},

        # Test 2
        {'Y': None},

        # Test 3
        {'Z': None},

        # Test 4
        {'A': None},

        # Test 5
        {'B': None},

        # Test 6
        {'C': None},

        # Test 7
        {'X': 113.38, 'Y': 11.24},

        # Test 8
        {'A': 132.6},

        # Test 9
        {'C': -8.5},

        # Test 10
        {'F': 5.0004},

        # Test 11
        {},

        # Test 12
        {'A': 0.1, 'B': 0.3, 'C': 0.05, 'X': 0.3, 'Y': 0.3, 'Z': 0.1},

        # Test 13
        {'P': 555},

        # Test 14
        {},

        # Test 15
        {},

        # Test 16
        {'A': None},

        # Test 17
        {'A': None, 'B': None, 'C': None},

        # Test 18
        {},

        # Test 19
        {},

        # Test 20
        {},

        # Test 21
        {},

        # Test 22
        {},

        # Test 23
        {'X': 200, 'Y': 1000, 'Z': 100, 'A': 10, 'B': 10, 'C': 10},

        # Test 24
        {'X': 100},

        # Test 25
        {'A': 400},
    ]


def explanations() -> List[Explanation]:
    return [
        Explanation(  # Test 0
            code='G28.2',
            command_name='HOME',
            provided_args={
                'A': None,
                'B': None,
                'C': None,
                'X': None,
                'Y': None,
                'Z': None,
            },
            command_explanation='HOME:\n\tHoming the following axes: X, Y, Z, A, B, C'
        ),
        Explanation(  # Test 1
            code='G28.2',
            command_name='HOME',
            provided_args={
                'X': None,
            },
            command_explanation='HOME:\n\tHoming the following axes: X'
        ),
        Explanation(  # Test 2
            code='G28.2',
            command_name='HOME',
            provided_args={
                'Y': None,
            },
            command_explanation='HOME:\n\tHoming the following axes: Y'
        ),
        Explanation(  # Test 3
            code='G28.2',
            command_name='HOME',
            provided_args={
                'Z': None,
            },
            command_explanation='HOME:\n\tHoming the following axes: Z'
        ),
        Explanation(  # Test 4
            code='G28.2',
            command_name='HOME',
            provided_args={
                'A': None,
            },
            command_explanation='HOME:\n\tHoming the following axes: A'
        ),
        Explanation(  # Test 5
            code='G28.2',
            command_name='HOME',
            provided_args={
                'B': None,
            },
            command_explanation='HOME:\n\tHoming the following axes: B'
        ),
        Explanation(  # Test 6
            code='G28.2',
            command_name='HOME',
            provided_args={
                'C': None,
            },
            command_explanation='HOME:\n\tHoming the following axes: C'
        ),
        Explanation(  # Test 7
            code='G0',
            command_name='MOVE',
            provided_args={
                'X': 113.38,
                'Y': 11.24,
            },
            command_explanation='MOVE:\n\t'
                                'The gantry to 113.38 on the X-Axis\n\t'
                                'The gantry to 11.24 on the Y-Axis'
        ),
        Explanation(  # Test 8
            code='G0',
            command_name='MOVE',
            provided_args={
                'A': 132.6,
            },
            command_explanation='MOVE:\n\t'
                                'The right pipette arm height to 132.6'
        ),
        Explanation(  # Test 9
            code='G0',
            command_name='MOVE',
            provided_args={
                'C': -8.5,
            },
            command_explanation='MOVE:\n\t'
                                'The right pipette suction to -8.5'
        ),
        Explanation(  # Test 10
            code='G0',
            command_name='SET_SPEED',
            provided_args={
                'F': 5.0004
            },
            command_explanation='SETTING SPEED:\n\tSetting speed to 5.0004'
        ),
        Explanation(  # Test 11
            code='M400',
            command_name='WAIT',
            provided_args={},
            command_explanation='WAITING \n\tWaiting for motors to stop moving'
        ),
        Explanation(  # Test 12
            code='M907',
            command_name='SET_CURRENT',
            provided_args={
                'X': 0.3,
                'Y': 0.3,
                'Z': 0.1,
                'A': 0.1,
                'B': 0.3,
                'C': 0.05,
            },
            command_explanation='SETTING CURRENT:\n\t'
                                'The current (in amps) for the X-Axis Motor to 0.3\n\t'
                                'The current (in amps) for the Y-Axis Motor to 0.3\n\t'
                                'The current (in amps) for the Z-Axis Motor to 0.1\n\t'
                                'The current (in amps) for the A-Axis Motor to 0.1\n\t'
                                'The current (in amps) for the B-Axis Motor to 0.3\n\t'
                                'The current (in amps) for the C-Axis Motor to 0.05'
        ),
        Explanation(  # Test 13
            code='G4',
            command_name='DWELL',
            provided_args={
                'P': 555.0
            },
            command_explanation='DWELLING:\n\t'
                                'Pausing movement for 555.0ms'
        ),
        Explanation(  # Test 14
            code='M114.2',
            command_name='CURRENT_POSITION',
            provided_args={},
            command_explanation='CURRENT POSITION:\n\t'
                                'Getting current position for all axes'
        ),
        Explanation(  # Test 15
            code='M119',
            command_name='LIMIT_SWITCH_STATUS',
            provided_args={},
            command_explanation='LIMIT SWITCH STATUS:\n\t'
                                'Getting the limit switch status'
        ),
        Explanation(  # Test 16
            code='G38.2',
            command_name='PROBE',
            provided_args={
                'A': None,
            },
            command_explanation='PROBE:\n\tProbing the following axes: A'
        ),
        Explanation(  # Test 17
            code='G38.2',
            command_name='PROBE',
            provided_args={
                'A': None,
                'B': None,
                'C': None,
            },
            command_explanation='PROBE:\n\tProbing the following axes: A, B, C'
        ),
        Explanation(  # Test 18
            code='G90',
            command_name='ABSOLUTE_COORDS',
            provided_args={},
            command_explanation='ABSOLUTE COORDINATE MODE: \n\t'
                                'Switching to Absolute Coordinate Mode'
        ),
        Explanation(  # Test 19
            code='G91',
            command_name='RELATIVE_COORDS',
            provided_args={},
            command_explanation='RELATIVE COORDINATE MODE: \n\t'
                                'Switching to Relative Coordinate Mode'
        ),
        Explanation(  # Test 20
            code='M999',
            command_name='RESET_FROM_ERROR',
            provided_args={},
            command_explanation='RESET FROM ERROR: \n\tResetting OT-2 from error state'
        ),
        Explanation(  # Test 21
            code='M120',
            command_name='PUSH_SPEED',
            provided_args={},
            command_explanation='PUSH SPEED: \n\tSaving current speed so temporary'
                                ' speed can be set'
        ),
        Explanation(  # Test 22
            code='M121',
            command_name='POP_SPEED',
            provided_args={},
            command_explanation='POP SPEED: \n\tLoading previously saved speed'
        ),
        Explanation(  # Test 23
            code='M92',
            command_name='STEPS_PER_MM',
            provided_args={
                'X': 200.0,
                'Y': 1000.0,
                'Z': 100.0,
                'A': 10.0,
                'B': 10.0,
                'C': 10.0,
            },
            command_explanation='STEPS PER MM:\n\tSetting the following axes steps per'
                                ' mm:'
                                '\n\tX-Axis 200.0 steps per mm'
                                '\n\tY-Axis 1000.0 steps per mm'
                                '\n\tZ-Axis 100.0 steps per mm'                                
                                '\n\tA-Axis 10.0 steps per mm'
                                '\n\tB-Axis 10.0 steps per mm'
                                '\n\tC-Axis 10.0 steps per mm'
        ),
        Explanation(  # Test 24
            code='M92',
            command_name='STEPS_PER_MM',
            provided_args={
                'X': 100.0
            },
            command_explanation='STEPS PER MM:\n\tSetting the following axes steps per'
                                ' mm:'
                                '\n\tX-Axis 100.0 steps per mm'
        ),
        Explanation(  # Test 25
            code='M92',
            command_name='STEPS_PER_MM',
            provided_args={
                'A': 400.0
            },
            command_explanation='STEPS PER MM:\n\tSetting the following axes steps per'
                                ' mm:'
                                '\n\tA-Axis 400.0 steps per mm'
        ),

    ]


@pytest.mark.parametrize(
    'parsed_value,expected_value',
    list(zip(gcodes(), expected_function_name_values()))
)
def test_smoothie_g_code_function_lookup(
    parsed_value: GCode,
    expected_value: str
) -> None:
    assert parsed_value.get_gcode_function() == expected_value


@pytest.mark.parametrize(
    'parsed_value,expected_value',
    list(zip(gcodes(), expected_arg_values()))
)
def test_g_code_args(
    parsed_value: GCode,
    expected_value: dict
) -> None:
    assert parsed_value.g_code_args == expected_value


@pytest.mark.parametrize(
    'parsed_value,expected_value',
    list(zip(gcodes(), explanations()))
)
def test_explanation(
    parsed_value: GCode,
    expected_value: dict
) -> None:
    assert parsed_value.get_explanation() == expected_value
