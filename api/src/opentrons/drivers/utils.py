import logging
from typing import List, Mapping, Optional

from serial.tools import list_ports  # type: ignore

log = logging.getLogger(__name__)

# Number of digits after the decimal point for temperatures being sent
# to/from Temp-Deck
TEMPDECK_GCODE_ROUNDING_PRECISION = 0
TC_GCODE_ROUNDING_PRECISION = 2


class ParseError(Exception):
    pass


class SerialNoResponse(Exception):
    pass


def parse_string_value_from_substring(substring) -> str:
    '''
    Returns the ascii value in the expected string "N:aa11bb22", where "N" is
    the key, and "aa11bb22" is string value to be returned
    '''
    try:
        value = substring.split(':')[1]
        return str(value)
    except (ValueError, IndexError, TypeError, AttributeError):
        log.exception('Unexpected arg to parse_string_value_from_substring:')
        raise ParseError(
            'Unexpected arg to parse_string_value_from_substring: {}'.format(
                substring))


def parse_number_from_substring(substring, rounding_val) -> Optional[float]:
    '''
    Returns the number in the expected string "N:12.3", where "N" is the
    key, and "12.3" is a floating point value

    For the temp-deck or thermocycler's temperature response, one expected
    input is something like "T:none", where "none" should return a None value
    '''
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
    '''
    Returns the axis in the expected string "N:12.3", where "N" is the
    key, and "12.3" is a floating point value
    '''
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
    '''
    Example input: "T:none C:25"
    '''
    err_msg = 'Unexpected argument to parse_temperature_response: {}'.format(
        temperature_string)
    if not temperature_string or \
            not isinstance(temperature_string, str):
        raise ParseError(err_msg)
    parsed_values = temperature_string.strip().split(' ')
    if len(parsed_values) < 2:
        log.error(err_msg)
        raise ParseError(err_msg)

    data = {
        parse_key_from_substring(s): parse_number_from_substring(s,
                                                                 rounding_val)
        for s in parsed_values[:2]
    }
    if 'C' not in data or 'T' not in data:
        raise ParseError(err_msg)
    data = {
        'current': data['C'],
        'target': data['T']
    }
    return data


def parse_device_information(
        device_info_string: str) -> Mapping[str, str]:
    '''
        Parse the modules's device information response.

        Example response from temp-deck: "serial:aa11 model:bb22 version:cc33"
    '''
    error_msg = 'Unexpected argument to parse_device_information: {}'.format(
        device_info_string)
    if not device_info_string or \
            not isinstance(device_info_string, str):
        raise ParseError(error_msg)
    parsed_values = device_info_string.strip().split(' ')
    if len(parsed_values) < 3:
        log.error(error_msg)
        raise ParseError(error_msg)
    res = {
        parse_key_from_substring(s): parse_string_value_from_substring(s)
        for s in parsed_values[:3]
    }
    for key in ['model', 'version', 'serial']:
        if key not in res:
            raise ParseError(error_msg)
    return res


def get_ports_by_name(device_name: str) -> List[str]:
    '''Returns all serial devices with a given name'''
    filtered_devices = filter(
        lambda device: device_name in device[1],
        list_ports.comports()
    )
    device_ports = [device[0] for device in filtered_devices]
    return device_ports


def get_port_by_VID(vid: str) -> Optional[str]:
    '''Returns first serial device with a given VID'''
    for d in list_ports.comports():
        if d.vid == vid:
            return d[0]
    return None


def parse_serial_response(response: str, ack: str) -> Optional[str]:
    """ Strip acknowledge blocks from serial responses

    If no acknowledge block is found, return None
    """
    if ack in response:
        parsed_response = response.split(ack)[0]
        return parsed_response.strip()
    else:
        return None
