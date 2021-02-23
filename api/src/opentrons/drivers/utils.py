import logging
import time
from typing import Dict, Optional, Mapping, Iterable, Sequence
import re

log = logging.getLogger(__name__)

# Number of digits after the decimal point for temperatures being sent
# to/from Temp-Deck
TEMPDECK_GCODE_ROUNDING_PRECISION = 0
TC_GCODE_ROUNDING_PRECISION = 2


KEY_VALUE_REGEX = re.compile(r"((?P<key>\S+):(?P<value>\S+))")


class ParseError(Exception):
    pass


def parse_string_value_from_substring(substring) -> str:
    """
    Returns the ascii value in the expected string "N:aa11bb22", where "N" is
    the key, and "aa11bb22" is string value to be returned
    """
    try:
        value = substring.split(':')[1]
        return str(value)
    except (ValueError, IndexError, TypeError, AttributeError):
        log.exception('Unexpected arg to parse_string_value_from_substring:')
        raise ParseError(
            'Unexpected arg to parse_string_value_from_substring: {}'.format(
                substring))


def parse_number_from_substring(substring, rounding_val) -> Optional[float]:
    """
    Returns the number in the expected string "N:12.3", where "N" is the
    key, and "12.3" is a floating point value

    For the temp-deck or thermocycler's temperature response, one expected
    input is something like "T:none", where "none" should return a None value
    """
    try:
        value = substring.split(':')[1]
        if value.strip().lower() == 'none':
            return None
        return round(float(value), rounding_val)
    except (ValueError, IndexError, TypeError, AttributeError):
        log.exception('Unexpected argument to parse_number_from_substring:')
        raise ParseError(
            'Unexpected argument to parse_number_from_substring: {}'.format(
                substring))


def parse_key_from_substring(substring) -> str:
    """
    Returns the axis in the expected string "N:12.3", where "N" is the
    key, and "12.3" is a floating point value
    """
    try:
        return substring.split(':')[0]
    except (ValueError, IndexError, TypeError, AttributeError):
        log.exception('Unexpected argument to parse_key_from_substring:')
        raise ParseError(
            'Unexpected argument to parse_key_from_substring: {}'.format(
                substring))


def parse_temperature_response(
        temperature_string: str, rounding_val: int
        ) -> Mapping[str, Optional[float]]:
    """Example input: "T:none C:25"""
    data = parse_key_values(temperature_string)
    if 'C' not in data or 'T' not in data:
        raise ParseError(
            f'Unexpected argument to parse_temperature_response: '
            f'{temperature_string}'
        )
    result = {
        'current': parse_optional_number(data['C'], rounding_val),
        'target': parse_optional_number(data['T'], rounding_val)
    }
    return result


def parse_device_information(
        device_info_string: str) -> Mapping[str, str]:
    """
    Parse the modules's device information response.

    Example response from temp-deck: "serial:aa11 model:bb22 version:cc33"
    """
    res = parse_key_values(device_info_string)

    for key in ['model', 'version', 'serial']:
        if key not in res:
            raise ParseError(f'Missing key {key} from device info '
                             f'string {device_info_string}.')
    return res


def parse_key_values(value: str) -> Dict[str, str]:
    """Convert string in the format:
        'key1:value1 key2:value2'
        to dict
        {'key1': 'value1', 'key2': 'value2'}
    """
    if not value or not isinstance(value, str):
        raise ParseError(
            f'Unexpected argument to parse_key_values: {value}'
        )

    res = {g.groupdict()['key']: g.groupdict()['value']
           for g in KEY_VALUE_REGEX.finditer(value)}
    return res


def parse_optional_number(value: str, rounding_val) -> Optional[float]:
    """Convert number to float. 'none' will be converted to None"""
    return None if value == "none" else parse_number(value, rounding_val)


def parse_number(value: str, rounding_val: int) -> float:
    """Convert string to float."""
    try:
        return round(float(value), rounding_val)
    except (ValueError, IndexError, TypeError, AttributeError):
        err = f'Unexpected argument to parse_number: {value}'
        log.exception(err)
        raise ParseError(err)


class AxisMoveTimestamp:
    """ Keeps track of the last time axes were known to move """

    def __init__(self, axis_iter: Sequence[str]):
        self._moved_at: Dict[str, Optional[float]] = {
            ax: None for ax in axis_iter
        }

    def mark_moved(self, axis_iter: Sequence[str]):
        """ Indicate that a set of axes just moved """
        now = time.monotonic()
        self._moved_at.update({ax: now for ax in axis_iter})

    def time_since_moved(self) -> Mapping[str, Optional[float]]:
        """ Get a mapping of the time since each known axis moved """
        now = time.monotonic()
        return {ax: now-val if val else None
                for ax, val, in self._moved_at.items()}

    def reset_moved(self, axis_iter: Iterable[str]):
        """ Reset the clocks for a set of axes """
        self._moved_at.update({ax: None for ax in axis_iter})
