"""Utilities to parse and format bynary data into Property objects."""

import struct
from typing import List

from .types import Property

DATA_START_DELIM = 0xFE


def parse_data(data: bytes) -> List[Property]:
    """This function will parse bytes and return a list of valid Property objects."""
    properties: List[Property] = list()
    packet: bytes = b""
    for bit in data:
        print(bit)
        if bit == DATA_START_DELIM:
            print("Start byte: {bit}")
    return properties


def serialize_properties(properties: List[Property]) -> bytes:
    """This function will turn a list of Property objects into a byte string."""
    return b""


def generate_packet(properties: Tuple[PropId, Any]) -> bytes:
    """This function will turn concert prop_ids and their data into a bytestring."""
    data = b""
    for property, data in properties:
        if prop


def _format_data(data: bytes) -> bytes:
    # TODO (ba, 2023-05-24): we need to make sure we have enough space to write the data
    # might also want to do 2b property types
    return struct.pack("!BB", DATA_START_DELIM, len(data)) + data
