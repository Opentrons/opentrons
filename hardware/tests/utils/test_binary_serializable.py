"""Binary serializable tests."""

import pytest
from dataclasses import dataclass
from opentrons_hardware import utils


def test_fields_must_be_binary_fields() -> None:
    """It should raise an error when a field is not BinaryFieldBase type."""

    @dataclass
    class Failing(utils.BinarySerializable):
        """Test class type."""

        a: int

    with pytest.raises(utils.InvalidFieldException):
        Failing(a=123).serialize()


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
        # 1 bytes each
        ub=utils.UInt8Field(8),
        b=utils.Int8Field(-8),
        # 2 bytes each
        us=utils.UInt16Field(16),
        s=utils.Int16Field(-16),
        # 4 bytes each
        ul=utils.UInt32Field(32),
        l=utils.Int32Field(-32),
    )


def test_serialize_length(subject: TestClass) -> None:
    """It should serialize with correct data length in bytes."""
    assert len(subject.serialize()) == 14


def test_deserialize() -> None:
    """It should deserialize data correctly."""
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
    """It should serialize a deserialized instance correctly."""
    # Deserialize a serialized instance. They should be the same.
    new = TestClass.build(subject.serialize())
    assert new == subject


@dataclass
class LittleEndianTestClass(utils.LittleEndianBinarySerializable):
    """Little endian test class."""

    ul: utils.UInt32Field
    l: utils.Int32Field


@pytest.fixture
def little_endian_data() -> bytes:
    """Little endian data fixture."""
    return b"\x00\x00\x00\x05\x00\x00\x00\x06"


def test_deserialize_little_endian(little_endian_data: bytes) -> None:
    """It should deserialize little endian data correctly."""
    assert LittleEndianTestClass.build(little_endian_data) == LittleEndianTestClass(
        ul=utils.UInt32Field(0x05000000), l=utils.Int32Field(0x06000000)
    )


def test_serialize_little_endian(little_endian_data: bytes) -> None:
    """It should serialize little endian data correctly."""
    assert (
        LittleEndianTestClass(
            ul=utils.UInt32Field(0x05000000), l=utils.Int32Field(0x06000000)
        ).serialize()
        == little_endian_data
    )
