import logging
from typing import Dict

from opentrons.drivers.smoothie_drivers.constants import AXES, GCODE_ROUNDING_PRECISION
from opentrons.drivers.utils import (
    parse_key_values,
    parse_number,
    parse_optional_number,
    ParseError,
)


log = logging.getLogger(__name__)


def parse_position_response(raw_axis_values: str) -> Dict[str, float]:
    """
    Parse position response.

    Args:
        raw_axis_values: a string containing axis:value

    Returns:
        dictionary of axis to position.
    """
    parsed_values = parse_key_values(raw_axis_values)
    if len(parsed_values) < 6:
        raise ParseError(
            error_message="Unexpected response in _parse_position_response",
            parse_source=raw_axis_values,
        )

    data = {
        k.title(): parse_number(v, GCODE_ROUNDING_PRECISION)
        for k, v in parsed_values.items()
    }
    return data


def parse_instrument_data(smoothie_response: str) -> Dict[str, bytearray]:
    """
    Parse instrument data.

    Args:
        smoothie_response: A string containing a mount prefix (L or R) followed by :
            and a hex string.

    Returns:
        mapping of the mount prefix to the hex string.
    """
    try:
        items = smoothie_response.split("\n")[0].strip().split(":")
        mount = items[0]
        if mount not in {"L", "R"}:
            raise ParseError(
                error_message=f"Invalid mount '{mount}'", parse_source=smoothie_response
            )
        # data received from Smoothieware is stringified HEX values
        # because of how Smoothieware handles GCODE messages
        data = bytearray.fromhex(items[1])
    except (ValueError, IndexError, TypeError, AttributeError):
        raise ParseError(
            error_message="Unexpected argument to parse_instrument_data",
            parse_source=smoothie_response,
        )
    return {mount: data}


def byte_array_to_ascii_string(byte_array: bytearray) -> str:
    """
    Convert byte array to ascii string.

    Args:
        byte_array: a byte array

    Returns:
        String

    """
    # remove trailing null characters
    try:
        for c in [b"\x00", b"\xFF"]:
            if c in byte_array:
                byte_array = byte_array[: byte_array.index(c)]
        res = byte_array.decode()
    except (ValueError, TypeError, AttributeError):
        log.exception("Unexpected argument to _byte_array_to_ascii_string:")
        raise ParseError(
            error_message="Unexpected argument to byte_array_to_ascii_string",
            parse_source=byte_array.decode(),
        )
    return res


def parse_switch_values(raw_switch_values: str) -> Dict[str, bool]:
    if not raw_switch_values or not isinstance(raw_switch_values, str):
        raise ParseError(
            error_message="Unexpected argument to parse_switch_values",
            parse_source=raw_switch_values,
        )

    # probe has a space after it's ":" for some reason
    if "Probe: " in raw_switch_values:
        raw_switch_values = raw_switch_values.replace("Probe: ", "Probe:")

    parsed_values = parse_key_values(raw_switch_values)
    res = {
        k.title(): bool(parse_optional_number(v, rounding_val=GCODE_ROUNDING_PRECISION))
        for (k, v) in parsed_values.items()
        if any(n in k for n in ["max", "Probe"])
    }
    # remove the extra "_max" character from each axis key in the dict
    res = {key.split("_")[0]: val for key, val in res.items()}
    if len((list(AXES) + ["Probe"]) & res.keys()) != 7:
        raise ParseError(
            error_message="Unexpected argument to parse_switch_values",
            parse_source=raw_switch_values,
        )
    return res


def parse_homing_status_values(raw_homing_status_values: str) -> Dict[str, bool]:
    """
    Parse the Smoothieware response to a G28.6 command (homing-status)
    A "1" means it has been homed, and "0" means it has not been homed

    Example response after homing just X axis:
    "X:1 Y:0 Z:0 A:0 B:0 C:0"

    returns: dict
        Key is axis, value is True if the axis needs to be homed
    """
    parsed_values = parse_key_values(raw_homing_status_values)
    res = {
        k.title(): bool(parse_number(v, GCODE_ROUNDING_PRECISION))
        for k, v in parsed_values.items()
    }
    if len(list(AXES) & res.keys()) != 6:
        raise ParseError(
            error_message="Unexpected argument to parse_homing_status_values",
            parse_source=raw_homing_status_values,
        )
    return res
