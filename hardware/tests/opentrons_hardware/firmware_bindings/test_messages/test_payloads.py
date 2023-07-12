"""Payloads tests."""
import pytest

from opentrons_hardware.firmware_bindings.messages import payloads, fields
from opentrons_hardware.firmware_bindings import utils


@pytest.mark.parametrize(
    argnames=["address", "data", "expected_checksum"],
    argvalues=[
        [0xF0F0F0F0, bytes(range(48)), 0xF7A8],
        [0x0, b"", 0x0],
        [0x0, b"\x00", 0xFFFF],
        [0x12345678, b"\x05\x06\x07", 0xFED7],
    ],
)
def test_create_firmware_updata_data(
    address: int, data: bytes, expected_checksum: int
) -> None:
    """It should create a complete firmware update data payload."""
    obj = payloads.FirmwareUpdateData.create(address, data, 0)
    assert obj == payloads.FirmwareUpdateData(
        address=utils.UInt32Field(address),
        num_bytes=utils.UInt8Field(len(data)),
        reserved=utils.UInt8Field(0),
        data=fields.FirmwareUpdateDataField(data),
        checksum=utils.UInt16Field(expected_checksum),
    )


@pytest.mark.parametrize(
    argnames=["value_str", "expected"],
    argvalues=[
        ["12", b"\x12"],
        ["a0a1a2a3b0b1b2b3", b"\xa0\xa1\xa2\xa3\xb0\xb1\xb2\xb3"],
        ["00112233445566778899", b"\x00\x11\x22\x33\x44\x55\x66\x77"],
    ],
)
def test_eeprom_field_from_string(value_str: str, expected: bytes) -> None:
    """It should convert to bytes from a string."""
    assert fields.EepromDataField.from_string(value_str).value == expected


def test_old_get_device_info() -> None:
    """A device info response without revision should parse."""
    old = payloads._DeviceInfoResponsePayloadBase(
        version=utils.UInt32Field(0x11223344),
        flags=fields.VersionFlagsField(0x55667788),
        shortsha=fields.FirmwareShortSHADataField(b"abcdef12"),
    )
    old.message_index = utils.UInt32Field(0)
    ser = old.serialize()
    reparsed_old = payloads.DeviceInfoResponsePayload.build(ser)
    assert reparsed_old.version == old.version
    assert reparsed_old.flags == old.flags
    assert reparsed_old.shortsha == old.shortsha
    assert reparsed_old.revision.primary is None
    assert reparsed_old.revision.secondary is None
    assert reparsed_old.revision.tertiary is None
    assert reparsed_old.subidentifier.value == 0


def test_padded_old_get_device_info() -> None:
    """A device info with contentless bytes in revision place should parse."""
    old = payloads._DeviceInfoResponsePayloadBase(
        version=utils.UInt32Field(0x11223344),
        flags=fields.VersionFlagsField(0x55667788),
        shortsha=fields.FirmwareShortSHADataField(b"abcdef12"),
    )
    old.message_index = utils.UInt32Field(0)
    ser = old.serialize() + b"\x00\x00\x00\x00\x00\x00"
    reparsed_old = payloads.DeviceInfoResponsePayload.build(ser)
    assert reparsed_old.version == old.version
    assert reparsed_old.flags == old.flags
    assert reparsed_old.shortsha == old.shortsha
    assert reparsed_old.revision.primary is None
    assert reparsed_old.revision.secondary is None
    assert reparsed_old.revision.tertiary is None
    assert reparsed_old.subidentifier.value == 0


def test_new_get_device_info() -> None:
    """A device info with a filled-out revision field should parse."""
    new = payloads.DeviceInfoResponsePayload(
        version=utils.UInt32Field(0x11223344),
        flags=fields.VersionFlagsField(0x55667788),
        shortsha=fields.FirmwareShortSHADataField(b"abcdef12"),
        revision=fields.OptionalRevisionField.build(b"a1\x00\x00"),
        subidentifier=utils.UInt8Field.build(9),
    )
    new.message_index = utils.UInt32Field(0)
    ser = new.serialize()
    reparsed_new = payloads.DeviceInfoResponsePayload.build(ser)
    assert reparsed_new.version == new.version
    assert reparsed_new.flags == new.flags
    assert reparsed_new.shortsha == new.shortsha
    assert reparsed_new.revision.primary == new.revision.primary
    assert reparsed_new.revision.secondary == new.revision.secondary
    assert reparsed_new.revision.tertiary == new.revision.tertiary
    assert reparsed_new.subidentifier == new.subidentifier
