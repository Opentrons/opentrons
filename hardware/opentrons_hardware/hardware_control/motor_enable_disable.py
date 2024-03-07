"""Utilities for updating the enable/disable state of an OT3 axis."""
from typing import Dict, Set
import logging
import asyncio
from opentrons_hardware.drivers.can_bus.can_messenger import (
    CanMessenger,
    WaitableCallback,
)
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    EnableMotorRequest,
    DisableMotorRequest,
    GearEnableMotorRequest,
    GearDisableMotorRequest,
    GetStatusRequest,
    GetStatusResponse,
    GearStatusResponse,
)
from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import (
    NodeId,
    ErrorCode,
    MessageId,
)
from opentrons_hardware.firmware_bindings.messages.messages import MessageDefinition

log = logging.getLogger(__name__)


async def set_enable_motor(
    can_messenger: CanMessenger,
    nodes: Set[NodeId],
) -> None:
    """Set enable motor each node."""
    for node in nodes:
        error = await can_messenger.ensure_send(
            node_id=node,
            message=EnableMotorRequest(),
            expected_nodes=[node],
        )
        if error != ErrorCode.ok:
            log.error(f"recieved error {str(error)} trying to enable {str(node)} ")


async def set_disable_motor(
    can_messenger: CanMessenger,
    nodes: Set[NodeId],
) -> None:
    """Set disable motor each node."""
    for node in nodes:
        error = await can_messenger.ensure_send(
            node_id=node,
            message=DisableMotorRequest(),
            expected_nodes=[node],
        )
        if error != ErrorCode.ok:
            log.error(f"recieved error {str(error)} trying to disable {str(node)} ")


async def set_enable_tip_motor(
    can_messenger: CanMessenger,
    nodes: Set[NodeId],
) -> None:
    """Set enable motor each node."""
    for node in nodes:
        error = await can_messenger.ensure_send(
            node_id=node,
            message=GearEnableMotorRequest(),
            expected_nodes=[node],
        )
        if error != ErrorCode.ok:
            log.error(f"recieved error {str(error)} trying to enable {str(node)} ")


async def set_disable_tip_motor(
    can_messenger: CanMessenger,
    nodes: Set[NodeId],
) -> None:
    """Set disable motor each node."""
    for node in nodes:
        error = await can_messenger.ensure_send(
            node_id=node,
            message=GearDisableMotorRequest(),
            expected_nodes=[node],
        )
        if error != ErrorCode.ok:
            log.error(f"recieved error {str(error)} trying to disable {str(node)} ")


async def get_motor_enabled(
    can_messenger: CanMessenger,
    nodes: Set[NodeId],
    timeout: float = 1.0,
) -> Dict[NodeId, bool]:
    """Get motor status of a set of nodes."""
    expected = nodes or set()
    reported: Dict[NodeId, bool] = {}
    event = asyncio.Event()

    def _filter(arb_id: ArbitrationId) -> bool:
        return MessageId(arb_id.parts.message_id) == GetStatusResponse.message_id

    def _listener(message: MessageDefinition, arb_id: ArbitrationId) -> None:
        """Listener for receving motor status messages."""
        if isinstance(message, GetStatusResponse):
            reported[NodeId(arb_id.parts.originating_node_id)] = bool(
                message.payload.status.value
            )

        # found all expected nodes
        if expected.issubset(reported):
            event.set()

    can_messenger.add_listener(_listener, _filter)
    await can_messenger.send(node_id=NodeId.broadcast, message=GetStatusRequest())
    try:
        await asyncio.wait_for(event.wait(), timeout)
    except asyncio.TimeoutError:
        if expected:
            log.warning(
                "Read motor status timed out, missing nodes: "
                f"{expected.difference(reported)}"
            )
        else:
            log.debug("Read motor status terminated, no missing nodes.")
    return reported


async def get_tip_motor_enabled(
    can_messenger: CanMessenger,
    node: NodeId,
    timeout: float = 0.5,
) -> bool:
    """Get motor status of a node."""

    def _filter(arbitration_id: ArbitrationId) -> bool:
        return (NodeId(arbitration_id.parts.originating_node_id) == node) and (
            MessageId(arbitration_id.parts.message_id) == GetStatusResponse.message_id
        )

    async def _wait_for_response(reader: WaitableCallback) -> bool:
        """Listener for receving motor status messages."""
        async for response, _ in reader:
            if isinstance(response, GearStatusResponse):
                return bool(response.payload.status.value)
        raise StopAsyncIteration

    with WaitableCallback(can_messenger, _filter) as reader:
        await can_messenger.send(node_id=node, message=GetStatusRequest())
        try:
            return await asyncio.wait_for(_wait_for_response(reader), timeout)
        except asyncio.TimeoutError:
            log.warning("Read tip motor status timed out")
            raise StopAsyncIteration
