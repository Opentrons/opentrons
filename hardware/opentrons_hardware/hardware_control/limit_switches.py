"""Utilities for reading the current status of the OT3 limit switches."""
import asyncio
import logging
from typing import cast, Dict, List

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import MessageId
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    ReadLimitSwitchRequest, ReadLimitSwitchResponse
)
from opentrons_hardware.firmware_bindings.utils import UInt8Field
from .types import NodeId

log = logging.getLogger(__name__)


async def get_limit_switches(
    can_messenger: CanMessenger,
    nodes: List[NodeId]
) -> Dict[NodeId, UInt8Field]:
    """Get state of limit switches for each node."""
    event = asyncio.Event()
    responses: Dict[NodeId, UInt8Field] = dict()

    def listener(message: MessageDefinition, arbitration_id: ArbitrationId) -> None:
        try:
            originator = NodeId(arbitration_id.parts.originating_node_id)
        except ValueError:
            log.warning(
                "unknown node id on network: "
                f"0x{arbitration_id.parts.originating_node_id:x}"
            )
            return
        if originator not in nodes:
            log.error(
                "got response from unexpected node id on network: "
                f"0x{arbitration_id.parts.originating_node_id:x}"
            )
            return
        if message.message_id != MessageId.limit_sw_response:
            log.warning(f"unexpected message id: 0x{message.message_id:x}")
            return
        response = cast(ReadLimitSwitchResponse, message)
        responses[originator] = response.payload.switch_status
        if len(responses) == len(nodes):
            event.set()

    can_messenger.add_listener(listener)
    for node in nodes:
        await can_messenger.send(
            node_id=node,
            message=ReadLimitSwitchRequest(),
        )
    try:
        await asyncio.wait_for(event.wait(), 1.0)
    except asyncio.TimeoutError:
        log.error(
            "limit switch request timed out before expected nodes responded"
        )
    finally:
        can_messenger.remove_listener(listener)
    return responses
