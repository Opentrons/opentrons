"""Payloads of can bus messages."""
# TODO (amit, 2022-01-26): Figure out why using annotations import ruins
#  dataclass fields interpretation.
#  from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Iterator, List

from opentrons_shared_data.errors.exceptions import InternalMessageFormatError

from . import message_definitions
from .fields import (
    FirmwareShortSHADataField,
    VersionFlagsField,
    TaskNameDataField,
    ToolField,
    FirmwareUpdateDataField,
    ErrorSeverityField,
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
    MotorPositionFlagsField,
    MoveStopConditionField,
    GearMotorIdField,
    OptionalRevisionField,
    MotorUsageTypeField,
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
class ErrorMessagePayload(EmptyPayload):
    """Message sent from firmware in the event of an error."""

    severity: ErrorSeverityField
    error_code: ErrorCodeField


@dataclass(eq=False)
class _DeviceInfoResponsePayloadBase(EmptyPayload):
    version: utils.UInt32Field
    flags: VersionFlagsField
    shortsha: FirmwareShortSHADataField


@dataclass(eq=False)
class DeviceInfoResponsePayload(_DeviceInfoResponsePayloadBase):
    """Device info response."""

    @classmethod
    def build(cls, data: bytes) -> "DeviceInfoResponsePayload":
        """Build a response payload from incoming bytes.

        This override is required to handle optionally-present revision data.
        """
        consumed_by_super = _DeviceInfoResponsePayloadBase.get_size()
        superdict = asdict(_DeviceInfoResponsePayloadBase.build(data))
        message_index = superdict.pop("message_index")

        # we want to parse this by adding extra 0s that may not be necessary,
        # which is annoying and complex, so let's wrap it in an iterator
        def _data_for_optionals(consumed: int, buf: bytes) -> Iterator[bytes]:
            extended = buf + b"\x00\x00\x00\x00"
            yield extended[consumed:]
            consumed += 4
            extended = extended + b"\x00"
            yield extended[consumed : consumed + 1]

        optionals_yielder = _data_for_optionals(consumed_by_super, data)
        inst = cls(
            **superdict,
            revision=OptionalRevisionField.build(next(optionals_yielder)),
            subidentifier=utils.UInt8Field.build(
                int.from_bytes(next(optionals_yielder), "big")
            ),
        )
        inst.message_index = message_index
        return inst

    revision: OptionalRevisionField
    subidentifier: utils.UInt8Field


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

    acceleration_um: utils.Int32Field
    velocity_mm: utils.Int32Field
    request_stop_condition: MoveStopConditionField


@dataclass(eq=False)
class HomeRequestPayload(AddToMoveGroupRequestPayload):
    """Request to home."""

    velocity_mm: utils.Int32Field


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
    position_flags: MotorPositionFlagsField
    ack_id: utils.UInt8Field


@dataclass(eq=False)
class MotorPositionResponse(EmptyPayload):
    """Read Encoder Position."""

    current_position: utils.UInt32Field
    encoder_position: utils.Int32Field
    position_flags: MotorPositionFlagsField


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
        address = self.address.value
        if address % 8 != 0:
            raise InternalMessageFormatError(
                f"FirmwareUpdateData: Data address needs to be doubleword aligned."
                f" {address} mod 8 equals {address % 8} and should be 0",
                detail={"address": address},
            )
        if data_length > FirmwareUpdateDataField.NUM_BYTES:
            raise InternalMessageFormatError(
                f"FirmwareUpdateData: Data cannot be more than"
                f" {FirmwareUpdateDataField.NUM_BYTES} bytes got {data_length}.",
                detail={"size": data_length},
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
    """Provide a specified amount of readings to take the average of the current sensor."""

    number_of_reads: utils.UInt16Field


@dataclass(eq=False)
class BaselineSensorResponsePayload(SensorPayload):
    """A response containing an averaged offset reading from a sensor."""

    offset_average: utils.Int32Field


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
class BrushedMotorConfPayload(EmptyPayload):
    """A response carrying data about a brushed motor driver."""

    v_ref: utils.UInt32Field
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
    stay_engaged: utils.UInt8Field


@dataclass(eq=False)
class GripperErrorTolerancePayload(EmptyPayload):
    """A request to update the position error tolerance of the gripper."""

    max_pos_error_mm: utils.UInt32Field
    max_unwanted_movement_mm: utils.UInt32Field


@dataclass(eq=False)
class PushTipPresenceNotificationPayload(EmptyPayload):
    """A notification that the ejector flag status has changed."""

    ejector_flag_status: utils.UInt8Field


@dataclass(eq=False)
class TipActionRequestPayload(AddToMoveGroupRequestPayload):
    """A request to perform a tip action."""

    velocity: utils.Int32Field
    action: PipetteTipActionTypeField
    request_stop_condition: MoveStopConditionField
    acceleration: utils.Int32Field


@dataclass(eq=False)
class TipActionResponsePayload(MoveCompletedPayload):
    """A response that sends back whether tip action was successful."""

    action: PipetteTipActionTypeField
    success: utils.UInt8Field
    gear_motor_id: GearMotorIdField


@dataclass(eq=False)
class PeripheralStatusResponsePayload(SensorPayload):
    """A response that sends back the initialization status of a peripheral device."""

    status: utils.UInt8Field


@dataclass(eq=False)
class SerialNumberPayload(EmptyPayload):
    """A payload with a serial number."""

    serial: SerialField


@dataclass(eq=False)
class _GetMotorUsageResponsePayloadBase(EmptyPayload):
    num_elements: utils.UInt8Field


@dataclass(eq=False)
class GetMotorUsageResponsePayload(_GetMotorUsageResponsePayloadBase):
    """A payload with motor lifetime usage."""

    @classmethod
    def build(cls, data: bytes) -> "GetMotorUsageResponsePayload":
        """Build a response payload from incoming bytes.

        This override is required to handle responses with multiple values.
        """
        consumed = _GetMotorUsageResponsePayloadBase.get_size()
        superdict = asdict(_GetMotorUsageResponsePayloadBase.build(data))
        num_elements = superdict["num_elements"]
        message_index = superdict.pop("message_index")

        usage_values: List[MotorUsageTypeField] = []

        for i in range(num_elements.value):
            usage_values.append(
                MotorUsageTypeField.build(
                    data[consumed : consumed + MotorUsageTypeField.NUM_BYTES]
                )
            )
            consumed = consumed + MotorUsageTypeField.NUM_BYTES

        inst = cls(**superdict, usage_elements=usage_values)
        inst.message_index = message_index
        return inst

    usage_elements: List[MotorUsageTypeField]
