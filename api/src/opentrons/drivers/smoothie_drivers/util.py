import logging
from typing import Dict, List, Tuple

from .constants import (AXES, DISABLE_AXES, HOME_SEQUENCE,
                        GCODE_ROUNDING_PRECISION)


log = logging.getLogger(__name__)


class SmoothieError(Exception):
    def __init__(self, ret_code: str = None, command: str = None) -> None:
        self.ret_code = ret_code
        self.command = command
        super().__init__()

    def __repr__(self):
        return f'<SmoothieError: {self.ret_code} from {self.command}>'

    def __str__(self):
        return f'SmoothieError: {self.command} returned {self.ret_code}'


class SmoothieAlarm(Exception):
    def __init__(self, ret_code: str = None, command: str = None) -> None:
        self.ret_code = ret_code
        self.command = command
        super().__init__()

    def __repr__(self):
        return f'<SmoothieAlarm: {self.ret_code} from {self.command}>'

    def __str__(self):
        return f'SmoothieAlarm: {self.command} returned {self.ret_code}'


class ParseError(Exception):
    pass


def _parse_number_from_substring(smoothie_substring: str) -> float:
    '''
    Returns the number in the expected string "N:12.3", where "N" is the
    axis, and "12.3" is a floating point value for the axis' position
    '''
    try:
        return round(
            float(smoothie_substring.split(':')[1]),
            GCODE_ROUNDING_PRECISION
        )
    except (ValueError, IndexError, TypeError, AttributeError):
        log.exception('Unexpected argument to _parse_number_from_substring:')
        raise ParseError(
            'Unexpected argument to _parse_number_from_substring: {}'.format(
                smoothie_substring))


def _parse_axis_from_substring(smoothie_substring: str) -> str:
    '''
    Returns the axis in the expected string "N:12.3", where "N" is the
    axis, and "12.3" is a floating point value for the axis' position
    '''
    try:
        return smoothie_substring.split(':')[0].title()  # upper 1st letter
    except (ValueError, IndexError, TypeError, AttributeError):
        log.exception('Unexpected argument to _parse_axis_from_substring:')
        raise ParseError(
            'Unexpected argument to _parse_axis_from_substring: {}'.format(
                smoothie_substring))


def parse_position_response(raw_axis_values: str) -> Dict[str, float]:
    parsed_values = raw_axis_values.strip().split(' ')
    if len(parsed_values) < 8:
        msg = 'Unexpected response in _parse_position_response: {}'.format(
            raw_axis_values)
        log.error(msg)
        raise ParseError(msg)

    data = {
        _parse_axis_from_substring(s): _parse_number_from_substring(s)
        for s in parsed_values[2:]  # remove first two items ('ok', 'MCS:')
    }
    return data


def parse_instrument_data(smoothie_response: str) -> Dict[str, bytearray]:
    try:
        items = smoothie_response.split('\n')[0].strip().split(':')
        mount = items[0]
        # data received from Smoothieware is stringified HEX values
        # because of how Smoothieware handles GCODE messages
        data = bytearray.fromhex(items[1])
    except (ValueError, IndexError, TypeError, AttributeError):
        raise ParseError(
            'Unexpected argument to _parse_instrument_data: {}'.format(
                smoothie_response))
    return {mount: data}


def byte_array_to_ascii_string(byte_array: bytes) -> str:
    # remove trailing null characters
    try:
        for c in [b'\x00', b'\xFF']:
            if c in byte_array:
                byte_array = byte_array[:byte_array.index(c)]
        res = byte_array.decode()
    except (ValueError, TypeError, AttributeError):
        log.exception('Unexpected argument to _byte_array_to_ascii_string:')
        raise ParseError(
            'Unexpected argument to _byte_array_to_ascii_string: {}'.format(
                byte_array))
    return res


def byte_array_to_hex_string(byte_array: bytes) -> str:
    # data must be sent as stringified HEX values
    # because of how Smoothieware parses GCODE messages
    try:
        res = ''.join('%02x' % b for b in byte_array)
    except TypeError:
        log.exception('Unexpected argument to _byte_array_to_hex_string:')
        raise ParseError(
            'Unexpected argument to _byte_array_to_hex_string: {}'.format(
                byte_array))
    return res


def parse_switch_values(raw_switch_values: str) -> Dict[str, bool]:
    if not raw_switch_values or not isinstance(raw_switch_values, str):
        raise ParseError(
            'Unexpected argument to _parse_switch_values: {}'.format(
                raw_switch_values))

    # probe has a space after it's ":" for some reason
    if 'Probe: ' in raw_switch_values:
        raw_switch_values = raw_switch_values.replace('Probe: ', 'Probe:')

    parsed_values = raw_switch_values.strip().split(' ')
    res = {
        _parse_axis_from_substring(s): bool(_parse_number_from_substring(s))
        for s in parsed_values
        if any([n in s for n in ['max', 'Probe']])
    }
    # remove the extra "_max" character from each axis key in the dict
    res = {
        key.split('_')[0]: val
        for key, val in res.items()
    }
    if len(set(list(AXES) + ['Probe']) & set(res.keys())) != 7:
        raise ParseError(
            'Unexpected argument to _parse_switch_values: {}'.format(
                raw_switch_values))
    return res


def parse_homing_status_values(
        raw_homing_status_values: str) -> Dict[str, bool]:
    '''
        Parse the Smoothieware response to a G28.6 command (homing-status)
        A "1" means it has been homed, and "0" means it has not been homed

        Example response after homing just X axis:
        "X:1 Y:0 Z:0 A:0 B:0 C:0"

        returns: dict
            Key is axis, value is True if the axis needs to be homed
    '''
    if not raw_homing_status_values or \
            not isinstance(raw_homing_status_values, str):
        raise ParseError(
            'Unexpected argument to _parse_homing_status_values: {}'.format(
                raw_homing_status_values))
    parsed_values = raw_homing_status_values.strip().split(' ')
    res = {
        _parse_axis_from_substring(s): bool(_parse_number_from_substring(s))
        for s in parsed_values
    }
    if len(set(list(AXES)) & set(res.keys())) != 6:
        raise ParseError(
            'Unexpected argument to _parse_homing_status_values: {}'.format(
                raw_homing_status_values))
    return res


def remove_unwanted_characters(command: str, response: str) -> str:
    """ Massage smoothie responses to remove

    - Terminal echo
    - \r and \n interspersed in terminal echo from double \r\n send
    """
    remove_from_response = [
        c.strip() for c in command.strip().split(' ') if c.strip()]

    remove_from_response += ['\r', '\n']
    modified_response = str(response)

    for cmd in remove_from_response:
        modified_response = modified_response.replace(cmd, '')

    if modified_response != response:
        log.debug('Removed characters from response: {}'.format(
            response))
        log.debug('Newly formatted response: {}'.format(modified_response))

    return modified_response


def build_home_behaviors(
        axis: str = AXES,
        disabled: str = DISABLE_AXES) -> Tuple[List[str], str]:
    """ Build an ordered list of axes to home.

    This defines the requirements around home sequences - for instance,
    homing y requires homing x so the switches will hit - and returns
    two sequences, one of axes to home and one of axes to dwell.

    :param axis: A string of axis names to home
    :param axis: A string of axis names to explicitly disable

    :returns: (axes_to_home, axes_to_dwell)
    """
    axis = axis.upper()

    # If Y is requested make sure we home X first
    if 'Y' in axis:
        axis += 'X'
    # If horizontal movement is requested, ensure we raise the instruments
    if 'X' in axis:
        axis += 'ZA'
    # These two additions are safe even if they duplicate requested axes
    # because of the use of set operations below, which will de-duplicate
    # characters from the resulting string

    # HOME_SEQUENCE defines a pattern for homing, specifically that the
    # ZABC axes should be homed first so that horizontal movement doesn't
    # happen with the pipette down (which could bump into things). Then
    # the X axis is homed, which has to happen before Y. Finally Y can be
    # homed. This variable will contain the sequence just explained, but
    # filters out unrequested axes using set intersection (&) and then
    # filters out disabled axes using set difference (-)
    home_sequence = list(filter(
        None,
        [
            ''.join(set(group) & set(axis) - set(disabled))
            for group in HOME_SEQUENCE
        ]))

    non_moving_axes = ''.join([
        ax
        for ax in AXES
        if ax not in home_sequence
    ])
    return home_sequence, non_moving_axes
