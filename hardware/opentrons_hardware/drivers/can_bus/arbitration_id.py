"""Can bus arbitration id."""
from __future__ import annotations
from enum import Enum
import ctypes


class ArbitrationIdParts(ctypes.Structure):
    """A bit field of the arbitration id parts."""

    _fields_ = (
        ("function_code", ctypes.c_uint, 7),
        ("node_id", ctypes.c_uint, 8),
        ("message_id", ctypes.c_uint, 14),
        ("padding", ctypes.c_uint, 3),
    )

    def __eq__(self, other: object) -> bool:
        """Check equality."""
        if isinstance(other, ArbitrationIdParts):
            return bool(
                other.function_code == self.function_code
                and other.node_id == self.node_id
                and other.message_id == self.message_id
            )
        return False

    def __repr__(self) -> str:
        """Return string representation of class."""
        return (
            f"function_code: 0x{self.function_code:x}, "
            f"node_id: 0x{self.node_id:x}, "
            f"message_id: 0x{self.message_id:x}"
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


class NodeId(int, Enum):
    """Can bus arbitration id node id."""

    broadcast = 0x00
    host = 0x10
    pipette = 0x20
    gantry = 0x40


class FunctionCode(int, Enum):
    """Can bus arbitration id function code."""

    network_management = 0x0


class MessageId(int, Enum):
    """Can bus arbitration id message id."""

    device_info_request = 0x3002
    device_info_response = 0x3003
