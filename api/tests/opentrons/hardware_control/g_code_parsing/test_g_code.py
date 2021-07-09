import pytest
from opentrons.hardware_control.g_code_parsing.g_code_functionality_defs.\
    g_code_functionality_def_base import Explanation
from opentrons.hardware_control.g_code_parsing.g_code import GCode
from typing import List, Dict


def gcodes() -> List[GCode]:

    raw_codes = [
        # FORMAT
        # [GCODE, RESPONSE]


        # Home
        ['G28.2 ABCXYZ', 'ok\r\nok\r\n'],  # Test 0
        ['G28.2 X', 'ok\r\nok\r\n'],  # Test 1
        ['G28.2 Y', 'ok\r\nok\r\n'],  # Test 2
        ['G28.2 Z', 'ok\r\nok\r\n'],  # Test 3
        ['G28.2 A', 'ok\r\nok\r\n'],  # Test 4
        ['G28.2 B', 'ok\r\nok\r\n'],  # Test 5
        ['G28.2 C', 'ok\r\nok\r\n'],  # Test 6

        # Move
        ['G0 X113.38 Y11.24', 'ok\r\nok\r\n'],  # Test 7
        ['G0 A132.6', 'ok\r\nok\r\n'],  # Test 8
        ['G0 C-8.5', 'ok\r\nok\r\n'],  # Test 9

        # Set Speed
        ['G0 F5.0004', 'ok\r\nok\r\n'],  # Test 10

        # Wait
        ['M400', 'ok\r\nok\r\n'],  # Test 11

        # Set Current
        ['M907 A0.1 B0.3 C0.05 X0.3 Y0.3 Z0.1', ''],  # Test 12

        # Dwell
        ['G4 P555', 'ok\r\nok\r\n'],  # Test 13

        # Get Current Position
        [  # Test 14
            'M114.2',
            'M114.2\r\n\r\nok MCS: A:218.0 B:0.0 C:0.0 X:418.0 Y:-3.0 Z:218.0'
        ],

        # Get Limit Switch Status
        ['M119', 'Lid:closed'],  # Test 15

        # Probe
        [  # Test 16
            'G38.2 F420Y-40.0',
            'G38.2 F420Y-40.0\r\n\r\n[PRB:296.825,292.663,218.000:1]\nok\r\nok\r\n'
        ],

        # Absolute Mode
        ['G90', ''],  # Test 17

        # Relative Mode
        ['G91', ''],  # Test 18

        # Reset from Error
        ['M999', 'ok\r\nok\r\n'],  # Test 19

        # Push Speed
        # TODO: Get Example
        ['M120', ''],  # Test 20

        # Pop Speed
        # TODO: Get Example
        ['M121', ''],  # Test 21

        # Steps per mm
        [  # Test 22
            'M92 X80.0 Y80.0 Z400 A400',
            'X:80.000000 Y:80.000000 Z:400.000000 A:400.000000 B:768.000000 '
            'C:768.000000 \r\nok\r\nok\r\n'
        ],
        [  # Test 23
            'M92 B768',
            'X:80.000000 Y:80.000000 Z:400.000000 A:400.000000 B:768.000000 '
            'C:768.000000'
        ],
    ]
    g_code_list = [
        GCode.from_raw_code(code, 'smoothie', response)
        for code, response in raw_codes
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
        'ABSOLUTE_COORDS',  # Test 17
        'RELATIVE_COORDS',  # Test 18
        'RESET_FROM_ERROR',  # Test 19
        'PUSH_SPEED',  # Test 20
        'POP_SPEED',  # Test 21
        'STEPS_PER_MM',  # Test 22
        'STEPS_PER_MM',  # Test 23
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
        {'F': 420, 'Y': -40.0},

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
        {'X': 80.0, 'Y': 80.0, 'Z': 400, 'A': 400},

        # Test 23
        {'B': 768.0},
    ]


def explanations() -> List[Explanation]:
    return [
        Explanation(  # Test 0
            code='G28.2',
            command_name='HOME',
            provided_args={'A': None, 'B': None, 'C': None, 'X': None, 'Y': None,
                           'Z': None},
            command_explanation='HOME:\n\tHoming the following axes: X, Y, Z, A, B, C'
        ),
        Explanation(  # Test 1
            code='G28.2',
            command_name='HOME',
            provided_args={'X': None},
            command_explanation='HOME:\n\tHoming the following axes: X'
        ),
        Explanation(  # Test 2
            code='G28.2',
            command_name='HOME',
            provided_args={'Y': None},
            command_explanation='HOME:\n\tHoming the following axes: Y'
        ),
        Explanation(  # Test 3
            code='G28.2',
            command_name='HOME',
            provided_args={'Z': None},
            command_explanation='HOME:\n\tHoming the following axes: Z'
        ),
        Explanation(  # Test 4
            code='G28.2',
            command_name='HOME',
            provided_args={'A': None},
            command_explanation='HOME:\n\tHoming the following axes: A'
        ),
        Explanation(  # Test 5
            code='G28.2',
            command_name='HOME',
            provided_args={'B': None},
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
            provided_args={'X': 113.38, 'Y': 11.24},
            command_explanation='MOVE:\n\t'
                                'The gantry to 113.38 on the X-Axis\n\t'
                                'The gantry to 11.24 on the Y-Axis'
        ),
        Explanation(  # Test 8
            code='G0',
            command_name='MOVE',
            provided_args={'A': 132.6},
            command_explanation='MOVE:\n\t'
                                'The right pipette arm height to 132.6'
        ),
        Explanation(  # Test 9
            code='G0',
            command_name='MOVE',
            provided_args={'C': -8.5},
            command_explanation='MOVE:\n\t'
                                'The right pipette suction to -8.5'
        ),
        Explanation(  # Test 10
            code='G0',
            command_name='SET_SPEED',
            provided_args={'F': 5.0004},
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
            provided_args={'X': 0.3, 'Y': 0.3, 'Z': 0.1, 'A': 0.1, 'B': 0.3, 'C': 0.05},
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
            provided_args={'P': 555.0},
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
            provided_args={'F': 420, 'Y': -40.0},
            command_explanation='PROBE:\n\tProbing the following axes: Y; '
                                'at a speed of 420.0'
        ),
        Explanation(  # Test 17
            code='G90',
            command_name='ABSOLUTE_COORDS',
            provided_args={},
            command_explanation='ABSOLUTE COORDINATE MODE: \n\t'
                                'Switching to Absolute Coordinate Mode'
        ),
        Explanation(  # Test 18
            code='G91',
            command_name='RELATIVE_COORDS',
            provided_args={},
            command_explanation='RELATIVE COORDINATE MODE: \n\t'
                                'Switching to Relative Coordinate Mode'
        ),
        Explanation(  # Test 19
            code='M999',
            command_name='RESET_FROM_ERROR',
            provided_args={},
            command_explanation='RESET FROM ERROR: \n\tResetting OT-2 from error state'
        ),
        Explanation(  # Test 20
            code='M120',
            command_name='PUSH_SPEED',
            provided_args={},
            command_explanation='PUSH SPEED: \n\tSaving current speed so temporary'
                                ' speed can be set'
        ),
        Explanation(  # Test 21
            code='M121',
            command_name='POP_SPEED',
            provided_args={},
            command_explanation='POP SPEED: \n\tLoading previously saved speed'
        ),
        Explanation(  # Test 22
            code='M92',
            command_name='STEPS_PER_MM',
            provided_args={'X': 80.0, 'Y': 80.0, 'Z': 400.0, 'A': 400.0},
            command_explanation='STEPS PER MM:\n\tSetting the following axes steps per'
                                ' mm:'
                                '\n\tX-Axis 80.0 steps per mm'
                                '\n\tY-Axis 80.0 steps per mm'
                                '\n\tZ-Axis 400.0 steps per mm'
                                '\n\tA-Axis 400.0 steps per mm'
        ),
        Explanation(  # Test 23
            code='M92',
            command_name='STEPS_PER_MM',
            provided_args={'B': 768.0},
            command_explanation='STEPS PER MM:\n\tSetting the following axes steps per'
                                ' mm:'
                                '\n\tB-Axis 768.0 steps per mm'
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
