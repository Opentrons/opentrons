"""Defintion of CAN messages."""
from dataclasses import dataclass
from typing import Type

from typing_extensions import Literal

from opentrons_hardware.utils import BinarySerializable
from ..constants import MessageId
from . import payloads


@dataclass
class HeartbeatRequest:  # noqa: D101
    message_id: Literal[MessageId.heartbeat_request] = MessageId.heartbeat_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class HeartbeatResponse:  # noqa: D101
    message_id: Literal[MessageId.heartbeat_response] = MessageId.heartbeat_response
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class DeviceInfoRequest:  # noqa: D101
    message_id: Literal[MessageId.device_info_request] = MessageId.device_info_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class DeviceInfoResponse:  # noqa: D101
    message_id: Literal[MessageId.device_info_response] = MessageId.device_info_response
    payload_type: Type[BinarySerializable] = payloads.DeviceInfoResponseBody


@dataclass
class StopRequest:  # noqa: D101
    message_id: Literal[MessageId.stop_request] = MessageId.stop_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class GetStatusRequest:  # noqa: D101
    message_id: Literal[MessageId.get_status_request] = MessageId.get_status_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class EnableMotorRequest:  # noqa: D101
    message_id: Literal[MessageId.enable_motor_request] = MessageId.enable_motor_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class DisableMotorRequest:  # noqa: D101
    message_id: Literal[
        MessageId.disable_motor_request
    ] = MessageId.disable_motor_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class GetStatusResponse:  # noqa: D101
    message_id: Literal[MessageId.get_status_response] = MessageId.get_status_response
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class MoveRequest:  # noqa: D101
    message_id: Literal[MessageId.move_request] = MessageId.move_request
    payload_type: Type[BinarySerializable] = payloads.MoveRequest


@dataclass
class SetupRequest:  # noqa: D101
    message_id: Literal[MessageId.setup_request] = MessageId.setup_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class GetSpeedRequest:  # noqa: D101
    message_id: Literal[MessageId.get_speed_request] = MessageId.get_speed_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class GetSpeedResponse:  # noqa: D101
    message_id: Literal[MessageId.get_speed_response] = MessageId.get_speed_response
    payload_type: Type[BinarySerializable] = payloads.GetSpeedResponse


@dataclass
class WriteToEEPromRequest:  # noqa: D101
    message_id: Literal[MessageId.write_eeprom] = MessageId.write_eeprom
    payload_type: Type[BinarySerializable] = payloads.WriteToEEPromRequest


@dataclass
class ReadFromEEPromRequest:  # noqa: D101
    message_id: Literal[MessageId.read_eeprom_request] = MessageId.read_eeprom_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class ReadFromEEPromResponse:  # noqa: D101
    message_id: Literal[MessageId.read_eeprom_response] = MessageId.read_eeprom_response
    payload_type: Type[BinarySerializable] = payloads.ReadFromEEPromResponse


@dataclass
class AddLinearMoveRequest:
    message_id: Literal[MessageId.add_move_request] = MessageId.add_move_request
    payload_type: Type[BinarySerializable] = payloads.AddLinearMoveRequest


@dataclass
class GetMoveGroupRequest:
    messageId: Literal[MessageId.get_move_group_request] = MessageId.get_move_group_request
    payload_type: Type[BinarySerializable] = payloads.MoveGroupRequest


@dataclass
class GetMoveGroupResponse:
    messageId: Literal[MessageId.get_move_group_response] = MessageId.get_move_group_response
    payload_type: Type[BinarySerializable] = payloads.GetMoveGroupResponse


@dataclass
class ExecuteMoveGroupRequest:
    message_id: Literal[MessageId.execute_move_group_request] = MessageId.execute_move_group_request
    payload_type: Type[BinarySerializable] = payloads.MoveGroupRequest


@dataclass
class ClearMoveGroupRequest:
    message_id: Literal[
        MessageId.clear_move_group_request] = MessageId.clear_move_group_request
    payload_type: Type[BinarySerializable] = payloads.MoveGroupRequest


@dataclass
class MoveGroupCompleted:
    message_id: Literal[
        MessageId.move_group_completed] = MessageId.move_group_completed
    payload_type: Type[BinarySerializable] = payloads.MoveGroupComplete
