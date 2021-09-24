"""BinarySerializable dataclass."""

from __future__ import annotations
import struct
from dataclasses import dataclass, fields, astuple
from typing import TypeVar, Generic

from typing_extensions import Final

format_string_attribute: Final = "__struct_format_string__"


class BinarySerializableException(BaseException):
    """Exception."""

    pass


class InvalidFieldException(BinarySerializableException):
    """Field is wrong type."""

    pass


T = TypeVar("T")


class BinaryFieldBase(Generic[T]):
    """Binary serializable field."""

    FORMAT = ""
    """The struct format string for this field."""

    def __init__(self, t: T) -> None:
        """Constructor."""
        self._t = t

    @classmethod
    def build(cls, t: T) -> BinaryFieldBase[T]:
        """Factory method.

        Args:
            t: The value.

        Returns:
            New instance.
        """
        return cls(t)

    @property
    def value(self) -> T:
        """The value."""
        return self._t

    def __eq__(self, other: object) -> bool:
        """Comparison."""
        return isinstance(other, BinaryFieldBase) and other.value == self.value


class UInt32Field(BinaryFieldBase[int]):
    """Unsigned 32 bit integer field."""

    FORMAT = "L"


class Int32Field(BinaryFieldBase[int]):
    """Signed 32 bit integer field."""

    FORMAT = "l"


class UInt16Field(BinaryFieldBase[int]):
    """Unsigned 16 bit integer field."""

    FORMAT = "H"


class Int16Field(BinaryFieldBase[int]):
    """Signed 16 bit integer field."""

    FORMAT = "h"


class UInt8Field(BinaryFieldBase[int]):
    """Unsigned 8 bit integer field."""

    FORMAT = "B"


class Int8Field(BinaryFieldBase[int]):
    """Signed 8 bit integer field."""

    FORMAT = "b"


@dataclass
class BinarySerializable:
    """Base class of a dataclass that can be serialized/deserialized into bytes.

    Each field must have the FieldMetaData metadata value defining the format string
    used by `struct` package to pack/unpack the field.

    Data will be packed big endian.
    """

    def serialize(self) -> bytes:
        """Serialize into a byte buffer.

        Returns:
            Byte buffer
        """
        string = self._get_format_string()
        vals = [x.value for x in astuple(self)]
        return struct.pack(string, *vals)

    @classmethod
    def build(cls, data: bytes) -> BinarySerializable:
        """Create a BinarySerializable from a byte buffer.

        Args:
            data: Byte buffer

        Returns:
            cls
        """
        b = struct.unpack(cls._get_format_string(), data)
        args = {v.name: v.type.build(b[i]) for i, v in enumerate(fields(cls))}
        # Mypy is not liking constructing the derived types.
        return cls(**args)  # type: ignore

    @classmethod
    def _get_format_string(cls) -> str:
        """Get the `struct` format string for this class.

        Returns:
            a string
        """
        format_string: str = getattr(cls, format_string_attribute, None)
        if format_string is None:
            dataclass_fields = fields(cls)
            try:
                format_string = (
                    f"{cls.ENDIAN}{''.join(v.type.FORMAT for v in dataclass_fields)}"
                )
            except AttributeError:
                raise InvalidFieldException(
                    f"All fields must be of type {BinaryFieldBase.__class__}"
                )

            # Cache it on the cls.
            setattr(cls, format_string_attribute, format_string)
        return format_string

    ENDIAN = ">"
    """The big endian format string"""


class LittleEndianMixIn:
    """Mix in to use with BinarySerializable to use little endian packing."""

    ENDIAN = "<"
    """The little endian format string"""


class LittleEndianBinarySerializable(LittleEndianMixIn, BinarySerializable):
    """Little endian binary serializable."""

    ...
