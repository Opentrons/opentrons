"""Utilities for managing the CANbus network on the OT3."""
import asyncio
import logging
from typing import Set, Optional
from opentrons_hardware.firmware_bindings import ArbitrationId
from opentrons_hardware.firmware_bindings.constants import NodeId
from opentrons_hardware.drivers.can_bus.can_messenger import CanMessenger
from opentrons_hardware.firmware_bindings.messages import payloads, MessageDefinition
from opentrons_hardware.firmware_bindings.messages.message_definitions import (
    DeviceInfoRequest,
)

mod_log = logging.getLogger(__name__)


async def probe(
    can_messenger: CanMessenger,
    expected: Optional[Set[NodeId]],
    timeout: Optional[float],
) -> Set[NodeId]:
    """Probe the bus and discover connected devices.

    Sends a status request to the broadcast address and waits for responses. Ends either
    when all nodes in expected respond or when a timeout happens, whichever is first. A
    None timeout is infinite and is not recommended, but could be useful if this is
    wrapped in a task and cancelled externally.

    The ideal call pattern is to build an expectation for nodes on the bus (i.e., fixed
    nodes such as gantry controllers and head plus whatever tools the head indicates
    are attached) and use this method to verify the assumption.
    """
    event = asyncio.Event()
    nodes: Set[NodeId] = set()

    def listener(message: MessageDefinition, arbitration_id: ArbitrationId) -> None:
        try:
            originator = NodeId(arbitration_id.parts.originating_node_id)
        except ValueError:
            mod_log.error(
                "unknown node id on network: "
                f"0x{arbitration_id.parts.originating_node_id:x}"
            )
            return
        mod_log.debug(f"got response from {arbitration_id.parts.originating_node_id}")
        nodes.add(originator)
        if expected and expected.issubset(nodes):
            event.set()

    can_messenger.add_listener(listener)
    await can_messenger.send(
        node_id=NodeId.broadcast,
        message=DeviceInfoRequest(),
    )
    try:
        await asyncio.wait_for(event.wait(), timeout)
    except asyncio.TimeoutError:
        if expected:
            mod_log.warning(
                "probe timed out before expected nodes found, missing "
                f"{expected.difference(nodes)}"
            )
        else:
            mod_log.debug("probe terminated (no expected set)")
    finally:
        can_messenger.remove_listener(listener)
    return nodes
