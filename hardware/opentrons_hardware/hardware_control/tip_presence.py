"""Utilities for reading the current status of the tip presence photointerrupter."""
import asyncio
import logging

from typing_extensions import Literal

from opentrons_hardware.firmware_bindings.arbitration_id import ArbitrationId

from opentrons_hardware.firmware_bindings.messages.messages import MessageDefinition
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    TipStatusQueryRequest,
    PushTipPresenceNotification,
)

from opentrons_hardware.firmware_bindings.constants import MessageId, NodeId, ErrorCode

log = logging.getLogger(__name__)


async def get_tip_ejector_state(
    can_messenger: CanMessenger,
    node: Literal[NodeId.pipette_left, NodeId.pipette_right],
) -> bool:
    """Get the state of the tip presence interrupter.

    When the tip ejector flag is occuluded, then we
    know that there is a tip on the pipette.
    """
    tip_ejector_state = False

    event = asyncio.Event()

    def _listener(message: MessageDefinition, arb_id: ArbitrationId) -> None:
        nonlocal tip_ejector_state
        if isinstance(message, PushTipPresenceNotification):
            event.set()
            tip_ejector_state = bool(message.payload.ejector_flag_status)

    def _filter(arbitration_id: ArbitrationId) -> bool:
        return (NodeId(arbitration_id.parts.originating_node_id) == node) and (
            MessageId(arbitration_id.parts.message_id)
            == MessageId.tip_presence_notification
        )

    can_messenger.add_listener(_listener, _filter)
    error = await can_messenger.ensure_send(
        node_id=node, message=TipStatusQueryRequest(), expected_nodes=[node]
    )

    if error != ErrorCode.ok:
        log.error(
            f"recieved error {str(error)} trying to get tip ejector status {str(node)}"
        )
    try:
        await asyncio.wait_for(event.wait(), 1.0)
    except asyncio.TimeoutError:
        log.error("tip ejector state request timed out before expected nodes responded")
    finally:
        can_messenger.remove_listener(_listener)
        return tip_ejector_state
