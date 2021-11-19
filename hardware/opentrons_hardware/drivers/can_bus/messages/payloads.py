"""Payloads of can bus messages."""
from dataclasses import dataclass

from opentrons_hardware import utils


@dataclass
class ResponsePayload(utils.BinarySerializable):
    """A response payload."""

    node_id: utils.UInt8Field


@dataclass
class EmptyPayload(utils.BinarySerializable):
    """An empty payload."""

    pass


@dataclass
class DeviceInfoResponsePayload(ResponsePayload):
    """Device info response."""

    version: utils.UInt32Field


@dataclass
class GetStatusResponsePayload(ResponsePayload):
    """Get status response."""

    status: utils.UInt8Field
    data: utils.UInt32Field


@dataclass
class MoveRequestPayload(utils.BinarySerializable):
    """Move request."""

    steps: utils.UInt32Field


@dataclass
class GetSpeedResponsePayload(ResponsePayload):
    """Get speed response."""

    mm_sec: utils.UInt32Field


@dataclass
class WriteToEEPromRequestPayload(utils.BinarySerializable):
    """Write to eeprom request."""

    serial_number: utils.UInt8Field


@dataclass
class ReadFromEEPromResponsePayload(ResponsePayload):
    """Read from ee prom response."""

    serial_number: utils.UInt8Field


@dataclass
class MoveGroupRequestPayload(utils.BinarySerializable):
    """A payload with a group id."""

    group_id: utils.UInt8Field


@dataclass
class MoveGroupResponsePayload(ResponsePayload):
    """A response payload with a group id."""

    group_id: utils.UInt8Field


@dataclass
class AddToMoveGroupRequestPayload(MoveGroupRequestPayload):
    """Base of add to move group request to a message group."""

    seq_id: utils.UInt8Field
    duration: utils.UInt32Field


@dataclass
class AddLinearMoveRequestPayload(AddToMoveGroupRequestPayload):
    """Add a linear move request to a message group."""

    acceleration: utils.Int32Field
    velocity: utils.Int32Field


@dataclass
class GetMoveGroupResponsePayload(MoveGroupResponsePayload):
    """Response to request to get a move group."""

    num_moves: utils.UInt8Field
    total_duration: utils.UInt32Field


@dataclass
class ExecuteMoveGroupRequestPayload(MoveGroupRequestPayload):
    """Start executing a move group."""

    start_trigger: utils.UInt8Field
    cancel_trigger: utils.UInt8Field


@dataclass
class MoveCompletedPayload(MoveGroupResponsePayload):
    """Notification of a completed move group."""

    seq_id: utils.UInt8Field
    current_position: utils.UInt32Field
    ack_id: utils.UInt8Field


@dataclass
class MotorDriverRegisterPayload(utils.BinarySerializable):
    """Read motor driver register request payload."""

    reg_addr: utils.UInt8Field


@dataclass
class MotorDriverRegisterDataPayload(MotorDriverRegisterPayload):
    """Write motor driver register request payload."""

    data: utils.UInt32Field


@dataclass
class ReadMotorDriverRegisterResponsePayload(ResponsePayload):
    """Read motor driver register response payload."""

    reg_addr: utils.UInt8Field
    data: utils.UInt32Field