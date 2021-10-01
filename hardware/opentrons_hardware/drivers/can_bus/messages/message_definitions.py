"""Defintion of CAN messages."""
from dataclasses import dataclass
from typing import TypeVar, Generic, Type

from typing_extensions import Literal

from opentrons_hardware.utils import BinarySerializable
from ..constants import MessageId
from . import payloads


@dataclass
class HeartbeatRequest:
    message_id: Literal[MessageId.heartbeat_request] = MessageId.heartbeat_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class HeartbeatResponse:
    message_id: Literal[MessageId.heartbeat_response] = MessageId.heartbeat_response
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class DeviceInfoRequest:
    message_id: Literal[MessageId.device_info_request] = MessageId.device_info_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class DeviceInfoResponse:
    message_id: Literal[MessageId.device_info_response] = MessageId.device_info_response
    payload_type: Type[BinarySerializable] = payloads.DeviceInfoResponseBody


@dataclass
class StopRequest:
    message_id: Literal[MessageId.stop_request] = MessageId.stop_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class GetStatusRequest:
    message_id: Literal[MessageId.get_status_request] = MessageId.get_status_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class GetStatusResponse:
    message_id: Literal[MessageId.get_status_response] = MessageId.get_status_response
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class MoveRequest:
    message_id: Literal[MessageId.move_request] = MessageId.move_request
    payload_type: Type[BinarySerializable] = payloads.MoveRequest


@dataclass
class SetupRequest:
    message_id: Literal[MessageId.setup_request] = MessageId.setup_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class GetSpeedRequest:
    message_id: Literal[MessageId.get_speed_request] = MessageId.get_speed_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class GetSpeedResponse:
    message_id: Literal[MessageId.get_speed_response] = MessageId.get_speed_response
    payload_type: Type[BinarySerializable] = payloads.GetSpeedResponse


@dataclass
class WriteToEEPromRequest:
    message_id: Literal[MessageId.write_eeprom] = MessageId.write_eeprom
    payload_type: Type[BinarySerializable] = payloads.WriteToEEPromRequest


@dataclass
class ReadFromEEPromRequest:
    message_id: Literal[MessageId.read_eeprom_request] = MessageId.read_eeprom_request
    payload_type: Type[BinarySerializable] = payloads.EmptyMessage


@dataclass
class ReadFromEEPromResponse:
    message_id: Literal[MessageId.read_eeprom_response] = MessageId.read_eeprom_response
    payload_type: Type[BinarySerializable] = payloads.ReadFromEEPromResponse
