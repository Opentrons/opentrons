"""Utilities to parse and format bynary data into Property objects."""

import struct
from typing import Any, Optional, Set, Tuple

from .types import (
    PropId,
    Property,
    PropType,
    PROP_ID_TYPES,
    PROP_TYPE_SIZE,
    MAX_DATA_LEN,
)


ParsedData = Tuple[Set[Property], bytes]


def parse_data(data: bytes, prop_ids: Optional[Set[PropId]] = None) -> ParsedData:
    """This function will parse bytes and return a list of valid Property objects.

    Any data that is unparsed or incomplete will be returned to the caller,
    this way it can be combined with new data and reparsed.
    """
    prop_ids = prop_ids or set(PropId.__members__.values())
    properties: Set[Property] = set()
    packet = b""
    start_idx = end_idx = 0
    data_len = len(data)
    while start_idx < data_len:
        prop_id = data[start_idx]
        # break out if we have an invalid prop id (0xff)
        if prop_id == PropId.INVALID.value:
            break

        # this will determine if the data is going to overflow
        if start_idx + 1 >= data_len:
            packet = data[start_idx:]
            break
        prop_len = data[start_idx + 1]
        if prop_len > MAX_DATA_LEN:
            break
        end_idx = start_idx + 2 + prop_len
        if end_idx > data_len:
            packet = data[start_idx:]
            break

        prop_data = data[start_idx + 2 : end_idx]
        start_idx += prop_len + 2  # prop_id (1b) + prop_len (1b)

        # decode the data for the given property
        prop = _parse_prop(prop_id, prop_len, prop_data)
        if prop and prop.id in prop_ids:
            properties.add(prop)
    return properties, packet


def _parse_prop(prop_id: int, prop_len: int, data: bytes) -> Optional[Property]:
    try:
        prop = PropId(prop_id)
        data_type = PROP_ID_TYPES[prop]
        data_size = PROP_TYPE_SIZE[data_type]
        decoded_data: Any = data
        if data_type == PropType.BYTE:
            decoded_data = data[0]
        elif data_type == PropType.CHAR:
            decoded_data = chr(data[0])
        elif data_type in [PropType.SHORT, PropType.INT]:
            decoded_data = int.from_bytes(data, "big")
        elif data_type == PropType.STR:
            decoded_data = data.decode("utf-8")
        return Property(id=prop, type=data_type, max_size=data_size, value=decoded_data)
    except ValueError:
        return None


def generate_packet(prop_id: PropId, value: Any) -> Optional[bytes]:
    """This function will turn prop_ids and their data into a bytes for writting to eeprom."""
    data = _encode_data(prop_id, value)
    if data and len(data) <= MAX_DATA_LEN:
        return struct.pack("!BB", prop_id.value, len(data)) + data
    return None


def _encode_data(prop_id: PropId, value: Any) -> Optional[bytes]:  # noqa: C901
    if prop_id == PropId.INVALID:
        return None
    encoded_data: bytes = b""
    try:
        prop_id = PropId(prop_id)
        data_type = PROP_ID_TYPES[prop_id]
        if data_type == PropType.BYTE:
            encoded_data = struct.pack("!B", value)
        elif data_type == PropType.CHAR:
            encoded_data = struct.pack("!B", ord(value))
        elif data_type == PropType.SHORT:
            encoded_data = struct.pack("!h", value)
        elif data_type == PropType.INT:
            encoded_data = struct.pack("!i", value)
        elif data_type == PropType.STR:
            encoded_data = f"{value}".encode("utf-8")
        elif data_type == PropType.BIN:
            encoded_data = bytes(value)
        return encoded_data
    except (ValueError, TypeError, struct.error):
        return None
