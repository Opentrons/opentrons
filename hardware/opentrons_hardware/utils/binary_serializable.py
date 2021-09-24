from __future__ import annotations
import struct
from dataclasses import dataclass, fields, field, astuple
from functools import partial
from typing_extensions import TypedDict, Final

format_string_attribute: Final = "__struct_format_string__"


class FieldMetaData(TypedDict):
    format: str


ulong = FieldMetaData(format="L")
long = FieldMetaData(format="l")
ushort = FieldMetaData(format="H")
short = FieldMetaData(format="h")
ubyte = FieldMetaData(format="B")
byte = FieldMetaData(format="b")


ulong_field = partial(field, metadata=ulong)
long_field = partial(field, metadata=long)
ushort_field = partial(field, metadata=ushort)
short_field = partial(field, metadata=short)
ubyte_field = partial(field, metadata=ubyte)
byte_field = partial(field, metadata=byte)


@dataclass
class BinarySerializable:
    """Base class of a dataclass that can be serialized/desiarilized into bytes.

    Each field must have the FieldMetaData metadata value defining the format string
    used by `struct` package to pack/unpack the field.

    Data will be packed big endian.
    """

    def serialize(self) -> bytes:
        """
        Serialize into a byte buffer.

        Returns:
            Byte buffer
        """
        vals = [x for x in astuple(self)]
        return struct.pack(self._get_format_string(), *vals)

    @classmethod
    def build(cls, data: bytes) -> BinarySerializable:
        """
        Create a BinarySerializable from a byte buffer.

        Args:
            data: Byte buffer

        Returns:
            cls
        """
        b = struct.unpack(cls._get_format_string(), data)
        args = {v.name: b[i] for i, v in enumerate(fields(cls))}
        return cls(**args)

    @classmethod
    def _get_format_string(cls) -> str:
        """
        Get the `struct` format string for this class.

        Returns:
            a string
        """
        format_string: str = getattr(cls, format_string_attribute, None)
        if format_string is None:
            dataclass_fields = fields(cls)
            format_string = (
                f"{cls.ENDIAN}{''.join(v.metadata['format'] for v in dataclass_fields)}"
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
    """Little endian binary serializable"""

    ...
