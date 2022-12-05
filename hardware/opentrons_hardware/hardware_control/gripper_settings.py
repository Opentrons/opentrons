"""Utilities for updating the gripper settings."""
import logging
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.messages import payloads
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    SetBrushedMotorVrefRequest,
    SetBrushedMotorPwmRequest,
    GripperGripRequest,
    GripperHomeRequest,
    AddBrushedLinearMoveRequest,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt32Field,
    Int32Field,
)
from opentrons_hardware.firmware_bindings.constants import NodeId, ErrorCode
from .constants import brushed_motor_interrupts_per_sec

log = logging.getLogger(__name__)


async def set_reference_voltage(
    can_messenger: CanMessenger,
    v_ref: float,
) -> None:
    """Set gripper brushed motor reference voltage."""
    error = await can_messenger.ensure_send(
        node_id=NodeId.gripper_g,
        message=SetBrushedMotorVrefRequest(
            payload=payloads.BrushedMotorVrefPayload(
                v_ref=UInt32Field(int(v_ref * (2**16)))
            )
        ),
        expected_nodes=[NodeId.gripper_g],
    )
    if error != ErrorCode.ok:
        log.error(f"recieved error trying to set gripper vref {str(error)}")


async def set_pwm_param(
    can_messenger: CanMessenger,
    duty_cycle: int,
) -> None:
    """Set gripper brushed motor reference voltage."""
    error = await can_messenger.ensure_send(
        node_id=NodeId.gripper_g,
        message=SetBrushedMotorPwmRequest(
            payload=payloads.BrushedMotorPwmPayload(duty_cycle=UInt32Field(duty_cycle))
        ),
        expected_nodes=[NodeId.gripper_g],
    )
    if error != ErrorCode.ok:
        log.error(f"recieved error trying to set gripper pwm {str(error)}")


async def grip(
    can_messenger: CanMessenger,
    group_id: int,
    seq_id: int,
    duration_sec: float,
    duty_cycle: int,
) -> None:
    """Start grip motion."""
    await can_messenger.send(
        node_id=NodeId.gripper,
        message=GripperGripRequest(
            payload=payloads.GripperMoveRequestPayload(
                group_id=UInt8Field(group_id),
                seq_id=UInt8Field(seq_id),
                duration=UInt32Field(
                    int(duration_sec * brushed_motor_interrupts_per_sec)
                ),
                duty_cycle=UInt32Field(duty_cycle),
                encoder_position_um=Int32Field(0),
            )
        ),
    )


async def home(
    can_messenger: CanMessenger,
    group_id: int,
    seq_id: int,
    duty_cycle: int,
) -> None:
    """Start home motion."""
    await can_messenger.send(
        node_id=NodeId.gripper,
        message=GripperHomeRequest(
            payload=payloads.GripperMoveRequestPayload(
                group_id=UInt8Field(group_id),
                seq_id=UInt8Field(seq_id),
                duration=UInt32Field(0),
                duty_cycle=UInt32Field(duty_cycle),
                encoder_position_um=Int32Field(0),
            )
        ),
    )


async def move(
    can_messenger: CanMessenger,
    group_id: int,
    seq_id: int,
    duty_cycle: int,
    encoder_position_um: int,
) -> None:
    """Start linear motion."""
    await can_messenger.send(
        node_id=NodeId.gripper,
        message=AddBrushedLinearMoveRequest(
            payload=payloads.GripperMoveRequestPayload(
                group_id=UInt8Field(group_id),
                seq_id=UInt8Field(seq_id),
                duration=UInt32Field(0),
                duty_cycle=UInt32Field(duty_cycle),
                encoder_position_um=Int32Field(encoder_position_um),
            )
        ),
    )
