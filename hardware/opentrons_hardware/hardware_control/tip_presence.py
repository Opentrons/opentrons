"""Utilities for reading the current tip presence status of a pipette."""
import asyncio
import logging
from typing import Dict, Set, Callable, cast

from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import MessageId
from opentrons_hardware.firmware_bindings.messages import MessageDefinition
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    TipStatusQueryRequest,
    PushTipPresenceNotification,
)
from opentrons_hardware.firmware_bindings.constants import NodeId

log = logging.getLogger(__name__)


def _create_listener(
    node: NodeId, event: asyncio.Event, response: Dict[NodeId, int]
) -> Callable[[MessageDefinition, ArbitrationId], None]:
    def _listener(message: MessageDefinition, arbitration_id: ArbitrationId) -> None:
        try:
            originator = NodeId(arbitration_id.parts.originating_node_id)
        except ValueError:
            log.warning(
                "unknown node id on network: "
                f"0x{arbitration_id.parts.originating_node_id:x}"
            )
            return
        if originator != node:
            log.error(
                "got response from unexpected node id on network: "
                f"0x{arbitration_id.parts.originating_node_id:x}"
            )
            return
        if message.message_id == MessageId.error_message:
            log.error(f"recieved an error {str(message)}")
            return
        elif message.message_id != MessageId.tip_presence_notification:
            log.warning(f"unexpected message id: 0x{message.message_id:x}")
            return
        response[originator] = cast(
            PushTipPresenceNotification, message
        ).payload.ejector_flag_status.value
        event.set()

    return _listener


async def get_tip_status(
    can_messenger: CanMessenger, node: NodeId
) -> int:
    """Get the tip status for each node."""
    event = asyncio.Event()
    response: Dict[NodeId, int] = dict()
    listener = _create_listener(node, event, response)
    can_messenger.add_listener(listener)
    await can_messenger.send(
        node_id=node,
        message=TipStatusQueryRequest(),
    )
    try:
        await asyncio.wait_for(event.wait(), 1.0)
    except asyncio.TimeoutError:
        log.error("tip status request timed out before expected nodes responded")
    finally:
        can_messenger.remove_listener(listener)
    return response
