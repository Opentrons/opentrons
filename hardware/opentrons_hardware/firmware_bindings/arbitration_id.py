"""Can bus arbitration id.

This file is used as a source for code generation, which does not run in a venv by
default. Please do not unconditionally import things outside the python standard
library.
"""
from __future__ import annotations
import ctypes
from enum import Enum
from typing import TYPE_CHECKING, Type

from opentrons_hardware.firmware_bindings.constants import (
    FunctionCode,
    NodeId,
    MessageId,
)

if TYPE_CHECKING:
    from typing_extensions import Final

NODE_ID_BITS: Final[int] = 7
FUNCTION_CODE_BITS: Final[int] = 4
MESSAGE_ID_BITS: Final[int] = 11


class ArbitrationIdParts(ctypes.Structure):
    """A bit field of the arbitration id parts."""

    _fields_ = (
        ("function_code", ctypes.c_uint, FUNCTION_CODE_BITS),
        ("node_id", ctypes.c_uint, NODE_ID_BITS),
        ("originating_node_id", ctypes.c_uint, NODE_ID_BITS),
        ("message_id", ctypes.c_uint, MESSAGE_ID_BITS),
        ("padding", ctypes.c_uint, 3),
    )

    def __eq__(self, other: object) -> bool:
        """Check equality."""
        if isinstance(other, ArbitrationIdParts):
            return bool(
                other.function_code == self.function_code
                and other.node_id == self.node_id
                and other.originating_node_id == self.originating_node_id
                and other.message_id == self.message_id
            )
        return False

    def __repr__(self) -> str:
        """Return string representation of class."""

        def _safe_to_str(enum_type: Type[Enum], val: int) -> str:
            """Safely convert enum to string."""
            try:
                return enum_type(val).name
            except ValueError:
                return f"0x{val:x}"

        return (
            f"function_code: {_safe_to_str(FunctionCode, self.function_code)}, "
            f"node_id: {_safe_to_str(NodeId, self.node_id)}, "
            f"originating_node_id: {_safe_to_str(NodeId, self.originating_node_id)}, "
            f"message_id: {_safe_to_str(MessageId, self.message_id)}"
        )


class ArbitrationId(ctypes.Union):
    """Arbitration id union."""

    _fields_ = (
        ("parts", ArbitrationIdParts),
        ("id", ctypes.c_uint32),
    )

    def __eq__(self, other: object) -> bool:
        """Check equality."""
        if isinstance(other, ArbitrationId):
            return bool(other.id == self.id)
        return False

    def __repr__(self) -> str:
        """Return string representation of class."""
        return f"id: 0x{self.id:x}, " f"parts: {self.parts}"
