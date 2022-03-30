"""Utilities for updating the gripper settings."""
from lib2to3.pytree import Node
from re import M
from hardware.opentrons_hardware.firmware_bindings.messages.message_definitions import GripperGripRequest, GripperHomeRequest, SetBrushedMotorPwmRequest
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.messages import payloads
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    SetBrushedMotorVrefRequest,
)
from opentrons_hardware.firmware_bindings.utils import UInt32Field
from opentrons_hardware.firmware_bindings.constants import NodeId


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
        )
    )


async def set_pwm_param(
    can_messenger: CanMessenger,
    freq: int,
    duty_cycle: int,
) -> None:
    """Set gripper brushed motor reference voltage."""
    await can_messenger.send(
        node_id=NodeId.gripper,
        message=SetBrushedMotorPwmRequest(
            payload=payloads.SetBrushedMotorPwmRequest(
                freq=UInt32Field(freq),
                duty_cycle=UInt32Field(duty_cycle)
            )
        )
    )


async def grip(can_messenger: CanMessenger) -> None:
    """Start grip motion."""
    await can_messenger.send(
        node_id=NodeId.gripper,
        message=GripperGripRequest(payload=payloads.EmptyPayload)
    )


async def home(can_messenger: CanMessenger) -> None:
    """Start home motion."""
    await can_messenger.send(
        node_id=NodeId.gripper,
        message=GripperHomeRequest(payload=payloads.EmptyPayload)
    )