"""Utilities for updating the gripper settings."""
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.messages import payloads
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    SetBrushedMotorVrefRequest,
    SetBrushedMotorPwmRequest,
    GripperGripRequest,
    GripperHomeRequest,
)
from opentrons_hardware.firmware_bindings.utils import UInt8Field, UInt32Field
from opentrons_hardware.firmware_bindings.constants import NodeId
from .constants import brushed_motor_interrupts_per_sec


async def set_reference_voltage(
    can_messenger: CanMessenger,
    v_ref: float,
) -> None:
    """Set gripper brushed motor reference voltage."""
    await can_messenger.send(
        node_id=NodeId.gripper,
        message=SetBrushedMotorVrefRequest(
            payload=payloads.BrushedMotorVrefPayload(
                v_ref=UInt32Field(int(v_ref * (2**16)))
            )
        ),
    )


async def set_pwm_param(
    can_messenger: CanMessenger,
    duty_cycle: int,
) -> None:
    """Set gripper brushed motor reference voltage."""
    await can_messenger.send(
        node_id=NodeId.gripper,
        message=SetBrushedMotorPwmRequest(
            payload=payloads.BrushedMotorPwmPayload(duty_cycle=UInt32Field(duty_cycle))
        ),
    )


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
            )
        ),
    )


async def home(
    can_messenger: CanMessenger, group_id: int, seq_id: int, duty_cycle: int
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
            )
        ),
    )
