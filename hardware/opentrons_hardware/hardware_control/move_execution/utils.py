from opentrons_hardware.hardware_control.motion import (
    MoveGroups,
    MoveGroupSingleAxisStep,
    MoveGroupSingleGripperStep,
    MoveGroupTipActionStep,
    MoveType,
    SingleMoveStep,
)
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.hardware_control.constants import (
    interrupts_per_sec,
    tip_interrupts_per_sec,
    brushed_motor_interrupts_per_sec,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt32Field,
    Int32Field,
)
from opentrons_hardware.firmware_bindings.messages.fields import (
    PipetteTipActionTypeField,
    MoveStopConditionField,
)
from opentrons_hardware.firmware_bindings.messages.payloads import (
    AddLinearMoveRequestPayload,
    ExecuteMoveGroupRequestPayload,
    HomeRequestPayload,
    GripperMoveRequestPayload,
    TipActionRequestPayload,
    EmptyPayload,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ClearAllMoveGroupsRequest,
    AddLinearMoveRequest,
    MoveCompleted,
    ExecuteMoveGroupRequest,
    HomeRequest,
    GripperGripRequest,
    GripperHomeRequest,
    AddBrushedLinearMoveRequest,
    TipActionRequest,
    TipActionResponse,
    ErrorMessage,
    StopRequest,
)


def move_message_from_step(
        step: SingleMoveStep,
        group: int,
        seq: int
) -> MessageDefinition:
    match step:
        # stepper motor moves
        case MoveGroupSingleAxisStep(move_type=MoveType.home):
            return HomeRequest(
                payload=stepper_home_payload(step, group, seq)
            )
        case MoveGroupSingleAxisStep():
            return AddLinearMoveRequest(
                payload=stepper_motor_payload(step, group, seq)
            )

        # brushed motor moves
        case MoveGroupSingleGripperStep(move_type=MoveType.home):
            return GripperHomeRequest(
                payload=brushed_motor_payload(step, group, seq)
            )
        case MoveGroupSingleGripperStep(move_type=MoveType.grip):
            return GripperGripRequest(
                payload=brushed_motor_payload(step, group, seq)
            )
        case MoveGroupSingleGripperStep(move_type=MoveType.linear):
            return AddBrushedLinearMoveRequest(
                payload=brushed_motor_payload(step, group, seq)
            )

        # tip action moves
        case MoveGroupTipActionStep():
            return TipActionRequest(
                payload=tip_action_motor_payload(step, group, seq)
            )
        

def brushed_motor_payload(
    step: MoveGroupSingleGripperStep, group: int, seq: int
) -> GripperMoveRequestPayload:
    return GripperMoveRequestPayload(
        group_id=UInt8Field(group),
        seq_id=UInt8Field(seq),
        duration=convert_duration(step.duration_sec, brushed_motor_interrupts_per_sec),
        duty_cycle=UInt32Field(int(step.pwm_duty_cycle)),
        encoder_position_um=Int32Field(int(step.encoder_position_um)),
        stay_engaged=UInt8Field(int(step.stay_engaged)),
    )
        

def stepper_home_payload(
    step: MoveGroupSingleAxisStep, group: int, seq: int
) -> HomeRequestPayload:
    return HomeRequestPayload(
            group_id=UInt8Field(group),
            seq_id=UInt8Field(seq),
            duration=convert_duration(step.duration_sec, interrupts_per_sec),
            velocity_mm=convert_velocity(
                step.velocity_mm_sec, interrupts_per_sec
            ),
    )


def stepper_motor_payload(
    step: MoveGroupSingleAxisStep, group: int, seq: int
) -> AddLinearMoveRequestPayload:
    return AddLinearMoveRequestPayload(
        request_stop_condition=MoveStopConditionField(step.stop_condition),
        group_id=UInt8Field(group),
        seq_id=UInt8Field(seq),
        duration=convert_duration(
            step.duration_sec, interrupts_per_sec),
        acceleration_um=convert_acceleration_um(
            step.acceleration_mm_sec_sq, interrupts_per_sec),
        velocity_mm=convert_velocity(
            step.velocity_mm_sec, interrupts_per_sec),
    )


def tip_action_motor_payload(
    step: MoveGroupTipActionStep, group: int, seq: int
) -> TipActionRequestPayload:
    return TipActionRequestPayload(
        group_id=UInt8Field(group),
        seq_id=UInt8Field(seq),
        duration=convert_duration(
            step.duration_sec, tip_interrupts_per_sec
        ),
        velocity=convert_velocity(
            step.velocity_mm_sec, tip_interrupts_per_sec
        ),
        acceleration=convert_acceleration_um(
            step.acceleration_mm_sec_sq, tip_interrupts_per_sec
        ),
        action=PipetteTipActionTypeField(step.action),
        request_stop_condition=MoveStopConditionField(step.stop_condition),
    )


def convert_duration(duration: float, interrupts: int) -> UInt32Field:
    return UInt32Field(int(duration, interrupts))

def convert_velocity(velocity: float, interrupts: int) -> Int32Field:
    return Int32Field(int((velocity / interrupts) * (2**31)))

def convert_acceleration_um(acc_mm: float, interrupts: int) -> Int32Field:
    return Int32Field(
        int(
            (acc_mm * 1000.0 / (interrupts**2))
            * (2**31)
        )
    )