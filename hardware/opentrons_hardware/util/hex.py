from pathlib import Path
from dataclasses import dataclass
from enum import Enum
from typing import Iterator
import binascii
import struct


class RecordType(str, Enum):
    Data = "00"
    EOF = "01"
    ExtendedSegmentAddress = "02"
    StartSegmentAddress = "03"
    ExtendedLinearAddress = "04"
    StartLinearAddress = "05"


@dataclass
class HexLine:
    byte_count: int
    address: int
    record_type: RecordType
    data: bytes
    checksum: int


def from_hex_file_path(file_path: Path) -> Iterator[HexLine]:
    """

    Args:
        file_path:

    Returns:

    """
    with file_path.open() as hex_file:
        for line in hex_file.readlines():
            if line[0] != ':':
                raise ValueError(f"Missing ':' in '{line}'")
            # Skip the ':' and strip
            binary_line = line[1:].strip()
            byte_count = binascii.unhexlify(binary_line[0:2])[0]
            address = struct.unpack(">H", binascii.unhexlify(binary_line[2:6]))[
                0]
            record_type = RecordType(binary_line[6:8])
            data = binascii.unhexlify(binary_line[8:-2])
            checksum = binascii.unhexlify(binary_line[-2:])[0]
            yield HexLine(byte_count=byte_count, address=address,
                          record_type=record_type, data=data, checksum=checksum)


x = from_hex_file(Path(
    "/Users/amit/firmware/ot3-firmware/build-cross/head/firmware/head.hex"))
for bb in x:
    print(bb)