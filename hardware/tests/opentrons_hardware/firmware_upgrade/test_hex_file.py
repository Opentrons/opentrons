"""Tests for hex file processing."""
import pytest
from opentrons_hardware.firmware_upgrade import hex_file


@pytest.mark.parametrize(
    argnames=["line", "expected"],
    argvalues=[
        [
            ":020000040800F2",
            hex_file.HexLine(
                byte_count=2,
                address=0,
                record_type=hex_file.RecordType.ExtendedLinearAddress,
                data=b"\x08\x00",
                checksum=0xF2,
            ),
        ],
        [
            ":1001C000E9450008E9450008E9450008E945000857",
            hex_file.HexLine(
                byte_count=16,
                address=0x01C0,
                record_type=hex_file.RecordType.Data,
                data=b"\xE9\x45\x00\x08\xE9\x45\x00\x08\xE9\x45\x00\x08\xE9\x45\x00\x08",
                checksum=0x57,
            ),
        ],
        [
            ":0451A0008943000837",
            hex_file.HexLine(
                byte_count=4,
                address=0x51A0,
                record_type=hex_file.RecordType.Data,
                data=b"\x89\x43\x00\x08",
                checksum=0x37,
            ),
        ],
        [
            ":040000050800459911",
            hex_file.HexLine(
                byte_count=4,
                address=0,
                record_type=hex_file.RecordType.StartLinearAddress,
                data=b"\x08\x00\x45\x99",
                checksum=0x11,
            ),
        ],
        [
            ":00000001FF",
            hex_file.HexLine(
                byte_count=0,
                address=0,
                record_type=hex_file.RecordType.EOF,
                data=b"",
                checksum=0xFF,
            ),
        ],
    ],
)
def test_process_line(line: str, expected: hex_file.HexLine) -> None:
    """It should process line successfully."""
    assert hex_file.process_line(line) == expected


@pytest.mark.parametrize(
    argnames=["line"],
    argvalues=[
        [
            # Missing :
            "020000040800F2",
        ],
        [
            # No checksum
            ":1001C000E9450008E9450008E9450008E9450008",
        ],
        [
            # Incomplete
            ":04",
        ],
        [
            # Bad record type
            ":040000060800459910",
        ],
        [
            # Wrong byte count
            ":0200000408F2",
        ],
    ],
)
def test_process_bad_line(line: str) -> None:
    """It should fail to process malformed line."""
    with pytest.raises(hex_file.MalformedLineException):
        hex_file.process_line(line)


@pytest.mark.parametrize(
    argnames=["line"],
    argvalues=[
        [
            ":020000040800F1",
        ],
        [
            ":1001C000E9450008E9450008E9450008E945000858",
        ],
        [
            ":0000000100",
        ],
    ],
)
def test_process_bad_checksum(line: str) -> None:
    """It should raise a checksum exception."""
    with pytest.raises(hex_file.ChecksumException):
        hex_file.process_line(line)
