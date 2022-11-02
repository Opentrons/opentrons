"""Payloads of can bus messages."""
# TODO (amit, 2022-01-26): Figure out why using annotations import ruins
#  dataclass fields interpretation.
#  from __future__ import annotations
from dataclasses import dataclass, field
from . import message_definitions

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


@dataclass(eq=False)
class EmptyPayload(utils.BinarySerializable):
    """An empty payload."""

    def __eq__(self, other: object) -> bool:
        """Override __eq__ to ignore message_index."""
        other_dict = vars(other)
        self_dict = vars(self)
        for key in self_dict:
            if key != "message_index":
                if not (key in other_dict and self_dict[key] == other_dict[key]):
                    return False
        return True

    # oh boy would it be great to have python 3.10 so we could use the kw_only thing here
    # we can't have it as a normal arg becuase we'd have to initalize it everywhere we make a message
    # and we can't just have it set as a default becuase we get a TypeError for initizling the non-default
    # args of subclasses after this default arg.
    # to work around this in binary_serializable.build() and can_comm.prompt_payload
    # we ignore the message_index when constructing args and then set the value manually after
    message_index: utils.UInt32Field = field(
        init=False, default=utils.UInt32Field(None)  # type: ignore[arg-type]
    )


@dataclass(eq=False)
class DeviceInfoResponsePayload(EmptyPayload):
    """Device info response."""

    version: utils.UInt32Field
    flags: VersionFlagsField
    shortsha: FirmwareShortSHADataField


@dataclass(eq=False)
class TaskInfoResponsePayload(EmptyPayload):
    """Task info response payload."""

    name: TaskNameDataField
    runtime_counter: utils.UInt32Field
    stack_high_water_mark: utils.UInt32Field
    state: utils.UInt16Field
    priority: utils.UInt16Field


@dataclass(eq=False)
class GetStatusResponsePayload(EmptyPayload):
    """Get status response."""

    status: utils.UInt8Field
    data: utils.UInt32Field


@dataclass(eq=False)
class MoveRequestPayload(EmptyPayload):
    """Move request."""

    steps: utils.UInt32Field


@dataclass(eq=False)
class GetSpeedResponsePayload(EmptyPayload):
    """Get speed response."""

    mm_sec: utils.UInt32Field


@dataclass(eq=False)
class EEPromReadPayload(EmptyPayload):
    """Eeprom read request payload ."""

    address: utils.UInt16Field
    data_length: utils.UInt16Field


@dataclass(eq=False)
class EEPromDataPayload(EEPromReadPayload):
    """Eeprom payload with data."""

    data: EepromDataField


@dataclass(eq=False)
class MoveGroupRequestPayload(EmptyPayload):
    """A payload with a group id."""

    group_id: utils.UInt8Field


@dataclass(eq=False)
class MoveGroupResponsePayload(EmptyPayload):
    """A response payload with a group id."""

    group_id: utils.UInt8Field


@dataclass(eq=False)
class AddToMoveGroupRequestPayload(MoveGroupRequestPayload):
    """Base of add to move group request to a message group."""

    seq_id: utils.UInt8Field
    duration: utils.UInt32Field


@dataclass(eq=False)
class AddLinearMoveRequestPayload(AddToMoveGroupRequestPayload):
    """Add a linear move request to a message group."""

    acceleration: utils.Int32Field
    velocity: utils.Int32Field
    request_stop_condition: utils.UInt8Field


@dataclass(eq=False)
class HomeRequestPayload(AddToMoveGroupRequestPayload):
    """Request to home."""

    velocity: utils.Int32Field


@dataclass(eq=False)
class GetMoveGroupResponsePayload(MoveGroupResponsePayload):
    """Response to request to get a move group."""

    num_moves: utils.UInt8Field
    total_duration: utils.UInt32Field


@dataclass(eq=False)
class ExecuteMoveGroupRequestPayload(MoveGroupRequestPayload):
    """Start executing a move group."""

    start_trigger: utils.UInt8Field
    cancel_trigger: utils.UInt8Field


@dataclass(eq=False)
class MoveCompletedPayload(MoveGroupResponsePayload):
    """Notification of a completed move group."""

    seq_id: utils.UInt8Field
    current_position_um: utils.UInt32Field
    encoder_position_um: utils.Int32Field
    ack_id: utils.UInt8Field


@dataclass(eq=False)
class EncoderPositionResponse(EmptyPayload):
    """Read Encoder Position."""

    encoder_position: utils.Int32Field


@dataclass(eq=False)
class MotionConstraintsPayload(EmptyPayload):
    """The min and max velocity and acceleration of a motion system."""

    min_velocity: utils.Int32Field
    max_velocity: utils.Int32Field
    min_acceleration: utils.Int32Field
    max_acceleration: utils.Int32Field


@dataclass(eq=False)
class MotorDriverRegisterPayload(EmptyPayload):
    """Read motor driver register request payload."""

    reg_addr: utils.UInt8Field


@dataclass(eq=False)
class MotorDriverRegisterDataPayload(MotorDriverRegisterPayload):
    """Write motor driver register request payload."""

    data: utils.UInt32Field


@dataclass(eq=False)
class ReadMotorDriverRegisterResponsePayload(EmptyPayload):
    """Read motor driver register response payload."""

    reg_addr: utils.UInt8Field
    data: utils.UInt32Field


@dataclass(eq=False)
class MotorCurrentPayload(EmptyPayload):
    """Read motor current register payload."""

    # All values in milliAmps
    hold_current: utils.UInt32Field
    run_current: utils.UInt32Field


@dataclass(eq=False)
class ReadPresenceSensingVoltageResponsePayload(EmptyPayload):
    """Read head presence sensing voltage response payload."""

    # All values in millivolts
    z_motor: utils.UInt16Field
    a_motor: utils.UInt16Field
    gripper: utils.UInt16Field


@dataclass(eq=False)
class ToolsDetectedNotificationPayload(EmptyPayload):
    """Tool detection notification."""

    # Tools are mapped to an enum
    z_motor: ToolField
    a_motor: ToolField
    gripper: ToolField


@dataclass(eq=False)
class FirmwareUpdateWithAddress(EmptyPayload):
    """A FW update payload with an address."""

    address: utils.UInt32Field


@dataclass(eq=False)
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
    def create(
        cls, address: int, data: bytes, message_index: int = None  # type: ignore[assignment]
    ) -> "FirmwareUpdateData":
        """Create a firmware update data payload."""
        # this is a special case, we normally instansiate message_index
        # when building a message, not a payload, but we need to compute
        # the checksum so we do it here. you should not normally supply
        # message index to this function, but i've added it for the unit
        # tests so the object can have a predictable checksum
        checksum = 0
        obj = FirmwareUpdateData(
            address=utils.UInt32Field(address),
            num_bytes=utils.UInt8Field(len(data)),
            reserved=utils.UInt8Field(0),
            data=FirmwareUpdateDataField(data),
            checksum=utils.UInt16Field(checksum),
        )
        if message_index is None:
            index_generator = message_definitions.SingletonMessageIndexGenerator()
            obj.message_index = utils.UInt32Field(index_generator.get_next_index())
        else:
            obj.message_index = utils.UInt32Field(message_index)
        checksum = (1 + ~sum(obj.serialize())) & 0xFFFF
        obj.checksum.value = checksum
        return obj


@dataclass(eq=False)
class FirmwareUpdateDataAcknowledge(FirmwareUpdateWithAddress):
    """A FW update data acknowledge payload."""

    error_code: ErrorCodeField


@dataclass(eq=False)
class FirmwareUpdateComplete(EmptyPayload):
    """All data messages have been transmitted."""

    num_messages: utils.UInt32Field
    crc32: utils.UInt32Field


@dataclass(eq=False)
class FirmwareUpdateAcknowledge(EmptyPayload):
    """A response to a firmware update message with an error code."""

    error_code: ErrorCodeField


@dataclass(eq=False)
class FirmwareUpdateStatus(EmptyPayload):
    """A response to the FirmwareUpdateStatusRequest message."""

    flags: utils.UInt32Field


@dataclass(eq=False)
class GetLimitSwitchResponse(EmptyPayload):
    """A response to the Limit Switch Status request payload."""

    switch_status: utils.UInt8Field


@dataclass(eq=False)
class SensorPayload(EmptyPayload):
    """Take a single reading from a sensor request payload."""

    sensor: SensorTypeField
    sensor_id: SensorIdField


@dataclass(eq=False)
class ReadFromSensorRequestPayload(SensorPayload):
    """Take a single reading from a sensor request payload."""

    offset_reading: utils.UInt8Field


@dataclass(eq=False)
class WriteToSensorRequestPayload(SensorPayload):
    """Write a piece of data to a sensor request payload."""

    data: utils.UInt32Field
    reg_address: utils.UInt8Field


@dataclass(eq=False)
class BaselineSensorRequestPayload(SensorPayload):
    """Take a specified amount of readings from a sensor request payload."""

    sample_rate: utils.UInt16Field


@dataclass(eq=False)
class ReadFromSensorResponsePayload(SensorPayload):
    """A response for either a single reading or an averaged reading of a sensor."""

    sensor_data: utils.Int32Field


@dataclass(eq=False)
class SetSensorThresholdRequestPayload(SensorPayload):
    """A request to set the threshold value of a sensor."""

    threshold: utils.Int32Field
    mode: SensorThresholdModeField


@dataclass(eq=False)
class SensorThresholdResponsePayload(SensorPayload):
    """A response that sends back the current threshold value of the sensor."""

    threshold: utils.Int32Field
    mode: SensorThresholdModeField


@dataclass(eq=False)
class SensorDiagnosticRequestPayload(SensorPayload):
    """A response that sends back the current threshold value of the sensor."""

    reg_address: utils.UInt8Field


@dataclass(eq=False)
class SensorDiagnosticResponsePayload(SensorPayload):
    """A response that sends back the current threshold value of the sensor."""

    reg_address: utils.UInt8Field
    data: utils.UInt32Field


@dataclass(eq=False)
class BindSensorOutputRequestPayload(SensorPayload):
    """A request to link a GPIO pin output to a sensor threshold."""

    binding: SensorOutputBindingField


@dataclass(eq=False)
class BindSensorOutputResponsePayload(SensorPayload):
    """A response that sends back the current binding for a sensor."""

    binding: SensorOutputBindingField


@dataclass(eq=False)
class PipetteInfoResponsePayload(EmptyPayload):
    """A response carrying data about an attached pipette."""

    name: PipetteNameField
    model: utils.UInt16Field
    serial: SerialDataCodeField


@dataclass(eq=False)
class BrushedMotorVrefPayload(EmptyPayload):
    """A request to set the reference voltage of a brushed motor."""

    v_ref: utils.UInt32Field


@dataclass(eq=False)
class BrushedMotorPwmPayload(EmptyPayload):
    """A request to set the pwm of a brushed motor."""

    duty_cycle: utils.UInt32Field


@dataclass(eq=False)
class GripperInfoResponsePayload(EmptyPayload):
    """A response carrying data about an attached gripper."""

    model: utils.UInt16Field
    serial: SerialDataCodeField


@dataclass(eq=False)
class GripperMoveRequestPayload(AddToMoveGroupRequestPayload):
    """A request to move gripper."""

    duty_cycle: utils.UInt32Field
    encoder_position_um: utils.Int32Field


@dataclass(eq=False)
class TipActionRequestPayload(AddToMoveGroupRequestPayload):
    """A request to perform a tip action."""

    velocity: utils.Int32Field
    action: PipetteTipActionTypeField
    request_stop_condition: utils.UInt8Field


@dataclass(eq=False)
class TipActionResponsePayload(MoveCompletedPayload):
    """A response that sends back whether tip action was successful."""

    action: PipetteTipActionTypeField
    success: utils.UInt8Field


@dataclass(eq=False)
class PeripheralStatusResponsePayload(SensorPayload):
    """A response that sends back the initialization status of a peripheral device."""

    status: utils.UInt8Field


@dataclass(eq=False)
class SerialNumberPayload(EmptyPayload):
    """A payload with a serial number."""

    serial: SerialField
