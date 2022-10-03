"""Payloads of can bus messages."""
# TODO (amit, 2022-01-26): Figure out why using annotations import ruins
#  dataclass fields interpretation.
#  from __future__ import annotations
from dataclasses import dataclass

from .fields import (
    FirmwareShortSHADataField,
    VersionFlagsField,
    TaskNameDataField,
    ToolField,
    FirmwareUpdateDataField,
    ErrorCodeField,
    SensorTypeField,
    SensorIdField,
    PipetteNameField,
    SensorOutputBindingField,
    EepromDataField,
    SerialField,
    SerialDataCodeField,
    SensorThresholdModeField,
    PipetteTipActionTypeField,
)
from .. import utils


@dataclass
class EmptyPayload(utils.BinarySerializable):
    """An empty payload."""
    message_index = 0


@dataclass
class DeviceInfoResponsePayload(EmptyPayload):
    """Device info response."""

    version: utils.UInt32Field
    flags: VersionFlagsField
    shortsha: FirmwareShortSHADataField


@dataclass
class TaskInfoResponsePayload(EmptyPayload):
    """Task info response payload."""

    name: TaskNameDataField
    runtime_counter: utils.UInt32Field
    stack_high_water_mark: utils.UInt32Field
    state: utils.UInt16Field
    priority: utils.UInt16Field


@dataclass
class GetStatusResponsePayload(EmptyPayload):
    """Get status response."""

    status: utils.UInt8Field
    data: utils.UInt32Field


@dataclass
class MoveRequestPayload(EmptyPayload):
    """Move request."""

    steps: utils.UInt32Field


@dataclass
class GetSpeedResponsePayload(EmptyPayload):
    """Get speed response."""

    mm_sec: utils.UInt32Field


@dataclass
class EEPromReadPayload(EmptyPayload):
    """Eeprom read request payload ."""

    address: utils.UInt16Field
    data_length: utils.UInt16Field


@dataclass
class EEPromDataPayload(EEPromReadPayload):
    """Eeprom payload with data."""

    data: EepromDataField


@dataclass
class MoveGroupRequestPayload(EmptyPayload):
    """A payload with a group id."""

    group_id: utils.UInt8Field


@dataclass
class MoveGroupResponsePayload(EmptyPayload):
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
    request_stop_condition: utils.UInt8Field


@dataclass
class HomeRequestPayload(AddToMoveGroupRequestPayload):
    """Request to home."""

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
    current_position_um: utils.UInt32Field
    encoder_position_um: utils.Int32Field
    ack_id: utils.UInt8Field


@dataclass
class EncoderPositionResponse(EmptyPayload):
    """Read Encoder Position."""

    encoder_position: utils.Int32Field


@dataclass
class MotionConstraintsPayload(EmptyPayload):
    """The min and max velocity and acceleration of a motion system."""

    min_velocity: utils.Int32Field
    max_velocity: utils.Int32Field
    min_acceleration: utils.Int32Field
    max_acceleration: utils.Int32Field


@dataclass
class MotorDriverRegisterPayload(EmptyPayload):
    """Read motor driver register request payload."""

    reg_addr: utils.UInt8Field


@dataclass
class MotorDriverRegisterDataPayload(MotorDriverRegisterPayload):
    """Write motor driver register request payload."""

    data: utils.UInt32Field


@dataclass
class ReadMotorDriverRegisterResponsePayload(EmptyPayload):
    """Read motor driver register response payload."""

    reg_addr: utils.UInt8Field
    data: utils.UInt32Field


@dataclass
class MotorCurrentPayload(EmptyPayload):
    """Read motor current register payload."""

    # All values in milliAmps
    hold_current: utils.UInt32Field
    run_current: utils.UInt32Field


@dataclass
class ReadPresenceSensingVoltageResponsePayload(EmptyPayload):
    """Read head presence sensing voltage response payload."""

    # All values in millivolts
    z_motor: utils.UInt16Field
    a_motor: utils.UInt16Field
    gripper: utils.UInt16Field


@dataclass
class ToolsDetectedNotificationPayload(EmptyPayload):
    """Tool detection notification."""

    # Tools are mapped to an enum
    z_motor: ToolField
    a_motor: ToolField
    gripper: ToolField


@dataclass
class FirmwareUpdateWithAddress(EmptyPayload):
    """A FW update payload with an address."""

    address: utils.UInt32Field


@dataclass
class FirmwareUpdateData(FirmwareUpdateWithAddress):
    """A FW update data payload."""

    num_bytes: utils.UInt8Field
    reserved: utils.UInt8Field
    data: FirmwareUpdateDataField
    checksum: utils.UInt16Field

    def __post_init__(self) -> None:
        """Post init processing."""
        data_length = len(self.data.value)
        if data_length > FirmwareUpdateDataField.NUM_BYTES:
            raise ValueError(
                f"Data cannot be more than"
                f" {FirmwareUpdateDataField.NUM_BYTES} bytes."
            )

    @classmethod
    def create(cls, address: int, data: bytes) -> "FirmwareUpdateData":
        """Create a firmware update data payload."""
        checksum = 0
        obj = FirmwareUpdateData(
            address=utils.UInt32Field(address),
            num_bytes=utils.UInt8Field(len(data)),
            reserved=utils.UInt8Field(0),
            data=FirmwareUpdateDataField(data),
            checksum=utils.UInt16Field(checksum),
        )
        checksum = (1 + ~sum(obj.serialize())) & 0xFFFF
        obj.checksum.value = checksum
        return obj


@dataclass
class FirmwareUpdateDataAcknowledge(FirmwareUpdateWithAddress):
    """A FW update data acknowledge payload."""

    error_code: ErrorCodeField


@dataclass
class FirmwareUpdateComplete(EmptyPayload):
    """All data messages have been transmitted."""

    num_messages: utils.UInt32Field
    crc32: utils.UInt32Field


@dataclass
class FirmwareUpdateAcknowledge(EmptyPayload):
    """A response to a firmware update message with an error code."""

    error_code: ErrorCodeField


@dataclass
class FirmwareUpdateStatus(EmptyPayload):
    """A response to the FirmwareUpdateStatusRequest message."""

    flags: utils.UInt32Field


@dataclass
class GetLimitSwitchResponse(EmptyPayload):
    """A response to the Limit Switch Status request payload."""

    switch_status: utils.UInt8Field


@dataclass
class SensorPayload(EmptyPayload):
    """Take a single reading from a sensor request payload."""

    sensor: SensorTypeField
    sensor_id: SensorIdField


@dataclass
class ReadFromSensorRequestPayload(SensorPayload):
    """Take a single reading from a sensor request payload."""

    offset_reading: utils.UInt8Field


@dataclass
class WriteToSensorRequestPayload(SensorPayload):
    """Write a piece of data to a sensor request payload."""

    data: utils.UInt32Field
    reg_address: utils.UInt8Field


@dataclass
class BaselineSensorRequestPayload(SensorPayload):
    """Take a specified amount of readings from a sensor request payload."""

    sample_rate: utils.UInt16Field


@dataclass
class ReadFromSensorResponsePayload(SensorPayload):
    """A response for either a single reading or an averaged reading of a sensor."""

    sensor_data: utils.Int32Field


@dataclass
class SetSensorThresholdRequestPayload(SensorPayload):
    """A request to set the threshold value of a sensor."""

    threshold: utils.Int32Field
    mode: SensorThresholdModeField


@dataclass
class SensorThresholdResponsePayload(SensorPayload):
    """A response that sends back the current threshold value of the sensor."""

    threshold: utils.Int32Field
    mode: SensorThresholdModeField


@dataclass
class SensorDiagnosticRequestPayload(SensorPayload):
    """A response that sends back the current threshold value of the sensor."""

    reg_address: utils.UInt8Field


@dataclass
class SensorDiagnosticResponsePayload(SensorPayload):
    """A response that sends back the current threshold value of the sensor."""

    reg_address: utils.UInt8Field
    data: utils.UInt32Field


@dataclass
class BindSensorOutputRequestPayload(SensorPayload):
    """A request to link a GPIO pin output to a sensor threshold."""

    binding: SensorOutputBindingField


@dataclass
class BindSensorOutputResponsePayload(SensorPayload):
    """A response that sends back the current binding for a sensor."""

    binding: SensorOutputBindingField


@dataclass
class PipetteInfoResponsePayload(EmptyPayload):
    """A response carrying data about an attached pipette."""

    name: PipetteNameField
    model: utils.UInt16Field
    serial: SerialDataCodeField


@dataclass
class BrushedMotorVrefPayload(EmptyPayload):
    """A request to set the reference voltage of a brushed motor."""

    v_ref: utils.UInt32Field


@dataclass
class BrushedMotorPwmPayload(EmptyPayload):
    """A request to set the pwm of a brushed motor."""

    duty_cycle: utils.UInt32Field


@dataclass
class GripperInfoResponsePayload(EmptyPayload):
    """A response carrying data about an attached gripper."""

    model: utils.UInt16Field
    serial: SerialDataCodeField


@dataclass
class GripperMoveRequestPayload(AddToMoveGroupRequestPayload):
    """A request to move gripper."""

    duty_cycle: utils.UInt32Field
    encoder_position_um: utils.Int32Field


@dataclass
class TipActionRequestPayload(AddToMoveGroupRequestPayload):
    """A request to perform a tip action."""

    velocity: utils.Int32Field
    action: PipetteTipActionTypeField
    request_stop_condition: utils.UInt8Field


@dataclass
class TipActionResponsePayload(MoveCompletedPayload):
    """A response that sends back whether tip action was successful."""

    action: PipetteTipActionTypeField
    success: utils.UInt8Field


@dataclass
class PeripheralStatusResponsePayload(SensorPayload):
    """A response that sends back the initialization status of a peripheral device."""

    status: utils.UInt8Field


@dataclass
class SerialNumberPayload(EmptyPayload):
    """A payload with a serial number."""

    serial: SerialField
