"""Payloads of can bus messages."""
from dataclasses import dataclass

from opentrons_hardware import utils


@dataclass
class EmptyMessage(utils.BinarySerializable):
    """An empty payload."""

    pass


@dataclass
class DeviceInfoResponseBody(utils.BinarySerializable):
    """Device info response."""

    node_id: utils.UInt8Field
    version: utils.UInt32Field


@dataclass
class GetStatusResponse(utils.BinarySerializable):
    """Get status response."""

    status: utils.UInt8Field
    data: utils.UInt32Field


@dataclass
class MoveRequest(utils.BinarySerializable):
    """Move request."""

    steps: utils.UInt32Field


@dataclass
class GetSpeedResponse(utils.BinarySerializable):
    """Get speed response."""

    mm_sec: utils.UInt32Field


@dataclass
class WriteToEEPromRequest(utils.BinarySerializable):
    """Write to eeprom request."""

    serial_number: utils.UInt8Field


@dataclass
class ReadFromEEPromResponse(utils.BinarySerializable):
    """Read from ee prom response."""

    serial_number: utils.UInt8Field


@dataclass
class MoveGroupRequest(utils.BinarySerializable):
    """"""
    group_id: utils.UInt8Field


@dataclass
class AddToMoveGroupRequest(MoveGroupRequest):
    """Base of add to move group request to a message group."""
    seq_id: utils.UInt8Field
    duration: utils.UInt32Field


@dataclass
class AddLinearMoveRequest(AddToMoveGroupRequest):
    """Add a linear move request to a message group."""
    acceleration: utils.Int32Field
    velocity: utils.Int32Field
    position: utils.UInt32Field


@dataclass
class GetMoveGroupResponse(utils.BinarySerializable):
    """"""
    num_moves: utils.UInt8Field
    total_duration: utils.UInt32Field


@dataclass
class ExecuteMoveGroupRequest(MoveGroupRequest):
    """"""
    start_trigger: utils.UInt8Field
    cancel_trigger: utils.UInt8Field


@dataclass
class MoveGroupComplete(MoveGroupRequest):
    """"""
    node_id: utils.UInt8Field
