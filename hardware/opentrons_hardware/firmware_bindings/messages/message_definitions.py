"""Definition of CAN messages."""
from dataclasses import dataclass
from typing import Type

from typing_extensions import Literal

from ..utils import BinarySerializable
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
    payload: payloads.ExecuteMoveGroupRequestPayload
    payload_type: Type[BinarySerializable] = payloads.ExecuteMoveGroupRequestPayload
    message_id: Literal[
        MessageId.execute_move_group_request
    ] = MessageId.execute_move_group_request


@dataclass
class ClearAllMoveGroupsRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[
        MessageId.clear_all_move_groups_request
    ] = MessageId.clear_all_move_groups_request


@dataclass
class MoveCompleted:  # noqa: D101
    payload: payloads.MoveCompletedPayload
    payload_type: Type[BinarySerializable] = payloads.MoveCompletedPayload
    message_id: Literal[MessageId.move_completed] = MessageId.move_completed


@dataclass
class SetMotionConstraints:  # noqa: D101
    payload: payloads.MotionConstraintsPayload
    payload_type: Type[BinarySerializable] = payloads.MotionConstraintsPayload
    message_id: Literal[
        MessageId.set_motion_constraints
    ] = MessageId.set_motion_constraints


@dataclass
class GetMotionConstraintsRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[
        MessageId.get_motion_constraints_request
    ] = MessageId.get_motion_constraints_request


@dataclass
class GetMotionConstraintsResponse:  # noqa: D101
    payload: payloads.MotionConstraintsPayload
    payload_type: Type[BinarySerializable] = payloads.MotionConstraintsPayload
    message_id: Literal[
        MessageId.get_motion_constraints_response
    ] = MessageId.get_motion_constraints_response


@dataclass
class WriteMotorDriverRegister:  # noqa: D101
    payload: payloads.MotorDriverRegisterDataPayload
    payload_type: Type[BinarySerializable] = payloads.MotorDriverRegisterDataPayload
    message_id: Literal[
        MessageId.write_motor_driver_register_request
    ] = MessageId.write_motor_driver_register_request


@dataclass
class ReadMotorDriverRequest:  # noqa: D101
    payload: payloads.MotorDriverRegisterPayload
    payload_type: Type[BinarySerializable] = payloads.MotorDriverRegisterPayload
    message_id: Literal[
        MessageId.read_motor_driver_register_request
    ] = MessageId.read_motor_driver_register_request


@dataclass
class ReadMotorDriverResponse:  # noqa: D101
    payload: payloads.ReadMotorDriverRegisterResponsePayload
    payload_type: Type[
        BinarySerializable
    ] = payloads.ReadMotorDriverRegisterResponsePayload
    message_id: Literal[
        MessageId.read_motor_driver_register_response
    ] = MessageId.read_motor_driver_register_response


@dataclass
class ReadPresenceSensingVoltageRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[
        MessageId.read_presence_sensing_voltage_request
    ] = MessageId.read_presence_sensing_voltage_request


@dataclass
class ReadPresenceSensingVoltageResponse:  # noqa: D101
    payload: payloads.ReadPresenceSensingVoltageResponsePayload
    payload_type: Type[
        BinarySerializable
    ] = payloads.ReadPresenceSensingVoltageResponsePayload
    message_id: Literal[
        MessageId.read_presence_sensing_voltage_response
    ] = MessageId.read_presence_sensing_voltage_response


@dataclass
class PushToolsDetectedNotification:  # noqa: D101
    payload: payloads.ToolsDetectedNotificationPayload
    payload_type: Type[BinarySerializable] = payloads.ToolsDetectedNotificationPayload
    message_id: Literal[
        MessageId.tools_detected_notification
    ] = MessageId.tools_detected_notification


@dataclass
class AttachedToolsRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[
        MessageId.attached_tools_request
    ] = MessageId.attached_tools_request


@dataclass
class FirmwareUpdateInitiate:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[MessageId.fw_update_initiate] = MessageId.fw_update_initiate


@dataclass
class FirmwareUpdateData:  # noqa: D101
    payload: payloads.FirmwareUpdateData
    payload_type: Type[BinarySerializable] = payloads.FirmwareUpdateData
    message_id: Literal[MessageId.fw_update_data] = MessageId.fw_update_data


@dataclass
class FirmwareUpdateDataAcknowledge:  # noqa: D101
    payload: payloads.FirmwareUpdateDataAcknowledge
    payload_type: Type[BinarySerializable] = payloads.FirmwareUpdateDataAcknowledge
    message_id: Literal[MessageId.fw_update_data_ack] = MessageId.fw_update_data_ack


@dataclass
class FirmwareUpdateComplete:  # noqa: D101
    payload: payloads.FirmwareUpdateComplete
    payload_type: Type[BinarySerializable] = payloads.FirmwareUpdateComplete
    message_id: Literal[MessageId.fw_update_complete] = MessageId.fw_update_complete


@dataclass
class FirmwareUpdateCompleteAcknowledge:  # noqa: D101
    payload: payloads.FirmwareUpdateCompleteAcknowledge
    payload_type: Type[BinarySerializable] = payloads.FirmwareUpdateCompleteAcknowledge
    message_id: Literal[
        MessageId.fw_update_complete_ack
    ] = MessageId.fw_update_complete_ack


@dataclass
class FirmwareUpdateStatusRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[
        MessageId.fw_update_status_request
    ] = MessageId.fw_update_status_request


@dataclass
class FirmwareUpdateStatusResponse:  # noqa: D101
    payload: payloads.FirmwareUpdateStatus
    payload_type: Type[BinarySerializable] = payloads.FirmwareUpdateStatus
    message_id: Literal[
        MessageId.fw_update_status_response
    ] = MessageId.fw_update_status_response


@dataclass
class FirmwareUpdateStartApp:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[MessageId.fw_update_start_app] = MessageId.fw_update_start_app


@dataclass
class ReadLimitSwitchRequest:  # noqa: D101
    payload: payloads.EmptyPayload
    payload_type: Type[BinarySerializable] = payloads.EmptyPayload
    message_id: Literal[MessageId.limit_sw_request] = MessageId.limit_sw_request


@dataclass
class ReadLimitSwitchResponse:  # noqa: D101
    payload: payloads.GetLimitSwitchResponse
    payload_type: Type[BinarySerializable] = payloads.GetLimitSwitchResponse
    message_id: Literal[MessageId.limit_sw_response] = MessageId.limit_sw_response


@dataclass
class ReadFromSensorRequest:  # noqa: D101
    payload: payloads.ReadFromSensorRequest
    payload_type: Type[BinarySerializable] = payloads.ReadFromSensorRequest
    message_id: Literal[MessageId.read_sensor_request] = MessageId.read_sensor_request


@dataclass
class WriteToSensorRequest:  # noqa: D101
    payload: payloads.WriteToSensorRequest
    payload_type: Type[BinarySerializable] = payloads.WriteToSensorRequest
    message_id: Literal[MessageId.write_sensor_request] = MessageId.write_sensor_request


@dataclass
class BaselineSensorRequest:  # noqa: D101
    payload: payloads.BaselineSensorRequest
    payload_type: Type[BinarySerializable] = payloads.BaselineSensorRequest
    message_id: Literal[
        MessageId.baseline_sensor_request
    ] = MessageId.baseline_sensor_request


@dataclass
class ReadFromSensorResponse:  # noqa: D101
    payload: payloads.ReadFromSensorResponse
    payload_type: Type[BinarySerializable] = payloads.ReadFromSensorResponse
    message_id: Literal[MessageId.read_sensor_response] = MessageId.read_sensor_response


@dataclass
class SetSensorThresholdRequest:  # noqa: D101
    payload: payloads.SetSensorThresholdRequest
    payload_type: Type[BinarySerializable] = payloads.SetSensorThresholdRequest
    message_id: Literal[
        MessageId.set_sensor_threshold_request
    ] = MessageId.set_sensor_threshold_request


@dataclass
class SensorThresholdResponse:  # noqa: D101
    payload: payloads.SensorThresholdResponse
    payload_type: Type[BinarySerializable] = payloads.SensorThresholdResponse
    message_id: Literal[
        MessageId.set_sensor_threshold_response
    ] = MessageId.set_sensor_threshold_response
