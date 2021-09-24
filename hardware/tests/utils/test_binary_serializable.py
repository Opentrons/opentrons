"""Binary serializable tests."""

import pytest
from dataclasses import dataclass
from opentrons_hardware import utils


@dataclass
class MyTestClass(utils.BinarySerializable):
    ub: int = utils.ubyte_field()
    b: int = utils.byte_field()
    us: int = utils.ushort_field()
    s: int = utils.short_field()
    ul: int = utils.ulong_field()
    l: int = utils.long_field()


@pytest.fixture
def subject() -> MyTestClass:
    """The test subject."""
    return MyTestClass(ub=8, b=-8, us=16, s=-16, ul=32, l=-32)


def test_serialize_length(subject: MyTestClass) -> None:
    """Test that serialized data length is correct."""
    assert len(subject.serialize()) == 14


def test_deserialize() -> None:
    """Test that we deserialize data correctly."""
    data = b'\x01\x02\x00\x03\x00\x04\x00\x00\x00\x05\x00\x00\x00\x06'
    assert MyTestClass.build(data) == MyTestClass(ub=1, b=2, us=3, s=4, ul=5, l=6)


def test_serdes(subject: MyTestClass) -> None:
    """Test that deserializing a serialized instance works."""
    new = MyTestClass.build(subject.serialize())
    assert new == subject


@dataclass
class LittleEndianTestClass(utils.LittleEndianBinarySerializable):
    ul: int = utils.ulong_field()
    l: int = utils.long_field()


def test_deserialize_little_endian() -> None:
    """Test that we deserialize data correctly."""
    data = b'\x00\x00\x00\x05\x00\x00\x00\x06'
    assert LittleEndianTestClass.build(data) == LittleEndianTestClass(ul=0x05000000, l=0x06000000)


def test_serialize_little_endian() -> None:
    """Test that we serialize data correctly."""
    data = b'\x00\x00\x00\x05\x00\x00\x00\x06'
    assert LittleEndianTestClass(ul=0x05000000, l=0x06000000).serialize() == data
