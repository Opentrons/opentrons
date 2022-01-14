from pathlib import Path
from dataclasses import dataclass
from enum import Enum
from typing import Iterator
import binascii
import struct

from typing_extensions import Final


class RecordType(int, Enum):
    Data = 0
    EOF = 1
    ExtendedSegmentAddress = 2
    StartSegmentAddress = 3
    ExtendedLinearAddress = 4
    StartLinearAddress = 5


@dataclass
class HexLine:
    byte_count: int
    address: int
    record_type: RecordType
    data: bytes
    checksum: int


class HexFileException(BaseException):
    """Base of all hex file exceptions."""

    pass


class MalformedLineException(HexFileException):
    """Line is malformed."""

    pass


class ChecksumException(HexFileException):
    """Wrong checksum."""

    pass


def from_hex_file_path(file_path: Path) -> Iterator[HexLine]:
    """A generator that processes a hex file at file_path."""
    with file_path.open() as hex_file:
        for line in hex_file.readlines():
            yield process_line(line)


def from_hex_contents(data: str) -> Iterator[HexLine]:
    """A generator that processes a hex file contents."""
    for line in data.splitlines():
        yield process_line(line)


def process_line(line: str) -> HexLine:
    """Convert a line in a HEX file into a HexLine."""
    if len(line) < 11:
        # 11 = 1 (':') + 2 (byte count) + 4 (address) + 2 (record type) + 2 (checksum)
        raise MalformedLineException(f"Line is missing fields '{line}'")

    if line[0] != ":":
        raise MalformedLineException(f"Missing ':' in '{line}'")

    # Skip the ':' and strip
    binary_line = binascii.unhexlify(line[1:].rstrip())

    # byte 0 is byte count
    byte_count = binary_line[0]
    # bytes 1, 2 for address
    address = struct.unpack(">H", binary_line[1:3])[0]
    # byte 3 is record type
    try:
        record_type = RecordType(binary_line[3])
    except ValueError:
        raise MalformedLineException(f"'{binary_line[3]}' is not a valid record type.")

    # 5 is 1 for byte count, 2 for address, 1 for record type, and 1 for checksum
    if len(binary_line) != (byte_count + 5):
        raise MalformedLineException("Incorrect byte count")

    byte_count_index: Final = 4
    checksum_index: Final = byte_count_index + byte_count

    # byte_count of data
    data = binary_line[byte_count_index: checksum_index]

    # Checksum from line
    checksum = binary_line[checksum_index]
    # compute checksum
    computed_checksum = 0xFF & (~sum(binary_line[: checksum_index]) + 1)

    if computed_checksum != checksum:
        raise ChecksumException(f"Expected {checksum} but computed {computed_checksum}")

    return HexLine(
        byte_count=byte_count,
        address=address,
        record_type=record_type,
        data=data,
        checksum=checksum,
    )


def ffff():
    x = from_hex_file_path(
        Path(
            "/Users/amit/firmware/ot3-firmware/build-cross/gantry/firmware/gantry-x.hex"
        )
    )
    add_offset = 0
    gg = []
    data_size = 0

    for bb in x:
        print(bb)
        if bb.record_type == RecordType.StartLinearAddress:
            add_offset = struct.unpack(">L", bb.data)[0]
        elif bb.record_type == RecordType.ExtendedLinearAddress:
            add_offset = struct.unpack(">H", bb.data)[0] << 16
        elif bb.record_type == RecordType.Data:
            # print(f"{add_offset + bb.address}-{add_offset + bb.address + len(bb.data)}")
            gg.append((add_offset + bb.address, len(bb.data)))
            data_size += len(bb.data)

    p = None
    for g in gg:
        if p:
            if p[0] + p[1] != g[0]:
                print(f"{p}, {g}")
        p = g

    print(len(gg))
    print(data_size)


# ffff()
