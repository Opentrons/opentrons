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

        # Read Instrument ID
        [  # Test 24
            'M369 L',
            'M369 L\r\n\r\nL: 5032305356323032303230303730313031'
            '000000000000000000000000000000 \r\nok\r\nok\r\n'
        ],

        # Write Instrument ID
        [  # Test 25
            'M370 L5032305356323032303230303730313031000000000000000000000000000000',
            ''
        ],
        # Read Instrument Model
        [  # Test 26
            'M371 L',
            'M371 L\r\n\r\nL: 7032305f6d756c74695f76322e3'
            '0000000000000000000000000000000000000 \r\nok\r\nok\r\n'
        ],

        # Write Instrument Model
        [  # Test 27
            'M372 L7032305f6d756c74695f76322e30000000000000000000000000000000000000',
            ''
        ],

        # Set Max Speed
        [  # Test 28
            'M203.1 A125 B40 C40 X600 Y400 Z125\r\n\r\n',
            ''
        ],

        # Disengage Motor
        [  # Test 29
            'M18 ZBCA',
            ''
        ],

        # Homing Status
        [  # Test 30
            'G28.6',
            'G28.6 X:0 Y:0 Z:0 A:0 B:0 C:0'
        ],

        # Acceleration
        [  # Test 31
            'M204 S10000 A1500 B200 C200 X3000 Y2000 Z1500 \r\n\r\n',
            ''
        ],

        # Pipette Home
        [  # Test 32
            'M365.0 A172.15',
            ''
        ],

        # Pipette Max Travel
        [  # Test 33
            'M365.1 A60',
            ''
        ],

        # Pipette Debounce
        [  # Test 34
            'M365.2 B60',
            ''
        ],

        # Pipette Retract
        [  # Test 35
            'M365.3 A20',
            ''
        ],

        # Microstepping B Enable
        [  # Test 36
            'M52',
            ''
        ],

        # Microstepping B Disable
        [  # Test 37
            'M53',
            ''
        ],

        # Microstepping C Enable
        [  # Test 38
            'M54',
            ''
        ],

        # Microstepping C Disable
        [  # Test 39
            'M55',
            ''
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
        # 'READ_INSTRUMENT_ID',  # Test 24
        # 'WRITE_INSTRUMENT_ID',  # Test 25
        # 'READ_INSTRUMENT_MODEL',  # Test 26
        # 'WRITE_INSTRUMENT_MODEL',  # Test 27
        'SET_MAX_SPEED',  # Test 28
        'DISENGAGE_MOTOR',  # Test 29
        'HOMING_STATUS',  # Test 30
        'ACCELERATION',  # Test 31
        'PIPETTE_HOME',  # Test 32
        'PIPETTE_MAX_TRAVEL',  # Test 33
        'PIPETTE_DEBOUNCE',  # Test 34
        'PIPETTE_RETRACT',  # Test 35
        'MICROSTEPPING_B_ENABLE',  # Test 36
        'MICROSTEPPING_B_DISABLE',  # Test 37
        'MICROSTEPPING_C_ENABLE',  # Test 38
        'MICROSTEPPING_C_DISABLE',  # Test 39

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

        # # TODO: Need to figure out to do with 24, 25, 26, and 27
        # # Test 24
        # {'L': 'FAIL'},
        #
        # # Test 25
        # {'L': 'FAIL'},
        #
        # # Test 26
        # {'L': 'FAIL'},
        #
        # # Test 27
        # {'L': 'FAIL'},

        # Test 28
        {'A': 125.0, 'B': 40.0, 'C': 40.0, 'X': 600.0, 'Y': 400.0, 'Z': 125.0},

        # Test 29
        {'Z': None, 'B': None, 'C': None, 'A': None},

        # Test 30
        {},

        # Test 31
        {
            'S': 10000.0,
            'A': 1500.0,
            'B': 200.0,
            'C': 200.0,
            'X': 3000.0,
            'Y': 2000.0,
            'Z': 1500.0
        },

        # Test 32
        {
            'A': 172.15
        },

        # Test 33
        {
            'A': 60.0
        },

        # Test 34
        {
            'B': 60.0,
        },

        # Test 35
        {
            'A': 20.0
        },

        # Test 36
        {},

        # Test 37
        {},

        # Test 38
        {},

        # Test 39
        {},
    ]


def explanations() -> List[Explanation]:
    return [
        Explanation(  # Test 0
            code='G28.2',
            command_name='HOME',
            provided_args={'A': None, 'B': None, 'C': None, 'X': None, 'Y': None,
                           'Z': None},
            command_explanation='Homing the following axes: X, Y, Z, A, B, C'
        ),
        Explanation(  # Test 1
            code='G28.2',
            command_name='HOME',
            provided_args={'X': None},
            command_explanation='Homing the following axes: X'
        ),
        Explanation(  # Test 2
            code='G28.2',
            command_name='HOME',
            provided_args={'Y': None},
            command_explanation='Homing the following axes: Y'
        ),
        Explanation(  # Test 3
            code='G28.2',
            command_name='HOME',
            provided_args={'Z': None},
            command_explanation='Homing the following axes: Z'
        ),
        Explanation(  # Test 4
            code='G28.2',
            command_name='HOME',
            provided_args={'A': None},
            command_explanation='Homing the following axes: A'
        ),
        Explanation(  # Test 5
            code='G28.2',
            command_name='HOME',
            provided_args={'B': None},
            command_explanation='Homing the following axes: B'
        ),
        Explanation(  # Test 6
            code='G28.2',
            command_name='HOME',
            provided_args={
                'C': None,
            },
            command_explanation='Homing the following axes: C'
        ),
        Explanation(  # Test 7
            code='G0',
            command_name='MOVE',
            provided_args={'X': 113.38, 'Y': 11.24},
            command_explanation='Moving the robot as follows:\n\t'
                                'The gantry to 113.38 on the X-Axis\n\t'
                                'The gantry to 11.24 on the Y-Axis'
        ),
        Explanation(  # Test 8
            code='G0',
            command_name='MOVE',
            provided_args={'A': 132.6},
            command_explanation='Moving the robot as follows:\n\t'
                                'The right pipette arm height to 132.6'
        ),
        Explanation(  # Test 9
            code='G0',
            command_name='MOVE',
            provided_args={'C': -8.5},
            command_explanation='Moving the robot as follows:\n\t'
                                'The right pipette suction to -8.5'
        ),
        Explanation(  # Test 10
            code='G0',
            command_name='SET_SPEED',
            provided_args={'F': 5.0004},
            command_explanation='Setting speed to 5.0004'
        ),
        Explanation(  # Test 11
            code='M400',
            command_name='WAIT',
            provided_args={},
            command_explanation='Waiting for motors to stop moving'
        ),
        Explanation(  # Test 12
            code='M907',
            command_name='SET_CURRENT',
            provided_args={'X': 0.3, 'Y': 0.3, 'Z': 0.1, 'A': 0.1, 'B': 0.3, 'C': 0.05},
            command_explanation='Setting the current (in amps) to:\n\t'
                                'X-Axis Motor: 0.3\n\t'
                                'Y-Axis Motor: 0.3\n\t'
                                'Z-Axis Motor: 0.1\n\t'
                                'A-Axis Motor: 0.1\n\t'
                                'B-Axis Motor: 0.3\n\t'
                                'C-Axis Motor: 0.05'
        ),
        Explanation(  # Test 13
            code='G4',
            command_name='DWELL',
            provided_args={'P': 555.0},
            command_explanation='Pausing movement for 555.0ms'
        ),
        Explanation(  # Test 14
            code='M114.2',
            command_name='CURRENT_POSITION',
            provided_args={},
            command_explanation='Getting current position for all axes'
        ),
        Explanation(  # Test 15
            code='M119',
            command_name='LIMIT_SWITCH_STATUS',
            provided_args={},
            command_explanation='Getting the limit switch status'
        ),
        Explanation(  # Test 16
            code='G38.2',
            command_name='PROBE',
            provided_args={'F': 420, 'Y': -40.0},
            command_explanation='Probing -40.0 on the Y axis, at a speed of 420.0'
        ),
        Explanation(  # Test 17
            code='G90',
            command_name='ABSOLUTE_COORDS',
            provided_args={},
            command_explanation='Switching to Absolute Coordinate Mode'
        ),
        Explanation(  # Test 18
            code='G91',
            command_name='RELATIVE_COORDS',
            provided_args={},
            command_explanation='Switching to Relative Coordinate Mode'
        ),
        Explanation(  # Test 19
            code='M999',
            command_name='RESET_FROM_ERROR',
            provided_args={},
            command_explanation='Resetting OT-2 from error state'
        ),
        Explanation(  # Test 20
            code='M120',
            command_name='PUSH_SPEED',
            provided_args={},
            command_explanation='Saving current speed so temporary'
                                ' speed can be set'
        ),
        Explanation(  # Test 21
            code='M121',
            command_name='POP_SPEED',
            provided_args={},
            command_explanation='Loading previously saved speed'
        ),
        Explanation(  # Test 22
            code='M92',
            command_name='STEPS_PER_MM',
            provided_args={'X': 80.0, 'Y': 80.0, 'Z': 400.0, 'A': 400.0},
            command_explanation='Setting the following axes steps per'
                                ' mm:'
                                '\n\tX-Axis: 80.0 steps per mm'
                                '\n\tY-Axis: 80.0 steps per mm'
                                '\n\tZ-Axis: 400.0 steps per mm'
                                '\n\tA-Axis: 400.0 steps per mm'
        ),
        Explanation(  # Test 23
            code='M92',
            command_name='STEPS_PER_MM',
            provided_args={'B': 768.0},
            command_explanation='Setting the following axes steps per'
                                ' mm:'
                                '\n\tB-Axis: 768.0 steps per mm'
        ),
        # Test 24
        Explanation(
            code='M369',
            command_name='READ_INSTRUMENT_ID',
            provided_args={'L': None},
            command_explanation='Reading instrument ID for Left pipette'
        ),
        # Test 25
        Explanation(
            code='M370',
            command_name='WRITE_INSTRUMENT_ID',
            provided_args={'L': '5032305356323032303230303730313031'
                                '000000000000000000000000000000'},
            command_explanation='Writing instrument ID 50323053563230323032303037303130'
                                '31000000000000000000000000000000 for Left pipette'
        ),
        # Test 26
        Explanation(
            code='M371',
            command_name='READ_INSTRUMENT_MODEL',
            provided_args={'L': None},
            command_explanation='Reading instrument model for Left pipette'
        ),
        # Test 27
        Explanation(
            code='M372',
            command_name='WRITE_INSTRUMENT_MODEL',
            provided_args={'L': '7032305f6d756c74695f76322e'
                                '30000000000000000000000000000000000000'},
            command_explanation='Writing instrument model 7032305f6d756c74695f76322e3'
                                '0000000000000000000000000000000000000 for Left pipette'
        ),
        Explanation(  # Test 28
            code='M203.1',
            command_name='SET_MAX_SPEED',
            provided_args={
                'A': 125.0,
                'B': 40.0,
                'C': 40.0,
                'X': 600.0,
                'Y': 400.0,
                'Z': 125.0
            },
            command_explanation='Setting the max speed for the following axes:'\
                                '\n\tX-Axis: 600.0'
                                '\n\tY-Axis: 400.0'
                                '\n\tZ-Axis: 125.0'
                                '\n\tA-Axis: 125.0'
                                '\n\tB-Axis: 40.0'
                                '\n\tC-Axis: 40.0'
        ),
        Explanation(  # Test 29
            code='M18',
            command_name='DISENGAGE_MOTOR',
            provided_args={'Z': None, 'B': None, 'C': None, 'A': None},
            command_explanation='Disengaging motor for the following axes: Z, A, B, C'
        ),
        Explanation(  # Test 30
            code='G28.6',
            command_name='HOMING_STATUS',
            provided_args={},
            command_explanation='Getting homing status for all axes'

        ),
        Explanation(  # Test 31
            code='M204',
            command_name='ACCELERATION',
            provided_args={
                'S': 10000.0,
                'A': 1500.0,
                'B': 200.0,
                'C': 200.0,
                'X': 3000.0,
                'Y': 2000.0,
                'Z': 1500.0
            },
            command_explanation='Setting acceleration for the following axes:' \
                                '\n\tDefault: 10000.0'
                                '\n\tX-Axis: 3000.0'
                                '\n\tY-Axis: 2000.0'
                                '\n\tLeft Pipette Arm: 1500.0'
                                '\n\tRight Pipette Arm: 1500.0'
                                '\n\tLeft Pipette Suction: 200.0'
                                '\n\tRight Pipette Suction: 200.0'
        ),
        Explanation(  # Test 32
            code='M365.0',
            command_name='PIPETTE_HOME',
            provided_args={
                'A': 172.15
            },
            command_explanation='Setting the pipette home height for the following '
                                'axes:'
                                '\n\tA-Axis: 172.15'
        ),
        Explanation(  # Test 33
            code='M365.1',
            command_name='PIPETTE_MAX_TRAVEL',
            provided_args={
                'A': 60.0
            },
            command_explanation='Setting the pipette max travel height for the '
                                'following axes:'
                                '\n\tA-Axis: 60.0'
        ),
        Explanation(  # Test 34
            code='M365.2',
            command_name='PIPETTE_DEBOUNCE',
            provided_args={
                'B': 60.0
            },
            command_explanation='Setting the pipette endstop debounce time for the '
                                'following axes:'
                                '\n\tB-Axis: 60.0'
        ),
        Explanation(  # Test 35
            code='M365.3',
            command_name='PIPETTE_RETRACT',
            provided_args={
                'A': 20.0
            },
            command_explanation='Setting the pipette endstop retract distance for the '
                                'following axes:'
                                '\n\tA-Axis: 20.0'
        ),
        Explanation(  # Test 36
            code='M52',
            command_name='MICROSTEPPING_B_ENABLE',
            provided_args={},
            command_explanation='Enabling microstepping on B-Axis'
        ),
        Explanation(  # Test 37
            code='M53',
            command_name='MICROSTEPPING_B_DISABLE',
            provided_args={},
            command_explanation='Disabling microstepping on B-Axis'
        ),
        Explanation(  # Test 38
            code='M54',
            command_name='MICROSTEPPING_C_ENABLE',
            provided_args={},
            command_explanation='Enabling microstepping on C-Axis'
        ),
        Explanation(  # Test 39
            code='M55',
            command_name='MICROSTEPPING_C_DISABLE',
            provided_args={},
            command_explanation='Disabling microstepping on C-Axis'
        )
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


@pytest.mark.parametrize(
    'bad_raw_code',
    [
        'M370 T5032305356323032303230303730313031000000000000000000000000000000',
        'M372 Q7032305f6d756c74695f76322e30000000000000000000000000000000000000',
    ]
)
def test_bad_read_write_g_codes(bad_raw_code):
    with pytest.raises(UnparsableGCodeError):
        GCode.from_raw_code(bad_raw_code, 'smoothie', '')