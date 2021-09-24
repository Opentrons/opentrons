"""Binary serializable tests."""

import pytest
from dataclasses import dataclass
from opentrons_hardware import utils


@dataclass
class TestClass(utils.BinarySerializable):
    """Test class type."""

    ub: utils.UInt8Field
    b: utils.Int8Field
    us: utils.UInt16Field
    s: utils.Int16Field
    ul: utils.UInt32Field
    l: utils.Int32Field


@pytest.fixture
def subject() -> TestClass:
    """The test subject."""
    return TestClass(
        ub=utils.UInt8Field(8),
        b=utils.Int8Field(-8),
        us=utils.UInt16Field(16),
        s=utils.Int16Field(-16),
        ul=utils.UInt32Field(32),
        l=utils.Int32Field(-32),
    )


def test_serialize_length(subject: TestClass) -> None:
    """Test that serialized data length is correct."""
    assert len(subject.serialize()) == 14


def test_deserialize() -> None:
    """Test that we deserialize data correctly."""
    data = b"\x01\x02\x00\x03\x00\x04\x00\x00\x00\x05\x00\x00\x00\x06"
    assert TestClass.build(data) == TestClass(
        ub=utils.UInt8Field(1),
        b=utils.Int8Field(2),
        us=utils.UInt16Field(3),
        s=utils.Int16Field(4),
        ul=utils.UInt32Field(5),
        l=utils.Int32Field(6),
    )


def test_serdes(subject: TestClass) -> None:
    """Test that deserializing a serialized instance works."""
    new = TestClass.build(subject.serialize())
    assert new == subject


@dataclass
class LittleEndianTestClass(utils.LittleEndianBinarySerializable):
    """Little endian test class."""
    ul: utils.UInt32Field
    l: utils.Int32Field


def test_deserialize_little_endian() -> None:
    """Test that we deserialize data correctly."""
    data = b"\x00\x00\x00\x05\x00\x00\x00\x06"
    assert LittleEndianTestClass.build(data) == LittleEndianTestClass(
        ul=utils.UInt32Field(0x05000000), l=utils.Int32Field(0x06000000)
    )


def test_serialize_little_endian() -> None:
    """Test that we serialize data correctly."""
    data = b"\x00\x00\x00\x05\x00\x00\x00\x06"
    assert (
        LittleEndianTestClass(
            ul=utils.UInt32Field(0x05000000), l=utils.Int32Field(0x06000000)
        ).serialize()
        == data
    )
