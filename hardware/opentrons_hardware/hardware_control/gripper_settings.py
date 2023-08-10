"""Utilities for updating the gripper settings."""
import logging
import asyncio
from dataclasses import dataclass
from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    WaitableCallback,
)
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId

from opentrons_hardware.firmware_bindings.messages import payloads
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    SetBrushedMotorVrefRequest,
    SetBrushedMotorPwmRequest,
    SetGripperErrorTolerance,
    GripperGripRequest,
    GripperHomeRequest,
    AddBrushedLinearMoveRequest,
    BrushedMotorConfRequest,
    BrushedMotorConfResponse,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt32Field,
    Int32Field,
)
from opentrons_hardware.firmware_bindings.constants import NodeId, ErrorCode
from .constants import brushed_motor_interrupts_per_sec

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class DriverConfig:
    """Brushed motor driver config."""

    reference_voltage: float
    duty_cycle: int


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


async def set_error_tolerance(
    can_messenger: CanMessenger, max_pos_error: float, max_unwanted_movement: float
) -> None:
    """Set the error tolerance for gripper jaw."""
    error = await can_messenger.ensure_send(
        node_id=NodeId.gripper_g,
        message=SetGripperErrorTolerance(
            payload=payloads.GripperErrorTolerancePayload(
                max_pos_error_mm=UInt32Field(int(max_pos_error * (2**16))),
                max_unwanted_movement_mm=UInt32Field(
                    int(max_unwanted_movement * (2**16))
                ),
            )
        ),
        expected_nodes=[NodeId.gripper_g],
    )
    if error != ErrorCode.ok:
        log.error(f"recieved error trying to set gripper error tolerance {str(error)}")


async def get_gripper_jaw_motor_param(
    can_messenger: CanMessenger,
) -> DriverConfig:
    """Get gripper brushed motor driver params: reference voltage and duty cycle."""

    def _filter(arbitration_id: ArbitrationId) -> bool:
        return NodeId(arbitration_id.parts.originating_node_id) == NodeId.gripper_g

    async def _wait_for_response(reader: WaitableCallback) -> DriverConfig:
        """Listener for receiving messages back."""
        async for response, _ in reader:
            if isinstance(response, BrushedMotorConfResponse):
                return DriverConfig(
                    reference_voltage=float(response.payload.v_ref.value / (2**16)),
                    duty_cycle=int(response.payload.duty_cycle.value / (2**16)),
                )
        raise StopAsyncIteration

    with WaitableCallback(can_messenger, _filter) as reader:
        await can_messenger.send(
            node_id=NodeId.gripper_g,
            message=BrushedMotorConfRequest(),
        )
        try:
            return await asyncio.wait_for(_wait_for_response(reader), 1.0)
        except asyncio.TimeoutError:
            log.warning("Read brushed motor driver config timed out")
            raise StopAsyncIteration


async def grip(
    can_messenger: CanMessenger,
    group_id: int,
    seq_id: int,
    duration_sec: float,
    duty_cycle: int,
    stay_engaged: bool = False,
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
                stay_engaged=UInt8Field(int(stay_engaged)),
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
                stay_engaged=UInt8Field(0),
            )
        ),
    )


async def move(
    can_messenger: CanMessenger,
    group_id: int,
    seq_id: int,
    duty_cycle: int,
    encoder_position_um: int,
    stay_engaged: bool = False,
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
                stay_engaged=UInt8Field(int(stay_engaged)),
            )
        ),
    )
