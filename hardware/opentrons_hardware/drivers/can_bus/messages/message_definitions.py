"""Definition of CAN messages."""
from dataclasses import dataclass
from typing import Type

from typing_extensions import Literal

from opentrons_hardware.utils import BinarySerializable
from ..constants import MessageId
from . import payloads


@dataclass
class HeartbeatRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[MessageId.heartbeat_request] = MessageId.heartbeat_request


@dataclass
class HeartbeatResponse:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[MessageId.heartbeat_response] = MessageId.heartbeat_response


@dataclass
class DeviceInfoRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[MessageId.device_info_request] = MessageId.device_info_request


@dataclass
class DeviceInfoResponse:  # noqa: D101
    payload: payloads.DeviceInfoResponsePayload
    payload_type: Type[BinarySerializable] = payloads.DeviceInfoResponsePayload
    message_id: Literal[MessageId.device_info_response] = MessageId.device_info_response


@dataclass
class StopRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[MessageId.stop_request] = MessageId.stop_request


@dataclass
class GetStatusRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[MessageId.get_status_request] = MessageId.get_status_request


@dataclass
class EnableMotorRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[MessageId.enable_motor_request] = MessageId.enable_motor_request


@dataclass
class DisableMotorRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[
        MessageId.disable_motor_request
    ] = MessageId.disable_motor_request


@dataclass
class GetStatusResponse:  # noqa: D101
    payload: payloads.GetStatusResponsePayload
    payload_type: Type[BinarySerializable] = payloads.GetStatusResponsePayload
    message_id: Literal[MessageId.get_status_response] = MessageId.get_status_response


@dataclass
class MoveRequest:  # noqa: D101
    payload: payloads.MoveRequestPayload
    payload_type: Type[BinarySerializable] = payloads.MoveRequestPayload
    message_id: Literal[MessageId.move_request] = MessageId.move_request


@dataclass
class SetupRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[MessageId.setup_request] = MessageId.setup_request


@dataclass
class GetSpeedRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[MessageId.get_speed_request] = MessageId.get_speed_request


@dataclass
class GetSpeedResponse:  # noqa: D101
    payload: payloads.GetSpeedResponsePayload
    payload_type: Type[BinarySerializable] = payloads.GetSpeedResponsePayload
    message_id: Literal[MessageId.get_speed_response] = MessageId.get_speed_response


@dataclass
class WriteToEEPromRequest:  # noqa: D101
    payload: payloads.WriteToEEPromRequestPayload
    payload_type: Type[BinarySerializable] = payloads.WriteToEEPromRequestPayload
    message_id: Literal[MessageId.write_eeprom] = MessageId.write_eeprom


@dataclass
class ReadFromEEPromRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[MessageId.read_eeprom_request] = MessageId.read_eeprom_request


@dataclass
class ReadFromEEPromResponse:  # noqa: D101
    payload: payloads.ReadFromEEPromResponsePayload
    payload_type: Type[BinarySerializable] = payloads.ReadFromEEPromResponsePayload
    message_id: Literal[MessageId.read_eeprom_response] = MessageId.read_eeprom_response


@dataclass
class AddLinearMoveRequest:  # noqa: D101
    payload: payloads.AddLinearMoveRequestPayload
    payload_type: Type[BinarySerializable] = payloads.AddLinearMoveRequestPayload
    message_id: Literal[MessageId.add_move_request] = MessageId.add_move_request


@dataclass
class GetMoveGroupRequest:  # noqa: D101
    payload: payloads.MoveGroupRequestPayload
    payload_type: Type[BinarySerializable] = payloads.MoveGroupRequestPayload
    message_id: Literal[
        MessageId.get_move_group_request
    ] = MessageId.get_move_group_request


@dataclass
class GetMoveGroupResponse:  # noqa: D101
    payload: payloads.GetMoveGroupResponsePayload
    payload_type: Type[BinarySerializable] = payloads.GetMoveGroupResponsePayload
    message_id: Literal[
        MessageId.get_move_group_response
    ] = MessageId.get_move_group_response


@dataclass
class ExecuteMoveGroupRequest:  # noqa: D101
    payload: payloads.MoveGroupRequestPayload
    payload_type: Type[BinarySerializable] = payloads.MoveGroupRequestPayload
    message_id: Literal[
        MessageId.execute_move_group_request
    ] = MessageId.execute_move_group_request


@dataclass
class ClearMoveGroupRequest:  # noqa: D101
    payload: payloads.MoveGroupRequestPayload
    payload_type: Type[BinarySerializable] = payloads.MoveGroupRequestPayload
    message_id: Literal[
        MessageId.clear_move_group_request
    ] = MessageId.clear_move_group_request


@dataclass
class MoveGroupCompleted:  # noqa: D101
    payload: payloads.MoveGroupCompletedPayload
    payload_type: Type[BinarySerializable] = payloads.MoveGroupCompletedPayload
    message_id: Literal[MessageId.move_group_completed] = MessageId.move_group_completed


@dataclass
class MoveCompleted:  # noqa: D101
    payload: payloads.MoveCompletedPayload
    payload_type: Type[BinarySerializable] = payloads.MoveCompletedPayload
    message_id: Literal[MessageId.move_completed] = MessageId.move_completed


@dataclass
class GetMoveStatusRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[
        MessageId.get_move_status_request
    ] = MessageId.get_move_status_request


@dataclass
class GetMoveStatusResponse:  # noqa: D101
    payload: payloads.GetMoveStatusResponsePayload
    payload_type: Type[BinarySerializable] = payloads.GetMoveStatusResponsePayload
    message_id: Literal[
        MessageId.get_move_status_response
    ] = MessageId.get_move_status_response
