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
    """A payload with a group id."""

    group_id: utils.UInt8Field


@dataclass
class AddToMoveGroupRequest(MoveGroupRequest):
    """Base of add to move group request to a message group."""

    seq_id: utils.UInt8Field
    # TODO (al, 2021-10-2021): this should be 32 bits
    duration: utils.UInt16Field


@dataclass
class AddLinearMoveRequest(AddToMoveGroupRequest):
    """Add a linear move request to a message group."""

    # TODO (al, 2021-10-2021): this should be 32 bits
    acceleration: utils.Int16Field
    # TODO (al, 2021-10-2021): this should be 32 bits
    velocity: utils.Int16Field
    # TODO (al, 2021-10-2021): this should be present and 32 bits
    # position: utils.UInt32Field


@dataclass
class GetMoveGroupResponse(MoveGroupRequest):
    """Response to request to get a move group."""

    num_moves: utils.UInt8Field
    total_duration: utils.UInt32Field
    node_id: utils.UInt8Field


@dataclass
class ExecuteMoveGroupRequest(MoveGroupRequest):
    """Start executing a move group."""

    start_trigger: utils.UInt8Field
    cancel_trigger: utils.UInt8Field


@dataclass
class MoveGroupCompleted(MoveGroupRequest):
    """Notification of a completed move group."""

    node_id: utils.UInt8Field


@dataclass
class MoveCompleted(MoveGroupRequest):
    """Notification of a completed move group."""
    seq_id: utils.UInt8Field
    ack_id: utils.UInt8Field
    node_id: utils.UInt8Field
