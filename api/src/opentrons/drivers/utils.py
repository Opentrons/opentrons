import binascii
import logging
import time
from typing import Dict, Optional, Mapping, Iterable, Sequence
import re

from opentrons.drivers.types import (
    Temperature,
    PlateTemperature,
    RPM,
    HeaterShakerLabwareLatchStatus,
)

log = logging.getLogger(__name__)

# Number of digits after the decimal point for temperatures being sent
# to/from Temp-Deck
TEMPDECK_GCODE_ROUNDING_PRECISION = 0
TC_GCODE_ROUNDING_PRECISION = 2
HS_GCODE_ROUNDING_PRECISION = 2


KEY_VALUE_REGEX = re.compile(r"((?P<key>\S+):(?P<value>\S+))")


class ParseError(Exception):
    def __init__(self, error_message: str, parse_source: str) -> None:
        self.error_message = error_message
        self.parse_source = parse_source
        super().__init__(
            f"ParseError(error_message={error_message}, parse_source={parse_source})"
        )


def parse_string_value_from_substring(substring: str) -> str:
    """
    Returns the ascii value in the expected string "N:aa11bb22", where "N" is
    the key, and "aa11bb22" is string value to be returned
    """
    try:
        value = substring.split(":")[1]
        return str(value)
    except (ValueError, IndexError, TypeError, AttributeError):
        log.exception("Unexpected arg to parse_string_value_from_substring:")
        raise ParseError(
            error_message="Unexpected arg to parse_string_value_from_substring",
            parse_source=substring,
        )


def parse_temperature_response(
    temperature_string: str, rounding_val: int
) -> Temperature:
    """Parse a standard temperature response from a module

    temperature_string: The string from the module after decoding
    rounding_val: A value to round to

    Example input: "T:none C:25"""
    data = parse_key_values(temperature_string)
    try:
        target = parse_optional_number(data["T"], rounding_val)
        return Temperature(current=parse_number(data["C"], rounding_val), target=target)
    except KeyError:
        raise ParseError(
            error_message="Unexpected argument to parse_temperature_response",
            parse_source=temperature_string,
        )


def parse_rpm_response(rpm_string: str) -> RPM:
    """Example input: T:1233 C:212"""
    data = parse_key_values(rpm_string)
    try:
        # target is listed as Optional for below assignment,
        # but None will be represented as 0 in G-code
        target: Optional[int] = int(parse_number(data["T"], 0))
        if target == 0:
            target = None
        return RPM(
            current=int(parse_number(data["C"], 0)),
            target=target,
        )
    except KeyError:
        raise ParseError(
            error_message="Unexpected argument to parse_rpm_response",
            parse_source=rpm_string,
        )


def parse_labware_latch_status_response(
    status_string: str,
) -> HeaterShakerLabwareLatchStatus:
    """Example format: STATUS:IDLE_OPEN"""
    status_vals = parse_key_values(status_string)
    try:
        return HeaterShakerLabwareLatchStatus[status_vals["STATUS"]]
    except KeyError:
        raise ParseError(
            error_message="Unexpected argument to parse_labware_latch_status_response",
            parse_source=status_string,
        )


def parse_plate_temperature_response(
    temperature_string: str, rounding_val: int
) -> PlateTemperature:
    """Example input: "T:none C:25 H:123"""
    data = parse_key_values(temperature_string)
    try:
        return PlateTemperature(
            current=parse_number(data["C"], rounding_val),
            target=parse_optional_number(data["T"], rounding_val),
            hold=parse_optional_number(data["H"], rounding_val),
        )
    except KeyError:
        raise ParseError(
            error_message="Unexpected argument to parse_plate_temperature_response",
            parse_source=temperature_string,
        )


def parse_hs_device_information(device_info_string: str) -> Dict[str, str]:
    """Parse the device information block from a heater/shaker, which
    has a slightly different set of keys for its entries
    Example: "HW:A FW:21.2.1 SerialNo:TCA020B"
    """
    res = parse_key_values(device_info_string)
    keymap = {"HW": "model", "FW": "version", "SerialNo": "serial"}
    try:
        return {keymap[key]: res[key] for key in keymap.keys()}
    except KeyError as e:
        raise ParseError(
            error_message=f"Missing key '{str(e)} in parse_hs_device_information",
            parse_source=device_info_string,
        )


def parse_device_information(device_info_string: str) -> Dict[str, str]:
    """
    Parse the modules's device information response.

    Example response from temp-deck: "serial:aa11 model:bb22 version:cc33"
    """
    res = parse_key_values(device_info_string)

    try:
        return {key: res[key] for key in ["model", "version", "serial"]}
    except KeyError as e:
        raise ParseError(
            error_message=f"Missing key '{str(e)}' in parse_device_information",
            parse_source=device_info_string,
        )


def parse_key_values(value: str) -> Dict[str, str]:
    """Convert string in the format:
    'key1:value1 key2:value2'
    to dict
    {'key1': 'value1', 'key2': 'value2'}
    """
    res = {
        g.groupdict()["key"]: g.groupdict()["value"]
        for g in KEY_VALUE_REGEX.finditer(value)
    }
    return res


def parse_optional_number(value: str, rounding_val: int) -> Optional[float]:
    """Convert number to float. 'none' will be converted to None"""
    return None if value.lower() == "none" else parse_number(value, rounding_val)


def parse_number(value: str, rounding_val: int) -> float:
    """Convert string to float."""
    try:
        return round(float(value), rounding_val)
    except ValueError:
        raise ParseError(
            error_message="Unexpected argument to parse_number", parse_source=value
        )


class AxisMoveTimestamp:
    """Keeps track of the last time axes were known to move"""

    def __init__(self, axis_iter: Sequence[str]):
        self._moved_at: Dict[str, Optional[float]] = {ax: None for ax in axis_iter}

    def mark_moved(self, axis_iter: Sequence[str]) -> None:
        """Indicate that a set of axes just moved"""
        now = time.monotonic()
        self._moved_at.update({ax: now for ax in axis_iter})

    def time_since_moved(self) -> Mapping[str, Optional[float]]:
        """Get a mapping of the time since each known axis moved"""
        now = time.monotonic()
        return {ax: now - val if val else None for ax, val, in self._moved_at.items()}

    def reset_moved(self, axis_iter: Iterable[str]) -> None:
        """Reset the clocks for a set of axes"""
        self._moved_at.update({ax: None for ax in axis_iter})


def string_to_hex(val: str, min_length: int = 0) -> str:
    """
    Create a hex representation of val. The end of the result will be padded
    with "0" until min_length is reached.

    Args:
        val: The string to convert.
        min_length: The minimum length of result. "0" will be used as
            padding. Default is no minimum length and no padding.

    Returns:
        Hex string
    """
    hex_string = binascii.hexlify(val.encode()).decode()
    hex_string_length = len(hex_string)
    if hex_string_length < min_length:
        return hex_string + "0" * (min_length - hex_string_length)
    return hex_string
