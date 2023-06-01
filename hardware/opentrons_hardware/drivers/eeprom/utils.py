"""Utilities to parse and format bynary data into Property objects."""

import struct
from typing import Any, List, Optional, Tuple

from .types import (
    PropId,
    Property,
    PropType,
    PROP_ID_TYPES,
    PROP_TYPE_SIZE,
)

DATA_START_DELIM = 0xFE
DATA_END_DELIM = 0x0D


def parse_data(data: bytes) -> List[Property]:
    """This function will parse bytes and return a list of valid Property objects."""
    properties: List[Property] = list()
    packet = b""
    start_idx = end_idx = 0
    for idx in range(len(data)):
        if data[idx] == DATA_START_DELIM:
            print(f"Start byte: {idx}")
            start_idx = idx
        elif data[idx] == DATA_END_DELIM:
            print(f"End byte: {idx}")
            end_idx = idx
        if end_idx != 0:
            packet = data[start_idx : end_idx + 1]
            print(f"Found potential packet - {packet.hex()}")
            valid_packet = _check_valid_data(packet)
            if valid_packet:
                print(f"Found valid packet - {packet.hex()}")
                print("Handle packet here!")
                prop_len = packet[start_idx + 1]
                prop_id = packet[start_idx + 2]
                prop_data = packet[start_idx + 3 : end_idx]
                print(
                    f"prop_len: {prop_len} prop_id: {prop_id} prop_data: {prop_data.hex()}"
                )
                prop = _parse_prop(prop_id, prop_len, prop_data)
                if prop:
                    properties.append(prop)
            start_idx = end_idx = 0
    return properties


def _parse_prop(prop_id: PropId, prop_len: int, data: bytes) -> Optional[Property]:
    try:
        prop = PropId(prop_id)
    except ValueError:
        return None

    data_type = PROP_ID_TYPES[prop]
    data_size = PROP_TYPE_SIZE[data_type]
    decoded_data: Any = None
    if data_type == PropType.BYTE:
        decoded_data = data[0]
    elif data_type == PropType.CHAR:
        decoded_data = chr(data[0])
    elif data_type in [PropType.SHORT, PropType.INT]:
        decoded_data = int.from_bytes(data, "big")
    elif data_type == PropType.STR:
        decoded_data = data.decode("utf-8")
    else:
        decoded_data = data

    print(
        f"Found data_type: {data_type} data_size: {data_size} decoded: {decoded_data}"
    )

    return Property(id=prop, type=data_type, size=data_size, value=decoded_data)


def serialize_properties(properties: List[Property]) -> bytes:
    """This function will turn a list of Property objects into a byte string."""
    return b""


def generate_packet(properties: Tuple[PropId, Any]) -> bytes:
    """This function will turn concert prop_ids and their data into a bytestring."""
    data = b""
    # for property, data in properties:
    #    if prop
    return data


def _validate_packet(data: bytes) -> bytes:
    return b""


def _format_data(data: bytes) -> bytes:
    # TODO (ba, 2023-05-24): we need to make sure we have enough space to write the data
    # might also want to do 2b property types
    packet = struct.pack("!BB", DATA_START_DELIM, len(data)) + data
    return packet + struct.pack("B", DATA_END_DELIM)


def _check_valid_data(data: bytes) -> bool:
    if data[-1] != DATA_END_DELIM:
        return False
    if len(data) < 4:  # shortest payload size
        return False
    expected_len = data[1]
    actual_len = len(data) - 3  # start (1b) + len (1b) + end (1b)
    if expected_len != actual_len:
        return False
    return True
