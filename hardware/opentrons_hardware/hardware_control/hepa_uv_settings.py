"""Utilities for controlling the hepa/uv extension module."""

import logging
import asyncio
from typing import Optional
from dataclasses import dataclass
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId

from opentrons_hardware.firmware_bindings.messages import payloads
from opentrons_hardware.firmware_bindings.messages.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    SetHepaFanStateRequest,
    GetHepaFanStateRequest,
    GetHepaFanStateResponse,
    SetHepaUVStateRequest,
    GetHepaUVStateRequest,
    GetHepaUVStateResponse,
)
from opentrons_hardware.firmware_bindings.utils import (
    UInt8Field,
    UInt32Field,
)
from opentrons_hardware.firmware_bindings.constants import (
    MessageId,
    NodeId,
    ErrorCode,
)

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class HepaFanState:
    """Hepa Fan Config."""

    fan_on: bool
    duty_cycle: int
    fan_rpm: int


@dataclass(frozen=True)
class HepaUVState:
    """Hepa UV Light Config."""

    uv_light_on: bool
    uv_duration_s: int
    remaining_time_s: int
    uv_current_ma: int
    safety_relay_active: bool


async def set_hepa_fan_state(
    can_messenger: CanMessenger,
    fan_on: bool,
    duty_cycle: int,
) -> bool:
    """Set the Hepa fan state and duty cycle."""
    error = await can_messenger.ensure_send(
        node_id=NodeId.hepa_uv,
        message=SetHepaFanStateRequest(
            payload=payloads.SetHepaFanStateRequestPayload(
                duty_cycle=UInt32Field(duty_cycle), fan_on=UInt8Field(fan_on)
            ),
        ),
        expected_nodes=[NodeId.hepa_uv],
    )
    if error != ErrorCode.ok:
        log.error(f"received error trying to set hepa fan state {str(error)}")
    return error == ErrorCode.ok


async def get_hepa_fan_state(can_messenger: CanMessenger) -> Optional[HepaFanState]:
    """Gets the state of the Hepa fan."""
    fan_state: Optional[HepaFanState] = None

    event = asyncio.Event()

    def _listener(message: MessageDefinition, arb_id: ArbitrationId) -> None:
        nonlocal fan_state
        if isinstance(message, GetHepaFanStateResponse):
            event.set()
            fan_state = HepaFanState(
                fan_on=bool(message.payload.fan_on.value),
                duty_cycle=int(message.payload.duty_cycle.value),
                fan_rpm=int(message.payload.fan_rpm.value),
            )

    def _filter(arb_id: ArbitrationId) -> bool:
        return (NodeId(arb_id.parts.originating_node_id) == NodeId.hepa_uv) and (
            MessageId(arb_id.parts.message_id) == MessageId.get_hepa_fan_state_response
        )

    can_messenger.add_listener(_listener, _filter)
    await can_messenger.send(node_id=NodeId.hepa_uv, message=GetHepaFanStateRequest())
    try:
        await asyncio.wait_for(event.wait(), 1.0)
    except asyncio.TimeoutError:
        log.warning("hepa fan state request timed out")
    finally:
        can_messenger.remove_listener(_listener)
        return fan_state


async def set_hepa_uv_state(
    can_messenger: CanMessenger,
    uv_light_on: bool,
    uv_duration_s: int,
) -> bool:
    """Sets the Hepa UV light state and duration in seconds."""
    error = await can_messenger.ensure_send(
        node_id=NodeId.hepa_uv,
        message=SetHepaUVStateRequest(
            payload=payloads.SetHepaUVStateRequestPayload(
                uv_duration_s=UInt32Field(uv_duration_s),
                uv_light_on=UInt8Field(uv_light_on),
            ),
        ),
        expected_nodes=[NodeId.hepa_uv],
    )
    if error != ErrorCode.ok:
        log.error(f"received error trying to set hepa uv light state {str(error)}")
    return error == ErrorCode.ok


async def get_hepa_uv_state(can_messenger: CanMessenger) -> Optional[HepaUVState]:
    """Gets the state of the Hepa uv light."""
    uv_state: Optional[HepaUVState] = None

    event = asyncio.Event()

    def _listener(message: MessageDefinition, arb_id: ArbitrationId) -> None:
        nonlocal uv_state
        if isinstance(message, GetHepaUVStateResponse):
            event.set()
            uv_state = HepaUVState(
                uv_light_on=bool(message.payload.uv_light_on.value),
                uv_duration_s=int(message.payload.uv_duration_s.value),
                remaining_time_s=int(message.payload.remaining_time_s.value),
                uv_current_ma=int(message.payload.uv_current_ma.value),
                safety_relay_active=bool(message.payload.safety_relay_active.value),
            )

    def _filter(arb_id: ArbitrationId) -> bool:
        return (NodeId(arb_id.parts.originating_node_id) == NodeId.hepa_uv) and (
            MessageId(arb_id.parts.message_id) == MessageId.get_hepa_uv_state_response
        )

    can_messenger.add_listener(_listener, _filter)
    await can_messenger.send(node_id=NodeId.hepa_uv, message=GetHepaUVStateRequest())
    try:
        await asyncio.wait_for(event.wait(), 1.0)
    except asyncio.TimeoutError:
        log.warning("hepa uv light state request timed out")
    finally:
        can_messenger.remove_listener(_listener)
        return uv_state
