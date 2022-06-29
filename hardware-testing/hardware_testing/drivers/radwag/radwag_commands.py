from dataclasses import dataclass
from enum import Enum
from typing import Optional

RADWAG_COMMAND_TERMINATOR = '\r\n'


class RadwagCommand(str, Enum):
    # info
    GET_SERIAL_NUMBER = 'NB'  # Give balance serial number
    GET_BALANCE_TYPE = 'BN'  # Give balance type
    GET_MAX_CAPACITY = 'FS'  # Give Max capacity
    GET_PROGRAM_VERSION = 'RV'  # Give program version

    # zero & tare
    ZERO = 'Z'  # Zero balance
    TARE = 'T'  # Tare balance
    GET_TARE = 'OT'  # Give tare value
    SET_TARE = 'UT'  # Set tare
    SET_AUTOZERO_FUNCTION = 'A'  # Set autozero function

    # reading a measurement
    GET_MEASUREMENT_BASIC_UNIT_STABLE = 'S'  # Send stable measurement result in basic measuring unit
    GET_MEASUREMENT_BASIC_UNIT = 'SI'  # Immediately send measurement result in basic measuring unit
    GET_MEASUREMENT_CURRENT_UNIT_STABLE = 'SU'  # Send stable measurement result in current measuring unit
    GET_MEASUREMENT_CURRENT_UNIT = 'SUI'  # Immediately send measurement result in current measuring unit
    ENABLE_CONTINUOUS_TRANS_BASIC_UNIT = 'C1'  # Switch on continuous transmission in basic measuring unit
    DISABLE_CONTINUOUS_TRANS_BASIC_UNIT = 'C0'  # Switch off continuous transmission in basic measuring unit
    ENABLE_CONTINUOUS_TRANS_CURRENT_UNIT = 'CU1'  # Switch on continuous transmission in current measuring unit
    DISABLE_CONTINUOUS_TRANS_CURRENT_UNIT = 'CU0'  # Switch off continuous transmission in current measuring unit

    # checkweighing?
    SET_MIN_CHECKWEIGHING_THRESHOLD = 'DH'  # Set min checkweighing threshold
    SET_MAX_CHECKWEIGHING_THRESHOLD = 'UH'  # Set max checkweighing threshold
    GET_MIN_CHECKWEIGHING_THRESHOLD = 'ODH'  # Give value of min checkweighing threshold
    GET_MAX_CHECKWEIGHING_THRESHOLD = 'OUH'  # Give value of max checkweighing threshold

    # item counting
    SET_MASS_VALUE_OF_SINGLE_ITEM = 'SM'  # Set mass value of a single item
    SET_TARGET_MASS_VALUE = 'TV'  # Set target mass value
    SET_REFERENCE_MASS_VALUE = 'RM'  # Set reference mass value

    # internal adjustment
    INTERNAL_ADJUST_PERFORMANCE = 'IC'  # Internal adjustment performance
    DISABLE_AUTO_INTERNAL_ADJUST = 'IC1'  # Disable automatic internal adjustment of the balance
    ENABLE_AUTO_INTERNAL_ADJUST = 'IC0'  # Enable automatic internal adjustment of the balance

    # working modes
    GET_AVAILABLE_WORKING_MODES = 'OMI'  # Give available working modes
    SET_WORKING_MODE = 'OMS'  # Set working mode
    GET_CURRENT_WORKING_MODE = 'OMG'  # Give current working mode

    # units
    GET_ACCESSIBLE_UNITS = 'UI'  # Give accessible units
    SET_UNIT = 'US'  # Set unit
    GET_CURRENT_UNIT = 'UG'  # Give current unit

    # ambient conditions
    SET_AMBIENT_CONDITIONS_STATE = 'EV'  # Set ambient conditions state
    GET_CURRENT_AMBIENT_CONDITIONS = 'EVG'  # Give currently set ambient conditions

    # filter
    SET_FILTER = 'FIS'  # Set filter
    GET_FILTER = 'FIG'  # Give current filter

    # value release ???
    VALUE_RELEASE = 'SS'  # Value release
    SET_VALUE_RELEASE = 'ARS'  # Set value release
    GET_CURRENT_VALUE_RELEASE = 'ARG'  # Give current value release

    # other
    ACTIVATE_SOUND_SIGNAL = 'BP'  # Activate sound signal
    LOCK_KEYPAD = 'K1'  # Lock balance keypad
    UNLOCK_KEYPAD = 'K0'  # Unlock balance keypad
    SEND_ALL_IMPLEMENTED_COMMANDS = 'PC'  # Send all implemented commands
    SET_LAST_DIGIT = 'LDS'  # Set last digit
    COOPERATION_WITH_PUE_7_1_PUE_10_TERMINAL = 'NT'  # Cooperation with PUE 7.1 PUE 10 terminal


class RadwagResponseCodes(str, Enum):
    NONE = ''
    IN_PROGRESS = 'A'
    CARRIED_OUT_AFTER_IN_PROGRESS = 'D'
    CARRIED_OUT = 'OK'
    UNABLE_TO_EXECUTE = 'I'
    MAX_THRESHOLD_EXCEEDED = '^'
    MIN_THRESHOLD_EXCEEDED = 'v'
    COMMAND_NOT_RECOGNIZED = 'ES'
    STABLE_TIME_LIMIT_EXCEEDED = 'E'

    @classmethod
    def parse(cls, response: str) -> "RadwagResponseCodes":
        if response == cls.IN_PROGRESS:
            return cls.IN_PROGRESS
        elif response == cls.CARRIED_OUT_AFTER_IN_PROGRESS:
            return cls.CARRIED_OUT_AFTER_IN_PROGRESS
        elif response == cls.CARRIED_OUT:
            return cls.CARRIED_OUT
        elif response == cls.UNABLE_TO_EXECUTE:
            return cls.UNABLE_TO_EXECUTE
        elif response == cls.MAX_THRESHOLD_EXCEEDED:
            return cls.MAX_THRESHOLD_EXCEEDED
        elif response == cls.MIN_THRESHOLD_EXCEEDED:
            return cls.MIN_THRESHOLD_EXCEEDED
        elif response == cls.COMMAND_NOT_RECOGNIZED:
            return cls.COMMAND_NOT_RECOGNIZED
        elif response == cls.STABLE_TIME_LIMIT_EXCEEDED:
            return cls.STABLE_TIME_LIMIT_EXCEEDED
        else:
            return cls.NONE


@dataclass
class RadwagDataPacket:
    code: RadwagResponseCodes
    command: RadwagCommand
    stable: bool
    measurement: Optional[float] = None
    message: Optional[str] = None

    @classmethod
    def build(cls, command: RadwagCommand):
        return RadwagDataPacket(code=RadwagResponseCodes.NONE,
                                command=command,
                                stable=False,
                                measurement=None,
                                message=None)


def radwag_command_format(command: str) -> str:
    return f'{command}{RADWAG_COMMAND_TERMINATOR}'


def radwag_response_parse(response: str, command: RadwagCommand) -> RadwagDataPacket:
    assert RADWAG_COMMAND_TERMINATOR in response, f'CR LF not found ' \
                                                  f'in response: {response}'
    assert ' ' in response, f'No space (\" \") found in response: {response}'
    cmd_not_rec = RadwagResponseCodes.COMMAND_NOT_RECOGNIZED
    if cmd_not_rec in response and response.index(cmd_not_rec) == 0:
        raise RuntimeError(
            'Command not recognized: {command} (response={response})')
    res_list = [d for d in response.strip().split(' ') if d]
    assert res_list[0] == command, f'Unexpected response from scale: {response}'
    data = RadwagDataPacket.build(command)
    if len(res_list) == 2:
        data.code = RadwagResponseCodes.parse(res_list[1])
    # TODO: (andy s) create custom handler for each command type
    elif (command == RadwagCommand.GET_MEASUREMENT_BASIC_UNIT) or \
            (command == RadwagCommand.GET_MEASUREMENT_BASIC_UNIT_STABLE) or \
            (command == RadwagCommand.GET_MEASUREMENT_CURRENT_UNIT) or \
            (command == RadwagCommand.GET_MEASUREMENT_CURRENT_UNIT_STABLE):
        # SI ? -  0.00020 g
        # TODO: we could accept more unit types if we wanted...
        assert res_list[-1] == 'g', \
            f'Expected units to be grams (\"g\"), ' \
            f'instead got \"{res_list[-1]}\"'
        data.stable = ('?' not in res_list)
        data.measurement = float(res_list[-2])
        if '-' in res_list:
            data.measurement *= -1
    elif command == RadwagCommand.GET_SERIAL_NUMBER:
        data.code = RadwagResponseCodes.parse(res_list[1])
        assert len(res_list) == 3
        data.message = res_list[-1].replace('\"', '')
    return data
