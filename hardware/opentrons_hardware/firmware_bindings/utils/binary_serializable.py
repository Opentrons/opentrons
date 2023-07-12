"""BinarySerializable dataclass."""

from __future__ import annotations
import struct
from dataclasses import dataclass, fields, astuple
from typing import TypeVar, Generic, Type, Optional, Dict, Any, Sequence

from opentrons_shared_data.errors.exceptions import (
    InternalMessageFormatError,
    EnumeratedError,
    PythonException,
)


class BinarySerializableException(InternalMessageFormatError):
    """Exception."""

    def __init__(
        self,
        message: Optional[str] = None,
        detail: Optional[Dict[str, Any]] = None,
        wrapping: Optional[Sequence[EnumeratedError]] = None,
    ) -> None:
        """Build a BinarySerializableException."""
        submessage = f": {message}" if message else ""
        super().__init__(
            f"Could not create message object{submessage}",
            detail=detail,
            wrapping=wrapping,
        )


class InvalidFieldException(BinarySerializableException):
    """Field is wrong type."""

    def __init__(self, message: str, intended_bytes: bytes, exc: BaseException) -> None:
        """Build an InvalidFieldException."""
        super().__init__(
            message=message,
            detail={
                "data": repr(intended_bytes),
            },
            wrapping=[PythonException(exc)],
        )


class SerializationException(BinarySerializableException):
    """Serialization error."""

    def __init__(self, exc: BaseException) -> None:
        """Build a SerializationException."""
        super().__init__("Serialization failed", wrapping=[PythonException(exc)])


T = TypeVar("T")


class BinaryFieldBase(Generic[T]):
    """Binary serializable field."""

    This = TypeVar("This", bound="BinaryFieldBase[T]")
    FORMAT = ""
    """The struct format string for this field."""

    def __init__(self, t: T) -> None:
        """Constructor."""
        self._t = t

    @classmethod
    def build(cls: Type[This], t: T) -> This:
        """Factory method.

        Args:
            t: The value.

        Returns:
            New instance.
        """
        return cls(t)

    @classmethod
    def from_string(cls: Type[This], t: str) -> This:
        """Create from a string.

        Args:
            t: The value as a string.

        Returns:
            New instance.
        """
        ...

    @property
    def value(self) -> T:
        """The value."""
        return self._t

    @value.setter
    def value(self, val: T) -> None:
        """Set the value."""
        self._t = val

    def __eq__(self, other: object) -> bool:
        """Comparison."""
        return isinstance(other, BinaryFieldBase) and other.value == self.value

    def __repr__(self) -> str:
        """Representation string."""
        return f"{self.__class__.__name__}(value={repr(self.value)})"


class IntFieldBase(BinaryFieldBase[int]):
    """Base class of integer fields."""

    @classmethod
    def from_string(cls, t: str) -> IntFieldBase:
        """Create from string."""
        return cls(int(t))


class UInt64Field(IntFieldBase):
    """Unsigned 64-bit integer field."""

    FORMAT = "Q"


class Int64Field(IntFieldBase):
    """Signed 64-bit integer field."""

    FORMAT = "q"


class UInt32Field(IntFieldBase):
    """Unsigned 32-bit integer field."""

    FORMAT = "L"


class Int32Field(IntFieldBase):
    """Signed 32-bit integer field."""

    FORMAT = "l"


class UInt16Field(IntFieldBase):
    """Unsigned 16-bit integer field."""

    FORMAT = "H"


class Int16Field(IntFieldBase):
    """Signed 16-bit integer field."""

    FORMAT = "h"


class UInt8Field(IntFieldBase):
    """Unsigned 8-bit integer field."""

    FORMAT = "B"


class Int8Field(IntFieldBase):
    """Signed 8-bit integer field."""

    FORMAT = "b"


@dataclass
class BinarySerializable:
    """Base class of a dataclass that can be serialized/deserialized into bytes.

    Each field must have the FieldMetaData metadata value defining the format string
    used by `struct` package to pack/unpack the field.

    Data will be packed big endian.
    """

    ENDIAN = ">"
    """The big endian format string"""

    def serialize(self) -> bytes:
        """Serialize into a byte buffer.

        Returns:
            Byte buffer
        """
        string = self._get_format_string()
        vals = [x.value for x in astuple(self)]
        try:
            return struct.pack(string, *vals)
        except struct.error as e:
            raise SerializationException(e)

    @classmethod
    def build(cls, data: bytes) -> BinarySerializable:
        """Create a BinarySerializable from a byte buffer.

        The byte buffer must be at least enough bytes to satisfy all fields.

        Extra bytes will be ignored. This is for two reasons:
            - CANFD requires padding to round byte lengths to fixed sizes.
            - To accommodate extracting multiple  BinarySerializable objects
            from a stream of bytes.

        Args:
            data: Byte buffer

        Returns:
            cls
        """
        try:
            format_string = cls._get_format_string()
            size = cls.get_size()
            # ignore bytes beyond the size of message.
            b = struct.unpack(format_string, data[:size])
            # we have to do message index special until we update to python 3.10 since we can't make it a kw_only arg
            # 3.10 has an updated dataclass field option that will make this go away, see payloads.py
            args = {
                v.name: v.type.build(b[i])
                for i, v in enumerate(fields(cls))
                if not (v.name == "message_index")
            }
            message_index = next(
                (
                    v.type.build(b[i])
                    for i, v in enumerate(fields(cls))
                    if v.name == "message_index"
                ),
                None,
            )
            # Mypy is not liking constructing the derived types.
            ret_instance = cls(**args)  # type: ignore[call-arg]
            if message_index is not None:
                ret_instance.message_index = message_index  # type: ignore[attr-defined]
            return ret_instance
        except struct.error as e:
            raise InvalidFieldException("Bad data for field", data, e)

    @classmethod
    def _get_format_string(cls) -> str:
        """Get the `struct` format string for this class.

        Returns:
            a string
        """
        dataclass_fields = fields(cls)
        try:
            format_string = (
                f"{cls.ENDIAN}{''.join(v.type.FORMAT for v in dataclass_fields)}"
            )
        except AttributeError as e:
            raise InvalidFieldException(
                "All fields must be of type BinaryFieldBase", b"", e
            )

        return format_string

    @classmethod
    def get_size(cls) -> int:
        """Get the size of the serializable in bytes."""
        return struct.calcsize(cls._get_format_string())


class LittleEndianMixIn:
    """Mix in to use with BinarySerializable to use little endian packing."""

    ENDIAN = "<"
    """The little endian format string"""


class LittleEndianBinarySerializable(LittleEndianMixIn, BinarySerializable):
    """Little endian binary serializable."""

    ...
